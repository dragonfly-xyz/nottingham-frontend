<script lang="ts">
    import { base } from "$app/paths";
    import { page } from "$app/stores";
    import { PUBLIC_DATA_URL } from "$env/static/public";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import Lede from "$lib/components/lede.svelte";
    import Page from "$lib/components/page.svelte";
    import Player from "$lib/components/player.svelte";
    import { createBusy, type BusyState } from "$lib/kit";
    import {
        formatScore,
      getSiteContext,
      type ScoredPlayer,
      type TournamentType,
    } from "$lib/site";
    import { UserError, cmpDate, getFriendlyErrorMsg } from "$lib/util";
    import { formatEther } from "viem";

    interface TournamentResult {
        id: string;
        season: number;
        time: Date;
        type: TournamentType;
        rankings: ScoredPlayer[];
        marketDayIndex?: number;
    }

    const { seasons } = getSiteContext();
    let seasonIdx: number | null = null;
    let data: BusyState<TournamentResult[]>;
    const dataAwait = createBusy<TournamentResult[]>(r => data = r);

    $: {
      parseQueryParams($page.url.searchParams);
    }

    $: {
      if (seasonIdx !== null) {
        dataAwait(async () => {
            if (seasonIdx === null) {
              throw new UserError('Invalid season');
            }
            const resp = await fetch(`${PUBLIC_DATA_URL}/results?season=${seasonIdx}`);
            if (!resp.ok) {
                console.error(await resp.text());
                throw new Error(resp.statusText);
            }
            const results = await resp.json();
            if (!results) {
              throw new UserError('Season not found.');
            }
            const sortedResults = results
              .map((r: any) => ({ ...r, time: new Date(r.time) }))
              .sort((a: any, b: any) => -cmpDate(a.time, b.time));
            let marketDayCounter = 0;
            for (const r of sortedResults) {
              if (r.type === 'scrimmage') {
                r.marketDayIndex = marketDayCounter++;
              }
            }
            return sortedResults;
        });
      }
    }

    function parseQueryParams(params: URLSearchParams): void {
      seasonIdx = Number(params.get('season') ?? '1') - 1;
      if (isNaN(seasonIdx)) {
        data = new UserError(`Invalid season`);
      }
    }
</script>

<style lang="scss">
  @use '../../../lib/styles/global.scss';
</style>
<Page title="Season Details">
  {#if data instanceof Promise}
  <div class="loading"><CatSpinner /></div>
  {:else if data instanceof Error}
  <CatSpinner failed />
  <div class="error">{getFriendlyErrorMsg(data)}</div>
  {:else if data && seasonIdx !== null}
  <Lede>
    <h1>
      Season {seasonIdx + 1}
    </h1>
    <div>
      Started on {$seasons[seasonIdx].startTime.toLocaleDateString()}
    </div>
    {#if $seasons[seasonIdx]?.closedTime}
    <div>
      Ended on: {$seasons[seasonIdx].closedTime?.toLocaleDateString()}
    </div>
    {/if}
    {#if $seasons[seasonIdx]?.prize > 0n}
    <div>
      Prize: {formatEther($seasons[seasonIdx].prize)} ETH
    </div>
    {/if}
  </Lede>
  {#each data as tournament, i}
  <div>
    <h2>
      {#if tournament.type === 'scrimmage'}
      Market Day {#if tournament.marketDayIndex !== undefined}{tournament.marketDayIndex + 1}{/if}
      {:else}
      Grand Faire
      {/if}
    </h2>
    <a href={`/tournament?season=${seasonIdx+1}&id=${tournament.id}`}>&gt;&gt; View tournament</a>
    <div>
      Time: {tournament.time.toLocaleString()}
    </div>
    <div>
      Players: {tournament.rankings.length}
    </div>
    <h3>Top {Math.min(tournament.rankings.length, 10)}</h3>
    <ol>
      {#each tournament.rankings.slice(0, 10) as player, i (player.address)}
      <li>
        <Player name={player.name} />:
        {formatScore(player.score)}
        {#if i === 0}🏆️{/if}
      </li>
      {/each}
    </ol>
  </div>
  {/each}
  {/if}
</Page>