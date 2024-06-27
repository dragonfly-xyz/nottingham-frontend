<script lang="ts">
  import * as Pancake from '@sveltejs/pancake';
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { PUBLIC_DATA_URL } from "$env/static/public";
  import CatSpinner from "$lib/components/cat-spinner.svelte";
  import Lede from "$lib/components/lede.svelte";
  import Page from "$lib/components/page.svelte";
  import { createBusy, type BusyState } from "$lib/kit";
  import {
    type ScoredPlayer,
    type TournamentType,
  } from "$lib/site";
  import { type Address } from "viem";
  import { UserError, getFriendlyErrorMsg } from "$lib/util";
    import Player from "$lib/components/player.svelte";

  interface ScoredMatchPlayer extends ScoredPlayer {
    gasUsed: number;
    idx: number; 
    scoreAssetIdx: number;
  }

  interface MatchLog {
    event: string;
    [name: string]: any;
  }

  interface MatchData {
    tournamentId: string;
    time: Date;
    season: number;
    type: TournamentType;
    bracket: number;
    duration: number;
    players: ScoredMatchPlayer[];
    undeployedPlayers: string[];
    rounds: Round[];
    winnerIdx: number;
  }

  interface Swap {
    playerIdx: number;
    fromAssetIdx: number;
    toAssetIdx: number;
    fromAmount: number;
    toAmount: number;
  }

  interface Block {
    swaps: Swap[];
    bids: number[];
    builderIdx: number;
  }

  interface Round {
    market?: number[];
    resupply: number[][];
    leaks: number[];
    block: Block | null;
    balances: number[][];
    balanceDeltas: number[][];
  }

  interface SwapsByPlayer {
    playerIdx: number;
    swaps: Swap[];
  }

  const ASSET_EMOJIS = [ '🪙', '🍅', '🍞', '🐟️', '🥕', '👕' ];

  let tournamentId: string | undefined;
  let seasonIdx: number | undefined;
  let bracketIdx: number | undefined;
  let matchId: string | undefined;
  let matchIdx: number | undefined;
  let data: BusyState<MatchData>;
  const dataAwait = createBusy<MatchData>(r => data = r);
  let isRoundExpanded: boolean[] = [];
  let focusedPlayer: ScoredMatchPlayer | null = null;

  $: {
    parseQueryParams($page.url.searchParams);
  }

  $: {
    if (tournamentId && seasonIdx !== undefined && bracketIdx !== undefined && matchId) {
      dataAwait(async () => {
          const resp = await fetch(`${PUBLIC_DATA_URL}/results/match?${
            new URLSearchParams({
              tournament: tournamentId!,
              season: seasonIdx!.toString(),
              bracket: bracketIdx!.toString(),
              id: matchId!.toString(),
            })
          }`);
          if (!resp.ok) {
              console.error(await resp.text());
              throw new Error(resp.statusText);
          }
          const r = await resp.json();
          const {
            rounds,
            players,
            undeployedPlayers,
          }  = parseRawLogs(JSON.parse(r.logs));
          return {
            tournamentId: r.tournamentId,
            season: r.season,
            type: r.type,
            bracket: r.bracket,
            duration: r.duration,
            players: players.map((addr, i) => ({
              ...r.players.find((p: any) => p.address === addr),
              idx: i,
              scoreAssetIdx: rounds[rounds.length - 1].balances[i]
                .slice(1)
                .map((a, i) => [i, a])
                .sort((a, b) => b[1] - a[1])
                .map(([i]) => i)[0] + 1,
            })),
            undeployedPlayers: undeployedPlayers.map(addr =>
              r.players.find((p: any) => p.address === addr).name
            ),
            time: new Date(r.time),
            rounds: rounds,
            winnerIdx: players.findIndex(a => a === r.players[0].address),
          };
      });
    } else {
      data = new UserError('Not found');
    }
  }

  $: {
    if (data && !(data instanceof Promise) && !(data instanceof Error)) {
      isRoundExpanded = [...new Array(data.rounds.length)].map(() => false);
    } else {
      isRoundExpanded = [];
    }
  }

  interface ParsedLogs {
    rounds: Round[];
    players: Address[];
    undeployedPlayers: Address[];
  }

  function parseRawLogs(logs: MatchLog[]): ParsedLogs {
    const undeployedPlayers = logs.filter(
        log => log.event === 'create_player_failed'
      ).map(log => log.player);
    const gameCreatedLogIdx = logs.findIndex(log => log.event === 'game_created');
    const marketInitializedLogIdx = logs.findIndex(log => log.event === 'market_initialized');
    const initialMarketBalances = marketInitializedLogIdx !== -1
      ? logs[marketInitializedLogIdx].reserves.map((r: bigint) => Number(r) / 1e18)
      : undefined;
    const players = logs[gameCreatedLogIdx].players;
    const rounds = [] as Round[];
    for (let roundStart = gameCreatedLogIdx + 1; roundStart < logs.length;) {
      const roundEnd = findLogEventIdx('round_played', logs, roundStart) + 1;
      if (roundEnd <= roundStart) {
        break;
      }
      const round = parseRoundFromLogs({
        playerCount: players.length,
        logs,
        start: roundStart,
        end: roundEnd,
        lastRoundBalances: rounds[rounds.length - 1]?.balances ?? undefined,
        lastRoundMarketBalances: rounds[rounds.length - 1]?.market ?? initialMarketBalances,
      });
      rounds.push(round);
      roundStart = roundEnd;
    }
    return {rounds, players, undeployedPlayers};
  }

  function parseRoundFromLogs(opts: {
    lastRoundMarketBalances?: number[],
    lastRoundBalances?: number[][];
    playerCount: number;
    logs: MatchLog[];
    start: number;
    end: number;
  }): Round {
    const { playerCount, start, end, logs } = opts;
    const resupply = createPlayerBalancesArrays(playerCount);
    const lastRoundBalances = opts.lastRoundBalances ??
      createPlayerBalancesArrays(playerCount);
    const market = opts.lastRoundMarketBalances
      ? opts.lastRoundMarketBalances.slice()
      : undefined;
    const balances = opts.lastRoundBalances
      ? opts.lastRoundBalances.slice().map(v => v.slice())
      : createPlayerBalancesArrays(playerCount);
    let i = start;
    for (; i < end; ++i) {
      const log = logs[i];
      if (log.event === 'mint') {
        const a = Number(log.assetAmount) / 1e18;
        resupply[log.playerIdx][log.assetIdx] += a;
        balances[log.playerIdx][log.assetIdx] += a;
      } else {
        break;
      }
    }
    let block: Block | null = null;
    const blockBuiltIdx = findLogEventIdx('block_built', logs, i, end);
    if (blockBuiltIdx !== -1) {
      const bids = createBalanceArray(playerCount);
      const builderIdx: number = logs[blockBuiltIdx].builderIdx;
      for (; i < blockBuiltIdx; ++i) {
        const log = logs[i];
        if (log.event === 'block_bid') {
          bids[log.builderIdx] = Number(log.bid) / 1e18;
        } else if (log.event === 'build_block_failed') {
          bids[log.builderIdx] = NaN;
        } else {
          break;
        }
      }
      const swaps: Swap[] = [];
      for (; i < blockBuiltIdx; ++i) {
        const log = logs[i];
        if (log.event === 'swap' && log.fromAmount !== '0') {
          const swap = {
            playerIdx: log.playerIdx,
            fromAmount: Number(log.fromAmount) / 1e18,
            toAmount: Number(log.toAmount) / 1e18,
            fromAssetIdx: log.fromAssetIdx,
            toAssetIdx: log.toAssetIdx,
          };
          swaps.push(swap);
          balances[swap.playerIdx][swap.fromAssetIdx] -= swap.fromAmount;
          balances[swap.playerIdx][swap.toAssetIdx] += swap.toAmount;
          if (market) {
            market[swap.fromAssetIdx] += swap.fromAmount;
            market[swap.toAssetIdx] -= swap.toAmount;
          }
        }
      }
      balances[builderIdx][0] -= bids[builderIdx];
      block = { bids, builderIdx, swaps };
    } else {
      i = findLogEventIdx('empty_block', logs, i, end);
      if (i === -1) {
        throw new Error(`Parse error: Expected empty block`);
      }
    }
    const leaks = createBalanceArray(playerCount);
    for (let i = start; i < end; ++i) {
      const log = logs[i];
      if (log.event !== 'leaked') {
        continue;
      }
      const amount = Number(log.assetAmount) / 1e18;
      if (market) {
        market[log.assetIdx] -= amount;
      }
      leaks[log.assetIdx] = amount;
    }
    return {
      market,
      leaks,
      resupply,
      block,
      balances,
      balanceDeltas: balances.map(
        (p, i) => p.map((b, j) => b - lastRoundBalances[i][j]),
      ),
    };
  }

  function createBalanceArray(playerCount: number): number[] {
    return [... new Array(playerCount)].fill(0);
  }

  function createPlayerBalancesArrays(playerCount: number): number[][] {
    return [... new Array(playerCount)]
      .map(() => [...new Array(playerCount)].fill(0));
  }

  function findLogEventIdx(name: string, logs: MatchLog[], start: number, end?: number): number {
    end = Math.min(logs.length, end ?? logs.length);
    let idx = start;
    for (; idx < end; ++idx) {
      if (logs[idx].event === name) {
        return idx;
      }
    }
    return -1;
  }

  function parseQueryParams(params: URLSearchParams): void {
    tournamentId = params.get('tournament') ?? undefined;
    seasonIdx = Number(params.get('season') ?? '1') - 1;
    bracketIdx = Number(params.get('bracket') ?? '1') - 1;
    matchIdx = Number(params.get('idx') ?? NaN);
    if (isNaN(matchIdx)) {
      matchIdx = undefined;
    } else {
      matchIdx -= 1;
    }
    matchId = params.get('match') ?? undefined;
  }

  const TRIM_ZEROES_REGEX = /(\.?0+(e[-+]\d+)|\.?0+)$/;

  function formatAmount(amount: number): string {
    let s = '0';
    if (amount === 0) {
      return s;
    } else if (Math.abs(amount) > 1e-5) {
      s = amount.toFixed(4);
    } else {
      s = amount.toExponential(4);
    }
    return s.replace(TRIM_ZEROES_REGEX, '$2');
  }

  function formatAmountDelta(amount: number): string {
    const s = formatAmount(amount);
    return amount < 0 ? s : `+${s}`;
  }

  function getAssetEmoji(assetIdx: number): string {
    return ASSET_EMOJIS[assetIdx] ?? '?';
  }

  function sortIndices<T>(arr: T[], keyFn: (v: T) => number): number[] {
    const keys = arr.map(keyFn);
    return arr.map((_, i) => i).sort((a, b) => keys[a] - keys[b]);
  }

  function batchSwapsByPlayer(swaps: Swap[]): SwapsByPlayer[] {
    const swapsByPlayer = [] as SwapsByPlayer[];
    let currentBatch = null as SwapsByPlayer | null;
    for (const swap of swaps) {
      if (!currentBatch || currentBatch.playerIdx !== swap.playerIdx) {
        currentBatch = { playerIdx: swap.playerIdx, swaps: [] };
        swapsByPlayer.push(currentBatch);
      }
      currentBatch.swaps.push(swap);
    }
    return swapsByPlayer;
  }
</script>

<style lang="scss">
  @use '../../../lib/styles/global.scss' as *;

  .round-header {
    display: flex;
    flex-direction: row;
    width: 100%;
    align-items: baseline;
    gap: 1ex;

    > .left, > .right {
      background: url('/charcoal-hl.png') repeat-x;
      background-size: 18ex 120%;
      height: 1em;
    }
    > .left {
      flex: 0 1 2ex;
    }
    > .right {
      flex: 1 1 1ex;
    }
    > .title {
      flex: 0 0 fit-content;
      margin: 0;
      text-indent: 0;
    }
  }

  .smaller {
    font-size: 0.8em;
  }

  .bid.builder {
    > .name {
      text-decoration: underline;
    }
  }

  .swap {
    > .name {
      text-decoration: underline;
    }
  }
  
  .builder {
    &::before {
      content: '🤠 ';
      font-size: 0.75em;
    }
  }

  .summary {

    @include mobile {
      display: flex;
      flex-direction: column;
    }
    
    > .market{
      float: right;
      text-align: right;
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;

      @include mobile {
        float: none;
        flex-direction: row;
        justify-content: center;
        margin: 0.5em 0;
        order: 1;
      }
      
      h3 {
        margin: 0;

        @include mobile {
          margin: 0 1ex;
          font-size: 1em;

          &::after {
            content: ':';
          }
        }
      }

      > .balances {
        display: flex;
        flex-direction: column;
        align-items: end;

        @include mobile {
          flex-direction: row;
          gap: 1ex;
          flex-wrap: wrap;
          justify-content: center;
        }

        > .asset {
          display: flex;
          gap: 1ex;

          @include mobile {
            &::after {
              content: ', ';
              margin-left: -0.75ex;
            }
          }
          
          > .emoji {
            order: 1;

            @include mobile {
              order: 0;
            }
          }
        }
      }
    }

    > .player {

      > .balance {
        margin-left: 2ex;

        > .delta {
          font-size: 0.9em;
          margin-left: 1ex;
          color: #557700;

          &.decreased {
            color: #cc3300;
          }
        } 
      }
    }
  }

  .round {
    margin-bottom: 1em;
    
    > *:not(:last-child) {
      margin-bottom: 1em;
    }
  }

  .player:not(:last-child) {
    margin-bottom: 0.5em;
  }

  .block {
    > .steps {
      display: none;
      margin-left: 2ex;
      counter-reset: block-activity;

      > .step {
        counter-increment: block-activity;

        &:not(:last-child) {
          margin-bottom: 0.5em;
        }
        &::before {
          content: counter(block-activity) ')';
          font-style: italic;
          margin-right: 1.5ex;
          font-size: 0.9em;
          opacity: 0.9;
          vertical-align: super;
        }
      }
     
      .swaps {
        > .swap {
          margin-left: 6ex;
        }
      }
    }

    > .expand {
      button {
        margin: 0 0 0.5em 0;
        padding: 0;
        background: none;
        border: none;
        font-family: inherit;
        font-size: inherit;
        font-style: inherit;
        font-weight: inherit;
        color: inherit;
      }
    }

    > .expand > button {
      > .prefix::after {
        content: '[+] Show';
      } 
    }

    &.expanded {
      > .steps {
        display: block;
      }
      > .expand > button > .prefix::after {
        content: '[-] Hide';
      }
    }
  }

  h1 + .date {
    float: right;

    @include mobile {
      display: none;
    }
  }

  section.date {
    @include desktop {
      display: none;
    }
  }

  .date {
    text-align: center;
  }

  .deployment-failures {

    margin: 1.5em 0ex;

    .failure {
      &::before {
        content: '🪦';
        margin-right: 1ex;
      }
    }
  }

  .chart {
    height: 10em;
    margin: 2em 0 3em 0;
    --player-1-color: rgb(87, 134, 17);
    --player-2-color: rgb(212, 23, 23);
    --player-3-color: rgb(32, 173, 220);
    --player-4-color: rgb(202, 48, 202);

    *[data-rank='0'] {
      color: var(--player-1-color);
      path.line, .pt {
        stroke: var(--player-1-color);
      }
      .pt {
        background-color: var(--player-1-color);
      }
    }
    *[data-rank='1'] {
      color: var(--player-2-color);
      path.line, .pt {
        stroke: var(--player-2-color);
      }
      .pt {
        background-color: var(--player-2-color);
      }
    }
    *[data-rank='2'] {
      color: var(--player-3-color);
      path.line, .pt {
        stroke: var(--player-3-color);
      }
      .pt {
        background-color: var(--player-3-color);
      }
    }
    *[data-rank='3'] {
      color: var(--player-4-color);
      path.line, .pt {
        stroke: var(--player-4-color);
      }
      .pt {
        background-color: var(--player-4-color);
      }
    }

    .player-scores .line {
      fill: none;
      stroke: gray;
      stroke-width: 0.125em;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
   
    .interactive-points {
      .item {
        text-decoration: none;
        color: inherit; 
        display: block; 
        width: 1.5em;
        height: 1.5em;
        opacity: 0.33; 
        cursor: pointer; 
        position: relative;

        .label {
          display: none;
          position: absolute;
          // width: 100%;
          white-space: nowrap;
          bottom: 1.5em;
          pointer-events: none;
        }

        .emoji {
          font-size: 80%;
          margin: calc(-0.8 * 1em) -30%;
          position: relative;
        }

        &:hover {
          opacity: 1;

          .emoji {
            font-size: 125% !important;
            margin-left: -40%
          }

          .label {
            display: initial;
          }
        }
  
        &.final {
          opacity: 1;

          .emoji {
            font-size: 100%;
          }
        }
      }
    }

    .legend {
      .trophy {
        opacity: 0;
        &.show {
          opacity: 1;
        }
      }
      .player-label {
        width: fit-content;
        position: relative;
      }
    }

    .rounds-count {
      text-align: center;
      margin-top: 1em;
    }

    &.has-focus {
      .player-scores .line {
        &.focused {
          stroke-width: 0.175em;
        }
        &:not(.focused) {
          opacity: 0.25;
        }
      }

      .interactive-points .item {
        &.focused {
          opacity: 1;
          .emoji {
            font-size: 110%;
          }
        }
        &:not(.focused) {
          opacity: 0.25;
        }
      }
    }

  }
</style>

<Page title="Match Details">
  {#if data instanceof Promise}
  <div class="loading"><CatSpinner /></div>
  {:else if data instanceof Error}
  <CatSpinner failed />
  <div class="error">{getFriendlyErrorMsg(data)}</div>
  {:else if data}
  <Lede>
    <h1>
      Match {#if matchIdx !== undefined}{matchIdx + 1}{/if}
    </h1>
    <div class="date">{data.time.toLocaleString()}</div>
    <div>
      <a href={`${base}/season?season=${data.season + 1}`}>
        Season {data.season + 1}
      </a>
    </div>
    <div>
      <a href={`${base}/tournament?id=${data.tournamentId}&season=${data.season + 1}`}>
        {#if data.type == 'scrimmage'}Market Day{:else}Grand Faire{/if}
      </a>
    </div>
    <div>
      <a href={`${base}/bracket?tournament=${data.tournamentId}&season=${data.season + 1}&bracket=${data.bracket + 1}`}>
        Bracket {data.bracket + 1}
      </a>
    </div>
  </Lede>
  <section class="date">
    {data.time.toLocaleString()}
  </section>
  <section>
    {#if true}
    {@const sortedPlayers = data.players.slice().sort((a, b) => b.score - a.score)}
    <div class="chart" class:has-focus={!!focusedPlayer}>
      <Pancake.Chart
        x1={-1}
        x2={data.rounds.length}
        y1={-1}
        y2={
          Math.max(...data.rounds
            .map(r => r.balances.map(bs => bs.slice(1))).flat(2),
          ) + 1}>
        <div class="plots">
          {#each sortedPlayers as player, i (player.idx)}
          <div class="player-scores" data-rank={i}>
            <Pancake.Svg>
              <Pancake.SvgLine data={
                  data.rounds.map((r, i) => ({
                    x: i,
                    y: Math.max(...r.balances[player.idx].slice(1)),
                  }))
                } let:d>
                <path
                  class="line"
                  class:focused={focusedPlayer?.address === player.address}
                  {d} />
              </Pancake.SvgLine>
            </Pancake.Svg>
          </div>
          {/each}
          {#each sortedPlayers as player, i}
          <div class="interactive-points" data-rank={i}>
            {#each data.rounds as round, roundIdx}
            {@const balances = round.balances[player.idx]}
            {@const scoreAsset = balances
              .slice(1)
              .reduce((a, v, i) => v >= balances[a+1] ? i : a, 0) + 1
            }
            <Pancake.Point x={roundIdx} y={balances[scoreAsset]}>
              <a
                class="item" class:final={roundIdx === data.rounds.length - 1}
                class:focused={focusedPlayer?.address === player.address}
                href={`#round-${roundIdx+1}`}>
                <div class="emoji">{getAssetEmoji(scoreAsset)}</div>
                <div class="label">
                  {formatAmount(balances[scoreAsset])}
                </div>
              </a>
            </Pancake.Point>
            {/each}
          </div>
          {/each}
        </div>
        <div class="legend">
        {#each sortedPlayers as player, i (player.idx)}
            <div class="player-label" data-rank={i}
              on:mouseover={() => focusedPlayer = player}
              on:mouseout={() => focusedPlayer = null}
              on:focus={() => focusedPlayer = player}
              on:blur={() => focusedPlayer = null}
              >
              <span class="trophy" class:show={player.idx === data.winnerIdx}>🏆️</span>
              <Player name={player.name} />:
              <span class="score">
                {getAssetEmoji(player.scoreAssetIdx)}
                {formatAmount(player.score)}
              </span>
            </div>
          {/each}
        </div>
      </Pancake.Chart>
      <div class="rounds-count">
        ({data.rounds.length}/32 rounds played)
      </div>
    </div>
    {/if}
    {#if data.undeployedPlayers.length}
    <div class="deployment-failures">
      {#each data.undeployedPlayers as player}
      <div class="failure">
        <Player name={player} /> failed to deploy.
      </div>
      {/each}
    </div>
    {/if}
    {#each data.rounds as round, roundIdx (roundIdx)}
    <div class="round" id={`round-${roundIdx+1}`}>
      <div class="round-header">
        <div class="left" />
        <h2 class="title">Round {roundIdx + 1}</h2>
        <div class="right" />
      </div>
      <div class="summary">
        {#if round.market}
        <div class="market">
          <h3>🛒 Market</h3>
          <div class="balances">
            {#each round.market as balance, asset }
            <div class="asset">
              <span class="emoji">{getAssetEmoji(asset)}</span>
              <span class="amount">{formatAmount(balance)}</span>
            </div>
            {/each}
          </div>
        </div>
        {/if}
        {#each sortIndices(round.balances, bals => -Math.max(...bals)) as playerIdx}
        <div class="player">
          <span class:builder={playerIdx === round.block?.builderIdx}>
            {#if roundIdx === data.rounds.length - 1 && playerIdx === data.winnerIdx}🏆️{/if}
            <Player name={data.players[playerIdx].name} />
            {#if round.block?.bids}
            {#if round.block.bids[playerIdx] > 0}
            <span class="bid">
              bid
              <span class="asset">{getAssetEmoji(0)}</span>
              <span class="quantity">{formatAmount(round.block.bids[playerIdx])}</span>
            </span>
            and
            {:else if isNaN(round.block.bids[playerIdx])}
            <span class="failed-bid">
              FAILED their bid
            </span>
            and
            {/if}
            {/if}
            holds:
          </span>
          {#each round.balances[playerIdx] as bal, assetIdx}
          {#if bal > 0 || round.balanceDeltas[playerIdx][assetIdx] !== 0}
          <div class="balance">
            <span class="asset">{getAssetEmoji(assetIdx)}</span>
            <span class="quantity">{formatAmount(Math.max(0, bal))}</span>
            {#if round.balanceDeltas[playerIdx][assetIdx] !== 0}
            <span class="delta" class:decreased={round.balanceDeltas[playerIdx][assetIdx] < 0}>
              ({formatAmountDelta(round.balanceDeltas[playerIdx][assetIdx])})
            </span>
            {/if}
          </div>
          {/if}
          {/each}
        </div>
        {/each}
      </div>
      <div class="block" class:expanded={isRoundExpanded[roundIdx]}>
        <div class="expand custom">
          <button
            on:click={() => isRoundExpanded[roundIdx] = !isRoundExpanded[roundIdx]}
          ><span class="custom prefix"></span>
            Block Activity {#if round.block}({round.block.swaps.length} swaps){/if}
          </button>
        </div>
        <div class="steps">
          <div class="income step">
            🎁 Resupply everyone for
            {#each round.resupply[0] as amount, assetIdx (assetIdx)}
            <span class="asset">{getAssetEmoji(assetIdx)}</span>
            <span class="quantity">{formatAmountDelta(amount)}</span>
            &nbsp;
            {/each}
          </div>
          {#if round.block}
          {#each batchSwapsByPlayer(round.block.swaps) as { playerIdx, swaps }, batchIdx }
          <div class="swaps step" class:multi={swaps.length > 1}>
            <span class="subject">
              <span class:builder={playerIdx === round.block.builderIdx}>
                <Player name={data.players[playerIdx].name} />
              </span>
              sold:
            </span>
            {#each swaps as swap}
            <div class="swap">
              <span class="asset">{getAssetEmoji(swap.fromAssetIdx)}</span>
              <span class="quantity" title={swap.fromAmount.toExponential()}>{formatAmount(swap.fromAmount)}</span>
              ⇾
              <span class="asset">{getAssetEmoji(swap.toAssetIdx)}</span>
              <span class="quantity" title={swap.toAmount.toExponential()}>{formatAmount(swap.toAmount)}</span>
            </div>
            {/each}
          </div>
          {/each}
          <div class="burn step">
            🔥 Burned
            <span class="asset">{getAssetEmoji(0)}</span>
            <span class="quantity">{formatAmount(round.block.bids[round.block.builderIdx])}</span>
            from
            <span class="builder">
              <Player name={data.players[round.block.builderIdx].name} />
            </span>
          </div>
          {:else}
          <div class="empty-block">
            Empty Block!
          </div>
          {/if}
        </div>
      </div>
    </div>
    {/each}
  </section>
  {/if}
</Page>