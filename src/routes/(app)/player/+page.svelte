<script lang="ts">
    import Page from "$lib/components/page.svelte";
    import { page } from "$app/stores";
    import { formatEther, keccak256, zeroHash, type Address, type Hex } from "viem";
    import { PUBLIC_DATA_URL } from "$env/static/public";
    import { formatScore, getSiteContext } from "$lib/site";
    import { encryptPlayerCode } from "$lib/encrypt";
    import Lede from "$lib/components/lede.svelte";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import { base } from "$app/paths";
    import {
    SeasonState,
        multiReadContestContract,
        multiWriteContestContract,
        waitForTxSuccess,
        writeContestContract,
        type SeasonInfo,
    } from "$lib/contest";
    import { UserError, getFriendlyErrorMsg, randomHex } from "$lib/util";
    import { createBusy, type BusyState } from "$lib/kit";

    interface TournamentResult {
        tournamentId: string;
        rank: number;
        totalPlayers: number;
        score: number;
        type: 'tournament' | 'scrimmage';
        time: Date;
        season: number;
    }

    const { wallet, publicClient, seasons } = getSiteContext();
    let loadingPlayer: BusyState;
    let submittingCodeState: BusyState<Hex | null>;
    let claimingPrizeState: BusyState;
    let loadingPlayerAwait = createBusy(r => loadingPlayer = r);
    let submittingCodeAwait = createBusy<Hex | null>(r => submittingCodeState = r);
    let claimingPrizeAwait = createBusy(r => claimingPrizeState = r);
    let rawCode: string | null = null;
    let playerStats: {
        playerAddress: Address;
        playerName: string;
        seasonResults: TournamentResult[][];
        userId: string;
    } | null = null;
    let isWalletOperator = false;
    let playerIsActive: boolean = false;
    let playerCanClaim: boolean = false;
    let playerPrize: bigint = 0n;
    let currentSeason: SeasonInfo | null = null;
    let profileUrl: string | null = null;
    let fileInputButton: HTMLInputElement;
    let expandedSeasons: boolean[] = [];

    $: loadPlayerFromSearchParams($page.url.searchParams);
    $: {
        currentSeason = $seasons[$seasons.length - 1] ?? null;
        if (currentSeason && playerStats) {
            playerPrize = $seasons
                .filter(s => s.winner === playerStats!.playerAddress).map(s => s.unclaimedPrize)
                .reduce((a, v) => a + v, 0n);
            populateOnchainState(
                currentSeason.idx,
                playerStats.playerAddress,
                $wallet?.address,
            );
        }
        expandedSeasons = $seasons.map((_, i) => expandedSeasons[i] ?? false );
    }
    $: {
        if (playerStats?.userId) {
            resolvePlayerProfile(playerStats.userId);
        }
    }

    async function resolvePlayerProfile(userId: string): Promise<void> {
        profileUrl = null;
        if (userId.startsWith('github:')) {
            const resp = await fetch(`https://api.github.com/user/${userId.slice(7)}`);
            const data = await resp.json();
            if (data.login) {
                profileUrl = `https://github.com/${data.login}`;
            }
        }
    }

    async function loadPlayerFromSearchParams(params: URLSearchParams): Promise<void> {
        let searchAddress: Address | null = params.get('address') as Address ?? null;
        let searchName: string | null = params.get('name') ?? null;
        if (searchAddress || searchName) {
            await loadingPlayerAwait(populatePlayerStats(searchAddress, searchName));
        } else {
            loadingPlayer = new Error('No player given');
        }
    }

    async function populateOnchainState(
        seasonIdx: number,
        playerAddress: Address,
        walletAddress: Address | undefined | null,
    ): Promise<void> {
        walletAddress = walletAddress ?? randomHex(20);
        const [isOperator, submittedCodeHash, canPlayerClaim] = await
            multiReadContestContract<[boolean, Hex, boolean]>({
                client: publicClient,
                calls: [
                    { fn: 'operators', args: [playerAddress, walletAddress]},
                    { fn: 'playerCodeHash', args: [seasonIdx, playerAddress] },
                    { fn: 'canPlayerClaim', args: [playerAddress] },
                ],
            });
        isWalletOperator = isOperator || walletAddress === playerAddress;
        playerIsActive = submittedCodeHash !== zeroHash;
        playerCanClaim = canPlayerClaim;
    }

    async function populatePlayerStats(
        searchAddress: Address | null,
        searchName: string | null,
    ): Promise<void> {
        const resp = await fetch(`${PUBLIC_DATA_URL}/player-stats?${
            new URLSearchParams({
                ...(searchAddress
                    ? { address: searchAddress! }
                    : { name: searchName! }
                ),
            })}`,
        );
        if (!resp.ok) {
            if (resp.status === 404) {
                throw new UserError(`Player not found`);
            }
            try {
                throw new UserError(await resp.json());
            } catch {
                throw new UserError(`Failed to load`);
            }
        }
        const r = await resp.json() as {
            address: Address;
            name: string;
            created: string;
            userId: string;
            performance: Array<{
                rank: number;
                totalPlayers: number;
                time: string;
                score: number;
                type: 'scrimmage' | 'tournament';
                tournamentId: string;
                season: number;
            }>;
        };
        const tournamentsBySeason = [] as Array<TournamentResult[]>;
        for (const t of r.performance) {
            const tournaments = tournamentsBySeason[t.season]
                = tournamentsBySeason[t.season] ?? [];
            tournaments.push({
               ...t,
               time: new Date(t.time) ,
            });
        }
        tournamentsBySeason.reverse();
        for (const [i, tournaments] of tournamentsBySeason.entries()) {
            if (tournaments) {
                tournaments.sort((a, b) => b.time.getTime() - a.time.getTime());
            } else {
                tournamentsBySeason[i] = [];
            }
        }
        playerStats = {
            playerAddress: r.address,
            playerName: r.name,
            seasonResults: tournamentsBySeason,
            userId: r.userId,
        };
    }

    function onSubmitCode() {
        submittingCodeAwait(async () => {
            if (!rawCode) {
                throw new UserError('Invalid bytecode hex.');
            }
            let code = rawCode;
            if (!code.startsWith('0x')) {
                code = `0x${code}`;
            }
            if (!/^0x[a-f0-9]*$/i.test(code) && code.length % 2 !== 0) {
                throw new UserError('Invalid bytecode hex.');
            }
            const hexCode = code as Hex;
            const codeHash = keccak256(hexCode);
            const encrypted = await encryptPlayerCode(
                currentSeason!.publicKey!,
                playerStats!.playerAddress,
                hexCode,
            );
            let txHash: Hex;
            try {
                txHash = await writeContestContract({
                    client: $wallet!.client,
                    fn: 'submitCode',
                    args: [
                        currentSeason!.idx,
                        playerStats!.playerAddress,
                        codeHash, encrypted,
                    ],
                });
            } catch (err: any) {
                if (/rejected/.test(err.message ?? '')) {
                    return null;
                }
                throw err;
            }
            console.debug(`TX submitted: ${txHash}`);
            await waitForTxSuccess(publicClient, txHash);
            playerIsActive = true;
            return txHash;
        });
    }
    
    function onClaimPrize() {
        claimingPrizeAwait(async () => {
            if (!$wallet || !playerStats) {
                return;
            }
            let winningSeasons = $seasons
                .filter(s => s.winner === playerStats?.playerAddress)
                .map(s => s.idx);
            if (winningSeasons.length === 0) {
                return;
            }
            const [...winnersAndPrizes] = await multiReadContestContract
                <Array<[Address, bigint, bigint]>>({
                client: $wallet.client,
                calls: winningSeasons.map(idx => ({
                    fn: 'winner', args: [idx],
                })),
            });
            winningSeasons = winningSeasons
                .filter((_, i) => winnersAndPrizes[i][2] !== 0n);
            if (winningSeasons.length === 0) {
                return;
            }
            await multiWriteContestContract({
                client: $wallet.client,
                calls: winningSeasons.map(idx => 
                    ({ fn: 'claim', args: [idx, $wallet.address]})
                ),
            });
            playerPrize = 0n;
        });
    }

    async function onBytecodeDrop(e: DragEvent): Promise<void> {
        const item = e.dataTransfer?.items[0];
        if (item) {
            if (item.type !== 'application/json' && item.type !== 'text/plain') {
                submittingCodeState = new UserError('Not a JSON compiler artifact.');
                return;
            }
            const contents = await item.getAsFile()?.text() as string;
            try {
                rawCode = findBytecode(JSON.parse(contents));
            } catch (err) {
                if (err instanceof UserError) {
                    submittingCodeState = err;
                    throw err;
                }
                submittingCodeState = new UserError('Artifact not valid JSON.');
            }
        }
    }
   
    function findBytecode(artifact: any): Hex {
        const HEX_RE = /^0x[0-9a-f]*$/;
        let v = artifact?.bytecode?.object;
        if (typeof(v) === 'string' && HEX_RE.test(v)) {
            return addHexPrefix(v);
        }
        v = artifact?.bytecode;
        if (typeof(v) === 'string' && HEX_RE.test(v)) {
            return addHexPrefix(v);
        }
        throw new UserError('Cannot find bytecode in artifact.');
    }

    function addHexPrefix(s: string): Hex {
        if (!s.startsWith('0x')) {
            return `0x${s}`;
        }
        return s as Hex;
    }

    async function populateCodeInputFromFileInput(): Promise<void> {
        const file = fileInputButton.files?.[0];
        if (!file) {
            rawCode = '0x';
            return;
        }
        try {
            rawCode = findBytecode(JSON.parse(await file?.text()));
        } catch {
            submittingCodeState = new UserError(`Not a JSON compiler artifact.`);
        }
    }
</script>

<style lang="scss">
    @import "../../../lib/styles/global.scss";

    .season {
        .tournament-result {
            display: grid;
            grid: auto / repeat(5, 1fr);
            flex-direction: row;
            gap: 1ex;
    
            &.header {
                text-decoration: underline;
                margin-bottom: 0.5em;
            }

            &.optional {
                display: none;
            }
        }

        button.expand {
            margin-left: 3ex;
        }
    
        &.expanded {
            button.expand {
                display: none;
            }
            .optional {
                display: grid;
            }
        }
    }

    .submit-bytecode {
        display: flex;
        flex-direction: column;
        .bytecode {
            font-family: monospace;
            font-size: 1.1em;
            letter-spacing: -0.33ex;
            display: block;
            width: 0 auto;
        }

        .buttons {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
        }
    }

    .name {
        font-size: 1.25em;
        color: rgb(37, 73, 181) !important;
    }

    .error {
        text-align: center;
        margin: 1em 0;
        color: red;
    }

    .address {
        text-overflow: ellipsis;
        overflow: hidden;
    }

    input[type='file'] {
        display: none;
    }

</style>

<Page title="Player Dashboard">
    <Lede>
        <h1>Merchant Details</h1>
        {#if playerStats}
        <div>
            Name:
            {#if profileUrl}
            <a class="name" target="_blank" href={profileUrl}>{playerStats.playerName}</a>
            {:else}
            <span class="name">{playerStats.playerName}</span>
            {/if}
        </div>
        <div class="address">
            Address: <a class="address" href={`${publicClient?.chain?.blockExplorers?.default.url}address/${playerStats.playerAddress}`} target="_blank">{playerStats.playerAddress}</a>
        </div>
        <div class="is-active">
            {#if playerIsActive}
            Submission received ✓
            {:else}
            Awaiting submission ✘
            {/if}
        </div>
        {/if}
    </Lede>
    {#if loadingPlayer instanceof Promise}
    <section class="loading">
        <CatSpinner />
    </section>
    {:else if loadingPlayer instanceof Error}
    <section class="not-found">
        <div>{getFriendlyErrorMsg(loadingPlayer)}</div>
    </section>
    {:else if playerStats}
    <section class="stats">
        {#if playerPrize > 0n && $wallet?.address == playerStats.playerAddress}
        <div class="alert">
            {#if playerCanClaim}
            <p>
                You have {formatEther(playerPrize)} ETH in unclaimed prizes!
                <button
                    on:click={() => onClaimPrize()}
                    disabled={claimingPrizeState instanceof Promise}
                    aria-busy={claimingPrizeState instanceof Promise}
                >
                    Claim Prize
                </button>
            </p>
            {:else}
            <p>
                You have {formatEther(playerPrize)} ETH in unclaimed prizes! Look for an email from a "@dragonfly.xyz" address in the next few days with further instructions on how to claim.
            </p>
            {/if}
        </div>
        {/if}
        <h2>Performance History</h2>
        {#if !playerStats.seasonResults?.length}
        <p><em>This player has not competed in any games.</em></p>
        {:else}
        {#each playerStats.seasonResults as szn, i (i)}
        {#if szn.length}
        <div class="season" class:expanded={expandedSeasons[i]}>
            <h3>Season {playerStats.seasonResults.length - i}</h3>
            <div class="tournament-result header">
                <div>Date</div>
                <div>Type</div>
                <div>Rank</div>
                <div>Score</div>
            </div>
            {#each szn.slice(0, 10) as tr (tr.tournamentId)}
            <div class="tournament-result">
                <div>
                    <a href={`${base}/tournament?season=${tr.season + 1}&id=${tr.tournamentId}`}>
                        {tr.time.toLocaleDateString()}
                    </a>
                </div>
                <div>{tr.type === 'scrimmage' ? 'Market Day' : 'Grand Faire'}</div>
                <div>{tr.rank+1} / {tr.totalPlayers}</div>
                <div>{formatScore(tr.score)}</div>
            </div>
            {/each}
            {#if szn.length > 10}
            <button class="expand custom" on:click={() => expandedSeasons[i] = true}>
                [+] Show {szn.length - 10} more
            </button>
            {#each szn.slice(10) as tr (tr.tournamentId)}
            <div class="tournament-result optional">
                <div>
                    <a href={`${base}/tournament?season=${tr.season + 1}&id=${tr.tournamentId}`}>
                        {tr.time.toLocaleDateString()}
                    </a>
                </div>
                <div>{tr.type === 'scrimmage' ? 'Market Day' : 'Grand Faire'}</div>
                <div>{tr.rank+1} / {tr.totalPlayers}</div>
                <div>{formatScore(tr.score)}</div>
            </div>
            {/each}
            {/if}
        </div>
        {/if}
        {/each}
        {/if}
    </section>
    <section class="tools">
        {#if !currentSeason
            || currentSeason.state !== SeasonState.Started
            || currentSeason.isTerminal}
        <div>Current season is closed and cannot accept new submissions at this time.</div>
        {:else if isWalletOperator}
        <section>
            <h2>Submit code for season {(currentSeason.idx ?? 0) + 1}</h2>
            {#if !playerIsActive}
            <p>
                You have not submitted player code for the current season, so you are not participating in any games!
            </p>
            {:else}
            <p>
                You have already submitted your player code for the current season but you can replace your submission as often as you'd like up until the season close.
            </p>
            {/if}
            <p>
                Code submissions are posted onchain but remain encrypted until the end of the current season, when the Grand Faire occurs.
            </p>
            <p>
                You can either drop your player's compiled (JSON) artifact file onto the text box below or you can manually paste the hex bytecode yourself.
                If you're developing in the provided foundry project, you can find can your player artifacts in the <tt>/out</tt> folder under a folder of the same name as your contract file.
            </p>
            <p>
                If you're inputing your code manually, make sure you provide the <em>undeployed</em> bytecode and not the "deployed" one. These are typically named <tt>bytecode</tt> and <tt>deployedBytecode</tt>, respectively, in compiler artifacts.
            </p>
            <div>
                <form on:submit|preventDefault={onSubmitCode} class="submit-bytecode">
                    <textarea
                        class="bytecode"
                        placeholder="Drop JSON artifact or paste (hex) bytecode"
                        on:drop|preventDefault={onBytecodeDrop}
                        on:dragover|preventDefault
                        bind:value={rawCode}
                        />
                    <div class="buttons">
                        <input type="file" bind:this={fileInputButton} on:change={() => populateCodeInputFromFileInput()}/>
                        <button class="file" on:click|preventDefault={() => fileInputButton.click()}>
                            Choose artifact
                        </button>
                        <button
                            aria-busy={submittingCodeState instanceof Promise}
                            disabled={!rawCode || submittingCodeState instanceof Promise}
                        >
                            {#if typeof(submittingCodeState) === 'string'
                                && submittingCodeState !== '0x'}
                            Code Submitted!
                            {:else}
                            Submit Code
                            {/if}
                        </button>
                    </div>
                    {#if submittingCodeState instanceof Error}
                    <div class="error">
                        {getFriendlyErrorMsg(submittingCodeState)}
                    </div>
                    {/if}
                </form>
            </div>
        </section>
        {/if}
    </section>
    {/if}
</Page>