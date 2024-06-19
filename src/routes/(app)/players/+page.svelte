<script lang="ts">
    import Page from "$lib/components/page.svelte";
    import { page } from "$app/stores";
    import { zeroHash, type Address, type Hex } from "viem";
    import { goto, replaceState } from "$app/navigation";
    import { browser } from "$app/environment";
    import { PUBLIC_DATA_URL } from "$env/static/public";
    import Lede from "$lib/components/lede.svelte";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import { createBusy, type BusyState } from "$lib/kit";
    import { fetchJson, getFriendlyErrorMsg } from "$lib/util";
    import * as oskill from 'openskill';
    import Player from "$lib/components/player.svelte";
    import { multiReadContestContract } from "$lib/contest";
    import { getSiteContext } from "$lib/site";
    import type { Rating } from "openskill/dist/types";

    interface Player {
        name: string;
        address: Address;
        created: Date;
        submitted: boolean;
        skill: number;
        skillDelta: number;
    }

    const { publicClient, seasons } = getSiteContext();
    let busyState: BusyState;
    const busyAwait = createBusy(s => busyState = s);
    enum SortOption {
        Name = 'name',
        Joined = 'joined',
        Skill = 'skill',
    }
    export let sortBy: string | undefined = undefined;
    let players = [] as Player[];

    $: {
        const querySortBy = $page.url.searchParams.get('sortBy');
        if (sortBy && querySortBy !== sortBy) {
            $page.url.searchParams.set('sortBy', sortBy);
            replaceState(`?${$page.url.searchParams.toString()}`, history.state);
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
            const [playersResult, tournamentsResult] = await Promise.all([
                fetchJson(`${PUBLIC_DATA_URL}/players`)
                    .catch(() => { throw new Error(`Failed to fetch players.`); }),
                fetchJson(`${PUBLIC_DATA_URL}/results?season=${$seasons.length == 0 ? 0 : $seasons.length - 1}`)
                    .catch(() => { throw new Error(`Failed to fetch players.`); }),
            ]);
            const [skills, skillDeltas] = ratePlayerSkills(playersResult.map(
                (p: any) => p.address),
                tournamentsResult.map((t: any) => ({
                    time: new Date(t.time).getTime(),
                    rankings: t.rankings.sort((a: any, b: any) => b.score - a.score),
                }))
                .sort((a: any, b: any) => a.time - b.time)
                .slice(-12)
                .map((r: any) => r.rankings),
            );
            const players_ = playersResult.map((p: any, i: number) => ({
                name: p.name,
                address: p.address,
                created: new Date(p.created),
                submitted: false,
                skill: skills[i],
                skillDelta: skillDeltas[i],
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
            sortBy = $page.url.searchParams.get('sortBy') as any ?? SortOption.Skill;
        })());
    }

    function ratePlayerSkills(
        players: Address[],
        tournamentsRankings: Address[][],
    ): [Array<number | null>, Array<number | null>] {
        const ratings = Object.assign({},
            ...players.map(p => ({ [p]: oskill.rating() })),
        ) as { [player: string]: Rating };
        let prevRatings = {} as typeof ratings;
        const hasCompeted = {} as { [player: string]: boolean };
        for (const rankings of tournamentsRankings) {
            Object.assign(hasCompeted, ...rankings.map(r => ({ [r.address]: true })));
            const players = rankings.map(a => [ratings[a.address] ?? oskill.rating()]);
            Object.assign(ratings,
                ...oskill.rate(players)
                .filter((_, i) => !!ratings[rankings[i].address])
                .map((r, i) => ({ [rankings[i].address]: r[0] })),
            );
            prevRatings = Object.assign({},
                ...rankings.map((r, i) => ({ [r.address]: players[i][0] })),
            );
        }
        const ords = players.map(p => oskill.ordinal(ratings[p]));
        const prevOrds = players.map(p => prevRatings[p]
            ? oskill.ordinal(prevRatings[p])
            : oskill.ordinal(ratings[p]),
        );
        const normalizedOrds = normalizeOrdinals(ords);
        const normalizedPrevOrds = normalizeOrdinals(prevOrds);
        return [
            normalizedOrds.map((o, i) => hasCompeted[players[i]]
                ? o : null,
            ),
            normalizedPrevOrds.map((o, i) => hasCompeted[players[i]]
                ? normalizedOrds[i] - o : null,
            ),
        ];
    }

    function sortPlayers(players_: Player[], sortBy_: typeof sortBy): Player[] {
        if (sortBy_ === SortOption.Joined) {
            players_.sort((a, b) => a.created.getTime() - b.created.getTime());
        } else if (sortBy === SortOption.Skill) {
            players_.sort((a, b) => (b.skill ?? -1) - (a.skill ?? -1));
        } else {
            players_.sort((a, b) => a.name.localeCompare(b.name));
        }
        return players_;
    }

    function normalizeOrdinals(ords: number[]): number[] {
        if (ords.length === 0) {
            return [];
        }
        const [minOrd, maxOrd] = ords.reduce(
            ([min_, max_], o) => [Math.min(min_, o), Math.max(max_, o)],
            [ords[0], ords[0]],
        );
        return ords.map(o => (o - minOrd) / (maxOrd - minOrd));
    }
</script>

<style lang="scss">
    @use '../../../lib/styles/global.scss' as *;

    ol {
        max-width: min-content;
        padding-inline-start: 0;
        display: table;

        @include mobile {
            display: block;
            max-width: none;
            // width: 100%;
        }

        li {
            display: table-row;

            > .joined {
                opacity: 0.85;
            }

            @include desktop {
                > * {
                    display: table-cell;
                    width: fit-content;
                    white-space: nowrap;
                    padding: 0.1em 1ex;
                }
            }

            @include mobile {
                display: flex;
                flex-direction: row;
                // width: 100%;
                flex-wrap: wrap;
                gap: 1ex;

                > * {
                    padding: 0 !important;
                }
    
                > .name {
                    text-align: left;
                }
    
                > .joined {
                    margin-left: 4ex;
                    flex: 1 0 100%;
                }

                &:not(:last-child) {
                    margin-bottom: 1em;
                }
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

    .delta {
        font-size: 0.8em;

        .increased {
            color: green;
            &::before {
                content: '+';
            }
        }
    
        .decreased {
            color: red;
            &::before {
                content: '-';
            }
        }
    }

    .disclaimer {
        font-size: 0.9em;
        margin-top: 2em;
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
            {#each [
                [SortOption.Name, 'Name'], 
                [SortOption.Joined, 'Date joined'],
                [SortOption.Skill, 'Skill*'],
            ] as [opt, text]}<!--
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
                    <div class="counter">{i + 1}.</div>
                    <div class="name"><Player name={player.name} /></div>
                    <div class="submitted">
                        {#if player.skill !== null}
                        💪 <span class="skill">{Math.ceil(player.skill * 100)}</span>
                        {#if player.skillDelta}
                        <span class="delta">
                        (<!--
                            --><span
                                class:increased={player.skillDelta > 0}
                                class:decreased={player.skillDelta < 0
                                }><!--
                                -->{Math.ceil(Math.abs(player.skillDelta) * 100)}<!--
                            --></span><!--
                        -->)
                        </span>
                        {/if}
                        {:else if player.submitted}
                        ⏱️
                        {/if}
                    </div>
                    <div class="joined">Joined {player.created.toLocaleDateString()}</div>
                </li>
                {/each}
            </ol>
            {:else}
            <div>No registered players.</div>
            {/if}
        </div>
        {/if}
        <div class="disclaimer">
            (*) "Skill" is a <a href="https://openskill.me/en/stable/" target="_blank">metric</a> based on final ranking from the last 12 tournaments this season, normalized between 0-100.
        </div>
    </section>
</Page>