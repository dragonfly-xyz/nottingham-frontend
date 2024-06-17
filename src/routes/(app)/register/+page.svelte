<script lang="ts">
    import { onMount } from "svelte";
    import Page from "$lib/components/page.svelte";
    import { INVITE_ONLY, getSiteContext } from "$lib/site";
    import { PUBLIC_GH_CLIENT_ID, PUBLIC_REGISTRAR_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { ONE_HOUR, UserError, getFriendlyErrorMsg, randomHex } from "$lib/util";
    import { goto } from "$app/navigation";
    import {
        hexToNumber,
        keccak256,
        sliceHex,
        stringToBytes,
    } from "viem";
    import Lede from "$lib/components/lede.svelte";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import {
        CONTEST_ADDRESS,
        readContestContract,
        waitForTxSuccess,
        writeContestContract,
    } from "$lib/contest";
    import { createBusy, type BusyState } from "$lib/kit";
    import { base } from "$app/paths";

    const {
        wallet,
        publicClient,
    } = getSiteContext();
    let busyState: BusyState;
    const busyAwait = createBusy(r => busyState = r);
    const redirectUrl = (() => {
        const url = new URL($page.url);
        url.search = '';
        url.searchParams.append('callback', '');
        return url.toString();
    })();
    const REGISTER_REQUEST_DOMAIN_PARTIAL = {
        name: 'Nottingham',
        version: '1',
        verifyingContract: CONTEST_ADDRESS,
    } as const;

    let registered: boolean = false;
    let authCode: string | null = null;
    let authInfo: {
        userId: string;
        email: string | null;
        hmac: string;
    } | null = null;
    let inviteCode: string | null = null;
    let playerName: string | null = null;
    let email: string | null = null;
    let twitter: string | null = null;
    let termsAgreed: boolean = false;
    let adultAgreed: boolean = false;
    let talentAgreed: boolean = true;
    let singletonAgreed: boolean = false;

    $: {
        if (registered && playerName) {
            goto(`./player?${new URLSearchParams({ name: playerName }).toString()}`);
        }
    }

    async function login(): Promise<void> {
        const loginUrl = new URL('https://github.com/login/oauth/authorize');
        const state = randomHex();
        localStorage.setItem('ghAuthState', state);
        loginUrl.searchParams.append('prompt', 'consent');
        loginUrl.searchParams.append('client_id', PUBLIC_GH_CLIENT_ID);
        loginUrl.searchParams.append('redirect_uri', redirectUrl);
        loginUrl.searchParams.append('scope', ['user:email'].join(' '));
        loginUrl.searchParams.append('state', state);
        window.location.href = loginUrl.toString();
    }

    onMount(async () => {
        authCode = $page.url.searchParams.get('code');
        const state = $page.url.searchParams.get('state');
        if (!authCode || !state) {
            return;
        }
        {
            const url = new URL($page.url);
            url.search = '';
            goto(url);
        }
        const expectedState = localStorage.getItem('ghAuthState');
        if (state !== expectedState) {
            console.error(`Incorrect state hash from OAuth redirect!`);
            return;
        }
        await busyAwait((async () => {
            const resp = await fetch(`${PUBLIC_REGISTRAR_URL}/redeem`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    githubAuth: authCode,
                    redirectUri: redirectUrl,
                }),
            });
            if (!resp.ok) {
                const { error: errorMsg } = await resp.json();
                throw new UserError(`Failed OAuth step: ${errorMsg}`);
            }
            const user = await resp.json();
            authInfo = { userId: user.userId, email: user.email, hmac: user.hmac };
            email = authInfo.email;
            playerName = (user.name as string).toLowerCase().replaceAll(/[^a-z0-9_]/g,'');
        })());
    });

    async function register(): Promise<void> {
        if (!playerName || !authInfo) {
            return;
        }
        await busyAwait((async () => {
            const registeredBlock = await readContestContract({
                client: publicClient,
                fn: 'playerRegisteredBlock',
                args: [$wallet!.address],
            });
            if (registeredBlock !== 0n) {
                throw new UserError(`Address is already registered`);
            }
            let confirmation;
            {
                const expiry = Math.floor(Date.now() / 1e3) + ONE_HOUR;
                const signature = await ($wallet?.client! as any).signTypedData({
                    account: $wallet?.address!,
                    domain: { ...REGISTER_REQUEST_DOMAIN_PARTIAL, chainId: $wallet!.chain!.id },
                    types: {
                        'Register Request': [
                            { name: 'name', type: 'string' },
                            { name: 'expiry', type: 'uint256' },
                            { name: 'auth', type: 'string' },
                        ]
                    },
                    primaryType: 'Register Request',
                    message: {
                        name: playerName,
                        expiry: BigInt(expiry),
                        auth: keccak256(stringToBytes(authInfo.userId)),
                    },
                });
                const resp = await fetch(`${PUBLIC_REGISTRAR_URL}/register`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        name: playerName,
                        ...authInfo,
                        expiry,
                        signature,
                        inviteCode: inviteCode ?? undefined,
                        email,
                        talentOptIn: talentAgreed,
                        twitter: twitter ?? undefined,
                    }),
                });
                if (!resp.ok) {
                    const { error: errorMsg } = await resp.json();
                    throw new UserError(`Failed to request registration: ${errorMsg}`);
                }
                confirmation = (await resp.json()).confirmation;
            }
            const txHash = await writeContestContract({
                client: $wallet!.client,
                fn: 'register',
                args: [
                    $wallet!.address,
                    {
                        expiry: confirmation.expiry,
                        nonce: confirmation.nonce,
                        metadata: confirmation.metadata,
                        r: sliceHex(confirmation.signature, 0, 32),
                        s: sliceHex(confirmation.signature, 32, 64),
                        v: hexToNumber(sliceHex(confirmation.signature, 64)),
                    },
                ],
            });
            console.info(`Registration tx hash: ${txHash}`);
            await Promise.all([
                (async () => {
                    const resp = await fetch(`${PUBLIC_REGISTRAR_URL}/confirm`, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            address: $wallet!.address,
                            txHash,
                        }),
                    });
                    if (!resp.ok) {
                        const { error: errorMsg } = await resp.json();
                        throw new UserError(`Failed to confirm registration: ${
                            errorMsg}`);
                    }
                })(),
                waitForTxSuccess(publicClient, txHash),
            ]);
            registered = true;
        })());
    }
</script>

<style lang="scss">
    @use "../../../lib/styles/global.scss" as *;

    .error {
        margin: 1em auto;
        color: red;
    }

    .auth-form {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        iframe {
            display: block;
            width: 90%;
            height: 16em;
            margin: 0 auto;
            background-color: transparent;
        }

        .checkboxes {
            margin-top: 1em;
        }

        button {
            display: block;
            margin: 0 auto;
        }
    }

    .register-form {
        margin: 0 auto;
        width: fit-content;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        align-items: center;

        .inputs {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 2ex;

            @include mobile {
                flex-direction: column;
            }

            .field {
                display: flex;
                flex-direction: column;
            }
        }
    }

</style>

<Page title="Register Merchant">
    <Lede>
        <h1>Registration</h1>
    </Lede>
    <section />
    {#if !authInfo && !(busyState instanceof Promise)}
    <section>
        <form class="auth-form" on:submit|preventDefault={() => login()}>
            <iframe src={`${base}/terms/rules.html`} title="rules" />
            <div class="checkboxes">
                <div>
                    <input
                        type="checkbox" bind:checked={termsAgreed}
                        id="terms-agree"
                        disabled={busyState instanceof Promise}
                    />
                    <label for="terms-agree">
                        I agree to the
                        <a href={`${base}/rules`} target="_blank">Contest Rules</a> and
                        <a href={`${base}/privacy`} target="_blank">Privacy Agreement</a>.
                    </label>
                </div>
                <div>
                    <input
                        type="checkbox" bind:checked={adultAgreed}
                        id="adult-agree"
                        disabled={busyState instanceof Promise}
                    />
                    <label for="adult-agree">
                        I confirm that I am at least 18 years of age.
                    </label>
                </div>
                <div>
                    <input
                        type="checkbox" bind:checked={singletonAgreed}
                        id="singleton-agree"
                        disabled={busyState instanceof Promise}
                    />
                    <label for="singleton-agree">
                        I agree to compete under only a single player account, whether individually or as part of a team.
                    </label>
                </div>
                <div>
                    <input
                        type="checkbox" bind:checked={talentAgreed}
                        id="talent-agree"
                        disabled={busyState instanceof Promise}
                    />
                    <label for="talent-agree">
                        Please reach out to me about opportunities in the Dragonfly portfolio.
                    </label>
                </div>
            </div>
            <div>
                <p>
                    This game is strictly for nerds 🤓! &nbsp;Players must have a qualifying Github account to register.
                </p>
                <button
                type="submit"
                disabled={busyState instanceof Promise
                    || !termsAgreed || !adultAgreed || !singletonAgreed}
                aria-busy={busyState instanceof Promise}
                >
                Connect to Github
                </button>
            </div>
        </form>
    </section>
    {:else if authInfo}
    {#if $wallet}
    <section>
        <p>
            The connected wallet address ({$wallet.address}) will <em>publicly</em> identify your merchant and will be used to make code submissions and claim prizes. You can authorize other addresses to submit code on your behalf, but only this address can ever claim prizes. <em>You cannot change it afterwards</em>.
        </p>
        <p>
            We are required to KYC and potentially collect tax information from winners before they are able to claim their prize. Please provide an active email address where we can reach you in the event that you are declared a winner. Be on the lookout for a "@dragonfly.xyz" email.
        </p>
    </section>
    <section>
        <form class="register-form" on:submit|preventDefault={() => register()}>
            <div class="inputs">
                {#if INVITE_ONLY}
                <div class="field">
                    <label for="invite-code">Invite Code</label>
                    <input placeholder="Invite code" bind:value={inviteCode} id="invite-code" />
                </div>
                {/if}
                <div class="field">
                    <label for="name">Player Name*</label>
                    <input
                        id="name"
                        placeholder="My_merchant"
                        bind:value={playerName}
                        pattern="^[a-z0-9_]+$"
                        minlength="3"
                        maxlength="32"
                        required />
                </div>
                <div class="field">
                    <label for="email">Email*</label>
                    <input
                        id="email"
                        placeholder="Email"
                        bind:value={email}
                        type="email"
                        minlength="3"
                        maxlength="96"
                        required
                         />
                </div>
                <div class="field">
                    <label for="twitter">Twitter/X handle</label>
                    <input
                        id="twitter"
                        placeholder="(optional)"
                        bind:value={twitter}
                        minlength="3"
                        maxlength="96"
                         />
                </div>
            </div>
            <p>
                Your wallet will need to be supplied with a very small amount of ETH (much less than $1 worth) on the {$wallet.chain.name} network to complete registration and to make all future code submissions.{#if $wallet.chain.id === 324}  You can quickly bridge ETH from Ethereum to {$wallet.chain.name} <a href="https://portal.zksync.io/bridge/" target="_blank">here</a>.{/if}
            </p>
            <div>
                <button
                    type="submit"
                    disabled={busyState instanceof Promise || registered}
                    aria-busy={busyState instanceof Promise}
                >
                    Register
                </button>
            </div>
        </form>
    </section>
    {:else}
    <section>
        <p>Connect your wallet to continue</p>
    </section>
    {/if}
    {/if}
    {#if busyState instanceof Error}
    <section class="error">
        {getFriendlyErrorMsg(busyState)}
    </section>
    {:else if busyState instanceof Promise}
    <section class="spinner">
        <CatSpinner />
    </section>
    {/if}
</Page>