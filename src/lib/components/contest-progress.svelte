<script lang="ts">
    import {
        type TournamentType,
        getSiteContext,
        type ScoredPlayer,
    } from "$lib/site";
    import { PUBLIC_DATA_URL, PUBLIC_SEASON_DURATION_SECONDS } from "$env/static/public";
    import { formatEther } from 'viem';
    import { ONE_DAY_MS, cmpDate, getFriendlyErrorMsg } from "$lib/util";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import { base } from "$app/paths";
    import { createBusy, type BusyState } from "$lib/kit";
    import { onMount } from "svelte";
    import Player from "./player.svelte";

    interface TournamentResult {
        id: string;
        season: number;
        time: Date;
        type: TournamentType;
        rankings: ScoredPlayer[];
    }

    const { seasons } = getSiteContext();
    let loadState: BusyState;
    const loadAwait = createBusy(r => loadState = r);
    let tournamentsBySeason: Record<number, TournamentResult[]> = {};

    onMount(async () => {
        tournamentsBySeason = await loadAwait(fetchTournaments);
    });

    async function fetchTournaments(): Promise<typeof tournamentsBySeason> {
        const resp = await fetch(`${PUBLIC_DATA_URL}/results`);
        if (!resp.ok) {
            console.error(await resp.text());
            throw new Error(resp.statusText);
        }
        const tourneys = (await resp.json()).map((t: any) => ({
            ...t,
            time: new Date(t.time),
        })) as TournamentResult[];
        return tourneys.reduce(
            (a, t) => Object.assign(a,
                { [t.season]: [ ...(a[t.season] ?? []), t], },
            ),
            {} as typeof tournamentsBySeason,
        );
    }

    function getProjectedEndTime(startTime: Date): Date {
        return new Date(startTime.getTime() + Number(PUBLIC_SEASON_DURATION_SECONDS) * 1e3);
    }
</script>

<style lang="scss">
    @use '../styles/global.scss' as *;

    .smaller {
        font-size: 0.66em;
    }

    .season {
        > h3 {
            margin-bottom: 0.25em;
            .leaf {
                height: 1.25em;
                margin-bottom: -0.25em;
            }
        }

        > .tournaments {
            margin-left: 5ex;
           
            > .entry {
                display: flex;
                flex-wrap: wrap;
                gap: 0 2ex;
                margin-bottom: 0.25em;

                > h3 {
                    margin: 0;
                }
                > .link {
                    order: 100;
                    margin-left: 2ex;

                    @include mobile {
                        flex: 1 0 100%;
                        margin-left: 0;
                    }
                }
            }
        }
    }
</style>

<div>
    {#if loadState instanceof Promise}
    <CatSpinner />
    {:else if loadState instanceof Error}
    <CatSpinner failed />
    <div class="error">{getFriendlyErrorMsg(loadState)}</div>
    {:else if $seasons.length > 0}
    {#each $seasons.slice().sort((a, b) => cmpDate(b.startTime, a.startTime)) as szn (szn.idx)}
    <div class="season">
        <h3>
            <img class="leaf" src={`${base}/leaf.png`} alt="season" />
            Season {szn.idx + 1}
            <span class="smaller">
                {#if szn.closedTime}
                (Ended on {szn.closedTime.toLocaleDateString()})
                {:else}
                {#if (getProjectedEndTime(szn.startTime).getTime() - Date.now()) < ONE_DAY_MS}
                (Ends in less than a day)
                {:else}
                (Ends in {Math.round((getProjectedEndTime(szn.startTime).getTime() - Date.now()) / ONE_DAY_MS)} days)
                {/if}
                {/if}
            </span>
            {#if szn.prize && szn.prize > 0n}
            <span class="smaller">
                ({formatEther(szn.prize)} ETH prize)
            </span>
            {/if}
        </h3>
        <div class="tournaments">
            {#if tournamentsBySeason[szn.idx]?.length}
            {#each tournamentsBySeason[szn.idx].slice().sort((a, b) => cmpDate(b.time, a.time)) as t, j (j)}
            <div class="entry">
                <h3>
                    <a href={`${base}/tournament?season=${szn.idx + 1}&id=${t.id}`}>
                        {#if t.type == 'scrimmage'} Market Day{:else}Grand Faire{/if}
                    </a>
                </h3>
                <div class="field">
                    on {t.time.toLocaleDateString()}
                </div>
                <div class="field">
                    Winner:
                    {#if t.rankings[0]?.name}
                    <Player name={t.rankings[0].name} />
                    {:else}
                    None
                    {/if}
                </div>
            </div>
            {/each}
            {:else}
            <div>No games.</div>
            {/if}
        </div>
    </div>
    {/each}
    {:else}
    <div>No games have been played yet.</div>
    {/if}
</div>