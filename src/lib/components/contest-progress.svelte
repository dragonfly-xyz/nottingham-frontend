<script lang="ts">
    import {
        type TournamentType,
        getSiteContext,
        type ScoredPlayer,
        SCHEDULE,
    } from "$lib/site";
    import { PUBLIC_DATA_URL } from "$env/static/public";
    import { formatEther } from 'viem';
    import { ONE_DAY_MS, ONE_HOUR_MS, ONE_MINUTE_MS, cmpDate, getFriendlyErrorMsg } from "$lib/util";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import { base } from "$app/paths";
    import { createBusy, type BusyState } from "$lib/kit";
    import { onDestroy, onMount } from "svelte";
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
    let refreshTimer: NodeJS.Timeout | null = null;
    export let maxTournaments = 5;

    onMount(() => {
        refreshTimer = setInterval(async () => {
            // Silent refresh on interval.
            tournamentsBySeason = await fetchTournaments();
        }, 60e3);
        (async () => {
            tournamentsBySeason = await loadAwait(fetchTournaments());
        })();
    });

    onDestroy(() => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    })

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

    function getProjectedEndTime(seasonIdx: number): Date | null {
        if (!SCHEDULE[seasonIdx]) {
            return null;
        }
        return SCHEDULE[seasonIdx];
    }

    function getHumanTimeLeft(when: Date): string {
        const dt = when.getTime() - Date.now();
        if (dt > ONE_DAY_MS) {
            return `${Math.round(dt / ONE_DAY_MS)} days`;
        }
        if (dt >= ONE_HOUR_MS * 2) {
            return `${Math.round(dt / ONE_HOUR_MS)} hours`;
        }
        if (dt > ONE_HOUR_MS) {
            return `${Math.round(dt / ONE_HOUR_MS)} hour`;
        }
        if (dt > ONE_MINUTE_MS * 2) {
            return `${Math.round(dt / ONE_HOUR_MS)} minutes`;
        }
        return `a few seconds`;
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
    {#each $seasons
        .filter(s => !s.isTerminal).slice()
        .sort((a, b) => cmpDate(b.startTime, a.startTime)) as szn (szn.idx)}
    <div class="season">
        <h3>
            <img class="leaf" src={`${base}/leaf.png`} alt="season" />
            <a href={`${base}/season?season=${szn.idx + 1}`}>Season {szn.idx + 1}</a>
            <span class="smaller">
                {#if szn.closedTime}
                (Ended on {szn.closedTime.toLocaleDateString()})
                {:else}
                {#if getProjectedEndTime(szn.idx)}
                (Ends in {getHumanTimeLeft(getProjectedEndTime(szn.idx) ?? new Date(0))})
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
            {#each tournamentsBySeason[szn.idx].slice().sort((a, b) => cmpDate(b.time, a.time)).slice(0, maxTournaments) as t, j (j)}
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
            {#if tournamentsBySeason[szn.idx].length > maxTournaments}
            <div class="more">
                <a href={`${base}/season?season=${szn.idx + 1}`}>{tournamentsBySeason[szn.idx].length - maxTournaments} more tournaments...</a>
            </div>
            {/if}
            {:else}
            <div>
                {#if szn.submissionsCount < 4}
                Games begin after 4 players submit code.
                {:else}
                Received at least 4 submissions. Games will begin soon.
                {/if}
            </div>
            {/if}
        </div>
    </div>
    {/each}
    {:else}
    <div>No games have been played yet.</div>
    {/if}
</div>