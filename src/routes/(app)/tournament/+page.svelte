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
      type ScoredPlayer,
      type TournamentType,
    } from "$lib/site";
    import { getFriendlyErrorMsg } from "$lib/util";

    interface BracketInfo {
      idx: number;
      rankings: ScoredPlayer[],
      matches: string[];
    }

    interface TournamentData {
      id: string;
      time: Date;
      season: number;
      type: TournamentType,
      rankings: ScoredPlayer[],
      brackets: BracketInfo[],
    }

    let tournamentId: string | undefined;
    let tournamentIdx: number | undefined;
    let seasonIdx: number | undefined;
    let data: BusyState<TournamentData>;
    const dataAwait = createBusy<TournamentData>(r => data = r);

    $: {
      parseQueryParams($page.url.searchParams);
    }

    $: {
      if (tournamentId) {
        dataAwait(async () => {
            const resp = await fetch(`${PUBLIC_DATA_URL}/results/tournament?${
              new URLSearchParams({
                id: tournamentId!,
                season: seasonIdx!.toString(),
              })
            }`);
            if (!resp.ok) {
                console.error(await resp.text());
                throw new Error(resp.statusText);
            }
            const tournament = await resp.json();
            return {
              ...tournament,
              time: new Date(tournament.time),
              brackets: (tournament.brackets as BracketInfo[])
                .sort((a, b) => b.idx - a.idx),
            };
        });
      }
    }

    function parseQueryParams(params: URLSearchParams): void {
      tournamentId = params.get('id') ?? undefined;
      seasonIdx = Number(params.get('season') ?? '1') - 1;
      tournamentIdx = Number(params.get('idx') ?? NaN);
      if (isNaN(tournamentIdx)) {
        tournamentIdx = undefined;
      } else {
        tournamentIdx -= 1;
      }
    }
</script>

<style lang="scss">
  @use '../../../lib/styles/global.scss';

  .grid {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6ex;

    h3 {
      margin-bottom: 0.25em;
      border-bottom: 1px solid #777;
    }
  }

</style>


<Page title="Tournament Details">
  {#if data instanceof Promise}
  <div class="loading"><CatSpinner /></div>
  {:else if data instanceof Error}
  <CatSpinner failed />
  <div class="error">{getFriendlyErrorMsg(data)}</div>
  {:else if data}
  <Lede>
    <h1>
      {#if data.type == 'scrimmage'}
      Market Day {#if tournamentIdx !== undefined}{tournamentIdx + 1}{/if}
      {:else}
      Grand Faire
      {/if}
      Summary
    </h1>
    <div>
      <a href={`${base}/season?season=${data.season+1}`}>Season {data.season + 1}</a>
    </div>
    <div>
      Time: {data.time.toLocaleDateString()} {data.time.toLocaleTimeString()}
    </div>
  </Lede>
  <div>
    <h2>Final Ranking</h2>
    <ol>
      {#each data.rankings as player (player.address)}
      <li>
        <Player name={player.name} />:
        {formatScore(player.score)}
      </li>
      {/each}
    </ol>
  </div>
  <section>
    <h2>Brackets</h2>
    <div class="grid">
      {#each data.brackets as bracket (bracket.idx)}
      <div>
        <div>
          <h3>Bracket {bracket.idx + 1}</h3>
        </div>
        <div>
          Players: {bracket.rankings.length}
        </div>
        <div>
          Matches: {bracket.matches.length}
          ({bracket.matches.length / Math.ceil(bracket.rankings.length / 4)}pp)
        </div>
        <div>
          (<a href={`${base}/bracket?tournament=${data.id}&season=${data.season + 1}&bracket=${bracket.idx + 1}`}><!--
          -->view matches<!--
          --></a>)
        </div>
        <div>
          <h4>Bracket Ranking</h4>
          <ol>
            {#each bracket.rankings as player (player.address)}
            <li>
              <Player name={player.name} />:
              {formatScore(player.score)}
            </li>
            {/each}
          </ol>
        </div>
      </div>
      {/each}
    </div>
  </section>
  {/if}
</Page>