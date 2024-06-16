<script lang="ts">
    import {
        type SiteContext,
        type Wallet,
        SITE_CONTEXT_NAME,
        createPublicClient,
        MAINTENANCE_MODE,
        ANNOUNCEMENT,
        LAUNCHED,
    } from "$lib/site";
    import WalletHost from "$lib/components/wallet-host.svelte";
    import { onDestroy, onMount, setContext } from "svelte";
    import {
        type Address,
        type Chain,
        type WalletClient,
    } from "viem";
    import { PUBLIC_DATA_URL } from "$env/static/public";
    import IconButton from "$lib/components/icon-button.svelte";
    import { base } from "$app/paths";
    import {
        fetchContestState,
        type SeasonInfo,
    } from "$lib/contest";
    import { createReadable } from "$lib/kit";

    const publicClient = createPublicClient();
    const [ wallet, setWallet] = createReadable<Wallet | null>(null);
    const [ playerName, setPlayerName ] = createReadable<string | null>(null);
    const [ seasons, setSeasons ] = createReadable<SeasonInfo[]>([]);

    let connecting = false;
    let audio: HTMLAudioElement;
    let refreshTimer: NodeJS.Timeout | null = null;;

    setContext(SITE_CONTEXT_NAME, {
        wallet,
        playerName,
        publicClient,
        seasons,
    } satisfies SiteContext);

    onMount(() => {
        if (LAUNCHED) {
            loadContestState();
            refreshTimer = setInterval(loadContestState, 60e3);
        }
    });

    onDestroy(() => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    })

    function onConnected(e: CustomEvent<{
        address: Address;
        client: WalletClient;
        chain: Chain;
    }>) {
        console.debug('wallet connected');
        connecting = false;
        setWallet({
            address: e.detail.address,
            client: e.detail.client,
            chain: e.detail.chain,
        });
    }

    function onDisconnected() {
        console.debug('wallet disconnected');
        connecting = false;
        setWallet(null);
        setPlayerName(null);
    }

    function onConnecting() {
        console.debug('wallet connecting');
        connecting = true;
    }

    $: {
        if ($wallet) {
            (async () => {
                setPlayerName(null);
                const resp = await fetch(`${PUBLIC_DATA_URL}/whois?${new URLSearchParams({
                    address: $wallet.address,
                })}`);
                if (!resp.ok) {
                    if (resp.status !== 404) {
                        const { error: errorMsg } = await resp.json();
                        throw new Error(`Failed to fetch players: ${errorMsg}`);
                    }
                    return;
                }
                setPlayerName((await resp.json()).name);
            })();
        }
    }

    async function loadContestState(): Promise<void> {
        setSeasons(await fetchContestState(publicClient));
        // HACK: Need to do this to trigger updates for other subscribers.
        $seasons;
    }

    function toggleMusic() {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }
</script>

<style lang="scss">
    @use '../../lib/styles/global.scss' as *;

    header {
        @extend .written-font;
        margin: 0 2ex 1rem 2ex; 
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;

        @include mobile {
            flex-direction: column;
            gap: 1em;
        }

        > .left {
            display: flex;
            align-self: start;
            justify-content: center;
            flex-wrap: wrap;

            @include mobile {
                flex-direction: row;
                align-self: center;
            }
            
            > *:not(:last-child)::after {
                content: '|';
                margin: 0 0.5ex;
            }
        }

        > .right {
            align-self: end;
            display: flex;
            justify-content: right;
            flex-wrap: wrap;

            @include mobile {
                align-self: center;
            }
            
            > *:not(:last-child)::after {
                content: '|';
                margin: 0 0.5ex;
            }
        }


        .wallet-status {
            vertical-align: top;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 2ex;

            .wallet-address {
                display: inline-block;
                overflow: hidden;
                max-width: 128px;
                text-overflow: ellipsis;
                white-space: nowrap;
                vertical-align: top;
    
            }
            .player-name {
                text-decoration: underline;
            }
        }
    }
    
    .tome {
        --border-width: 4rem;
        --border-padding: 1.5rem;

        position: relative;
        min-height: calc(100vh - 2 * (var(--border-width) + var(--border-padding)));
        padding: calc(var(--border-width) + var(--border-padding));
        border-image: url('/page-border.png') 15.5% 16% / var(--border-width) round;
        font-size: 1.25rem;
        
        @include mobile {
            font-size: 1.1rem;
            padding: calc(var(--border-width) + var(--border-padding)) 0;
            border-image: url('/page-border.png') 15.5% 15% / var(--border-width) 0 round;
        }
        
        > .bg {
            pointer-events: none;
            position: absolute;
            z-index: -100;
            inset: 0;
            background: url('/aged-paper.png');
            background-size: 100% auto;
            background-repeat: cover repeat;
            background-color: rgb(140, 88, 52);
            background-blend-mode: hard-light;
            mix-blend-mode: multiply;

        }
        > .ghost {
            overflow-y: hidden; 
            position: absolute;
            z-index: -100;
            bottom: 10vh;
            left: -10ex;
            mix-blend-mode: color-burn;
            opacity: 0.75;
            width: 90%;

            @include mobile {
                width: 100%;
                left: 0;
            }
        }
        > .music-toggle {
            cursor: pointer;
            position: fixed;
            right: 0;
            top: 0;
            width: var(--border-width);
            height: var(--border-width);
        }
        
        > .content {
            @extend .content-font;
            max-width: 1024px;
            margin: 0 auto;
            overflow: visible;

            @include mobile {
                padding: 0 1ex;
            }
        }
    }

    .announcement {
        @extend .alert;
        padding: 1.5em 4ex;
        min-width: 16ex;
        margin-top: 0;
        color: rgb(176, 130, 23); 
        font-size: 1.05em;
    }
</style>

<div class="tome">
    <img class="ghost" src={`${base}/fair.png`} alt="" />
    <div class="bg">
        <audio bind:this={audio}>
            <source type="audio/mpeg" src={`${base}/lute.mp3`} />
        </audio>
    </div>
    <a class="music-toggle" on:click|preventDefault={() => toggleMusic()} />
    {#if MAINTENANCE_MODE}
    <div class="content">
        <div class="maintenance">
            Woe is us! We are beset by fleas!
        </div>
    </div>
    {:else}
    <div class="content">
        {#if ANNOUNCEMENT}
        <div class="announcement">
            {ANNOUNCEMENT}
        </div>
        {/if} 
        {#if LAUNCHED}
        <header>
            <div class="left">
                <div>
                    <a href={`${base}/`}>Home</a>
                </div>
                <div>
                    <a href={`${base}/#progress`}>Progress</a>
                </div>
                {#if !$playerName}
                <div>
                    <a href={`${base}/register`}>Register</a>
                </div>
                {/if}
                {#if $playerName}
                <div>
                    <a href={`${base}/player?name=${$playerName}`}>Dashboard</a>
                </div>
                {/if}
                <div>
                    <a href={`${base}/players`}>Merchants</a>
                </div>
                <div>
                    <a href="https://jobs.dragonfly.xyz/jobs" target="_blank">Jobs</a>
                </div>
            </div>
            <div class="right">
                <div>
                    <WalletHost
                        on:connected={onConnected}
                        on:disconnected={onDisconnected}
                        on:connecting={onConnecting}
                    >
                        <div slot="default" let:connectWallet let:disconnectWallet>
                            <div class="wallet-status">
                                {#if connecting}
                                <span>Unlacing... </span>
                                {:else if !$wallet}
                                <a href="#" on:click|preventDefault={() => connectWallet()}>Unlace thy purse</a>
                                <IconButton
                                    on:click={() => connectWallet()}
                                    icon="purse-closed"
                                    hoverIcon="purse-open"
                                    title="Connect wallet" />
                                {:else}
                                <span>
                                    Hail,
                                    {#if $playerName}
                                    <a
                                        href={`${base}/player?name=${$playerName}`}
                                        class="player-name"
                                    >{$playerName}</a>!
                                    {:else}
                                    <span class="wallet-address">{$wallet.address}</span>!
                                    {/if}
                                </span>
                                <IconButton
                                    on:click={() => disconnectWallet()}
                                    icon="purse-open"
                                    hoverIcon="purse-closed"
                                    title="Disconnect wallet" />
                                {/if}
                            </div>
                        </div>
                    </WalletHost>
                </div>
            </div>
        </header>
        {/if}
        <main>
            <slot></slot>
        </main>
    </div>
    {/if}
</div>