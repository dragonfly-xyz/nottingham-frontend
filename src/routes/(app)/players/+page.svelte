<script lang="ts">
    import Page from "$lib/components/page.svelte";
    import { page } from "$app/stores";
    import { zeroHash, type Address, type Hex } from "viem";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";
    import { PUBLIC_DATA_URL } from "$env/static/public";
    import Lede from "$lib/components/lede.svelte";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import { createBusy, type BusyState } from "$lib/kit";
    import { UserError, getFriendlyErrorMsg } from "$lib/util";
    import Player from "$lib/components/player.svelte";
    import { multiReadContestContract } from "$lib/contest";
    import { getSiteContext } from "$lib/site";

    interface Player {
        name: string;
        address: Address;
        created: Date;
        submitted: boolean;
    }

    const { publicClient, seasons } = getSiteContext();
    let busyState: BusyState;
    const busyAwait = createBusy(s => busyState = s);
    enum SortOption {
        Name = 'name',
        Joined = 'joined',
        LastTournamentScore = 'tournament',
        LastScrimmage = 'scrimmage',
    }
    export let sortBy: string | undefined = undefined;
    let players = [] as Player[];

    $: {
        const querySortBy = $page.url.searchParams.get('sortBy');
        if (sortBy && querySortBy !== sortBy) {
            $page.url.searchParams.set('sortBy', sortBy);
            if (browser) {
                goto(`?${$page.url.searchParams.toString()}`);
            }
        }
    }
    $: {
        if ($seasons.length) {
            fetchPlayers();
        }
    }
    $: {
        if (sortBy) {
            players = sortPlayers(players, sortBy);
        }
    }

    async function fetchPlayers(): Promise<void> {
        return busyAwait((async () => {
            const resp = await fetch(`${PUBLIC_DATA_URL}/players`, {
                headers: {
                    'content-type': 'application/json',
                },
            });
            if (!resp.ok) {
                const { error: errorMsg } = await resp.json();
                throw new UserError(`Failed to fetch players: ${errorMsg}`);
            }
            const players_ = (await resp.json()).map((p: any) => ({
                name: p.name,
                address: p.address,
                created: new Date(p.created),
                submitted: false,
            })) as Player[];
            if ($seasons.length) {
                const playerCodeHashes = await multiReadContestContract<Hex[]>({
                    client: publicClient,
                    calls: players_.map(p => ({
                        fn: 'playerCodeHash', args: [$seasons.length - 1, p.address],
                    })),
                });
                for (let i = 0; i < playerCodeHashes.length; ++i) {
                    players_[i].submitted = playerCodeHashes[i] !== zeroHash;
                }
            }
            players = players_;
            sortBy = $page.url.searchParams.get('sortBy') as any ?? 'name';
        })());
    }

    function sortPlayers(players_: Player[], sortBy_: typeof sortBy): Player[] {
        if (sortBy_ === 'joined') {
            players_.sort((a, b) => a.created.getTime() - b.created.getTime());
        } else {
            players_.sort((a, b) => a.name.localeCompare(b.name));
        }
        return players_;
    }
</script>

<style lang="scss">
    @use '../../../lib/styles/global.scss' as *;

    ol {
        max-width: min-content;
        padding-inline-start: 0;
        display: table;
        li {
            display: table-row;

            > * {
                display: table-cell;
                padding: 0.1em 1ex;
                width: fit-content;
                white-space: nowrap;
            }

            > .submitted {
                color: green;
            }
        }
    }

    .sort-options {
        display: flex;
        gap: 1ex;
        > .opt:not(:last-child)::after {
            content: ', ';
        }
        > .opt:last-child::after {
            content: '.';
        }
    }
</style>

<Page title="Merchant Dashboard">
   <Lede>
       <h1>Merchants</h1>
   </Lede> 
    <section>
        <div class="sort-options">
            <div>
                Sort by
            </div>
            {#each [ [SortOption.Name, 'Name'], [SortOption.Joined, 'Date joined']] as [opt, text]}<!--
            --><div class="opt"><!--
                --><a href="." on:click|preventDefault={() => sortBy = opt}>{text}</a><!--
            --></div><!--
            -->{/each}
        </div>
        {#if busyState instanceof Promise}
        <div class="spinner">
            <CatSpinner />
        </div>
        {:else if busyState instanceof Error}
        <div class="error">
            <CatSpinner failed />
            {getFriendlyErrorMsg(busyState)}
        </div>
        {:else}
        <div class="players-list">
            {#if players.length}
            <ol>
                {#each players as player, i (player.address)}
                <li>
                    <div>{i + 1}.</div>
                    <div><Player name={player.name} /></div>
                    <div class="submitted">
                        {#if player.submitted}
                        📄 ✓
                        {/if}
                    </div>
                    <div>Joined {player.created.toLocaleDateString()}</div>
                </li>
                {/each}
            </ol>
            {:else}
            <div>No registered players.</div>
            {/if}
        </div>
        {/if}
    </section>
</Page>