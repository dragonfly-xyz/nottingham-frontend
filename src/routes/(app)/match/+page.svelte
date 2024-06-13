<script lang="ts">
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
    resupply: number[][];
    block: Block | null;
    balances: number[][];
    balanceDeltas: number[][];
  }

  interface SwapsByPlayer {
    playerIdx: number;
    swaps: Swap[];
  }

  const ASSET_EMOJIS = [ '🪙', '🍞', '🐟️', '🍎', '🥕', '👕' ];

  let tournamentId: string | undefined;
  let seasonIdx: number | undefined;
  let bracketIdx: number | undefined;
  let matchId: string | undefined;
  let matchIdx: number | undefined;
  let data: BusyState<MatchData>;
  const dataAwait = createBusy<MatchData>(r => data = r);
  let isRoundExpanded: boolean[] = [];

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
          const [rounds, playerAddresses] = parseRawLogs(JSON.parse(r.logs));
          return {
            tournamentId: r.tournamentId,
            season: r.season,
            type: r.type,
            bracket: r.bracket,
            duration: r.duration,
            players: playerAddresses.map(addr => r.players.find((p: any) => p.address === addr)),
            time: new Date(r.time),
            rounds: rounds,
            winnerIdx: playerAddresses.findIndex(a => a === r.players[0].address),
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

  function parseRawLogs(logs: MatchLog[]): [Round[], Address[]] {
    const players = logs[1].players;
    const rounds = [] as Round[];
    for (let roundStart = 2; roundStart < logs.length;) {
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
      });
      rounds.push(round);
      roundStart = roundEnd;
    }
    return [rounds, players];
  }

  function parseRoundFromLogs(opts: {
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
    return {
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
    matchIdx = Number(params.get('idx') ?? '1') - 1;
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
  @use '../../../lib/styles/global.scss';

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
      cursor: pointer;

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

  .date {
    float: right;
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
    <div class="date">{data.time.toLocaleDateString()}</div>
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
  <section>
    {#each data.rounds as round, roundIdx (roundIdx)}
    <div class="round">
      <div class="round-header">
        <div class="left" />
        <h2 class="title">Round {roundIdx + 1}</h2>
        <div class="right" />
      </div>
      <div class="summary">
        {#each sortIndices(round.balances, bals => -Math.max(...bals)) as playerIdx}
        <div class="player">
          <span class:builder={playerIdx === round.block?.builderIdx}>
            {#if roundIdx === data.rounds.length - 1 && playerIdx === data.winnerIdx}🏆️{/if}
            <Player name={data.players[playerIdx].name} />
            {#if round.block?.bids && round.block.bids[playerIdx] > 0}
            <span class="bid">
              bid
              <span class="asset">{getAssetEmoji(0)}</span>
              <span class="quantity">{formatAmount(round.block.bids[playerIdx])}</span>
              and
            </span>
            {/if}  
            holds:
          </span>
          {#each round.balances[playerIdx] as bal, assetIdx}
          {#if bal > 0}
          <div class="balance">
            <span class="asset">{getAssetEmoji(assetIdx)}</span>
            <span class="quantity">{formatAmount(bal)}</span>
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
        <div class="expand">
          <button
            on:click={() => isRoundExpanded[roundIdx] = !isRoundExpanded[roundIdx]}
          ><span class="custom prefix"></span>
            Block Activity
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