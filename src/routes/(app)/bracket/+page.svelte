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

  interface ScoredMatchPlayer extends ScoredPlayer {
    gasUsed: number;
  }

  interface BracketData {
    tournamentId: string;
    time: Date;
    season: number;
    type: TournamentType;
    bracket: number;
    rankings: ScoredPlayer[],
    matches: Array<{
      id: string;
      duration: number;
      rounds?: number;
      rankings: ScoredMatchPlayer[];
    }>;
  }

  let tournamentId: string | undefined;
  let seasonIdx: number | undefined;
  let bracketIdx: number | undefined;
  let data: BusyState<BracketData>;
  const dataAwait = createBusy<BracketData>(r => data = r);
  let filterUserName: string | null = null;

  $: {
    parseQueryParams($page.url.searchParams);
  }

  $: {
    if (tournamentId && seasonIdx !== undefined && bracketIdx !== undefined) {
      dataAwait(async () => {
          const resp = await fetch(`${PUBLIC_DATA_URL}/results/bracket?${
            new URLSearchParams({
              tournament: tournamentId!,
              season: seasonIdx!.toString(),
              bracket: bracketIdx!.toString(),
            })
          }`);
          if (!resp.ok) {
              console.error(await resp.text());
              throw new Error(resp.statusText);
          }
          const bracket = await resp.json();
          return {
            ...bracket,
            time: new Date(bracket.time),
          };
      });
    }  else {
      data = new Error('Not Found');
    }
  }

  function parseQueryParams(params: URLSearchParams): void {
    tournamentId = params.get('tournament') ?? undefined;
    seasonIdx = Number(params.get('season') ?? '1') - 1;
    bracketIdx = Number(params.get('bracket') ?? '1') - 1;
  }

  function testUserNameFilter(filter: string | null, names: string[]): boolean {
    const needle = (filter ?? '').replaceAll(/\s/g, '');
    if (!needle) {
      return true;
    }
    return names.some(n => n.toLocaleLowerCase().includes(needle));
  }
</script>

<style lang="scss">
  @use '../../../lib/styles/global.scss' as *;

  .matches {
    .summary {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
    .matches-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0 6ex;

      .match {
        width: fit-content;
        
        h3 {
          margin-bottom: 0.25em;
          border-bottom: 1px solid #777;
        }
        ol {
          margin-top: 0;
        }
      }
    }
  }

  .smaller {
    font-size: 0.8em;
  }

</style>

<Page title="Bracket Details">
  {#if data instanceof Promise}
  <div class="loading"><CatSpinner /></div>
  {:else if data instanceof Error}
  <CatSpinner failed />
  <div class="error">{getFriendlyErrorMsg(data)}</div>
  {:else if data}
  <Lede>
    <h1>
      Bracket {data.bracket + 1}
    </h1>
    <div class="date">{data.time.toLocaleString()}</div>
    <div>
      <a href={`${base}/season?&season=${data.season + 1}`}>
        Season {data.season + 1}
      </a>
    </div>
    <div>
      <a href={`${base}/tournament?id=${data.tournamentId}&season=${data.season + 1}`}>
        {#if data.type == 'scrimmage'}Market Day{:else}Grand Faire{/if}
      </a>
    </div>
  </Lede>
  <section>
    <h2>Bracket Ranking</h2>
    <ol>
      {#each data.rankings as player (player.address)}
      <li>
        <Player name={player.name} />:
        {formatScore(player.score)}
      </li>
      {/each}
    </ol>
  </section>
  <section class="matches">
    <h2>Matches</h2>
    <div class="summary">
      <div>
        Players: {data.rankings.length},
        Matches: {data.matches.length}
        ({data.matches.length / Math.ceil(data.rankings.length / 4)}pp)
      </div>
      <input type="text" class="filter" placeholder="username" bind:value={filterUserName} />
    </div>
    <div class="matches-grid">
      {#each data.matches as match, i (match.id)}
      {#if testUserNameFilter(filterUserName, match.rankings.map(r => r.name))}
      <div class="match">
        <h3>
          Match {i + 1}
          <a
            class="smaller"
            href={`${base}/match?tournament=${data.tournamentId}&season=${data.season + 1}&bracket=${data.bracket + 1}&match=${match.id}&idx=${i+1}`}
          >
            {#if match.rounds !== undefined}
            ({match.rounds}/32 rounds)
            {:else}
            (details)
            {/if}
          </a>
        </h3>
        <ol>
          {#each match.rankings as player (player.address)}
          <li>
            <Player name={player.name} />:
            {player.score.toFixed(3)}</li>
          {/each}
        </ol>
      </div>
      {/if}
      {/each}
    </div>
  </section>
  {/if}
</Page>