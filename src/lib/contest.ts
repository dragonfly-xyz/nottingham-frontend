import {
    decodeAbiParameters,
    encodeFunctionData,
    type Client,
    type Hex,
    type Log,
    type PublicClient,
    type TransactionReceipt,
    type WalletClient,
    type AbiFunction,
    type AbiEvent,
    type Abi,
} from "viem";
import { readContract, waitForTransactionReceipt, writeContract } from "viem/actions";
import { PUBLIC_CHAIN_ID, PUBLIC_CONTEST_ADDRESS } from "$env/static/public";
import * as publicEnv from "$env/static/public";
import CONTEST_ABI_ from '$lib/contest-abi.json';
import type { Address } from "viem/accounts";

export const CONTEST_CHAIN_ID = Number(PUBLIC_CHAIN_ID);
export const CONTEST_ADDRESS = PUBLIC_CONTEST_ADDRESS as Address;
export const CONTEST_DEPLOYED_BLOCK = publicEnv.PUBLIC_CONTEST_DEPLOYED_BLOCK ?? null;
export const CONTEST_ABI = CONTEST_ABI_ as Abi;
const ALL_EVENTS = CONTEST_ABI.filter((e: any) => e.type === 'event') as AbiEvent[];

export async function readContestContract
<TResult extends any = any, TArgs extends any[] = any[]>(
    opts: {
        client: Client;
        fn: string;
        args?: TArgs;
        from?: Address;
}): Promise<TResult> {
    return readContract(opts.client, {
        address: CONTEST_ADDRESS,
        abi: CONTEST_ABI,
        functionName: opts.fn,
        account: opts.from,
        args: opts.args,
    }) as Promise<TResult>;
}

export async function writeContestContract
<TArgs extends any[] = any[]>(
    opts: {
        client: WalletClient;
        fn: string;
        args: TArgs,
}): Promise<Hex> {
    return writeContract(opts.client, {
        account: opts.client.account!,
        chain: opts.client.chain,
        address: CONTEST_ADDRESS,
        abi: CONTEST_ABI,
        functionName: opts.fn,
        args: opts.args,
    });
}

export async function multiReadContestContract
<TResult extends any[] = any[], TArgs extends any[] = any[]>(
    opts: {
        client: Client;
        calls: Array<{ fn: string; args?: TArgs; }>;
}): Promise<TResult> {
    const r = await readContract(opts.client, {
        address: CONTEST_ADDRESS,
        abi: CONTEST_ABI,
        functionName: 'multicall',
        args: [opts.calls.map(c => encodeFunctionData({
            abi: CONTEST_ABI,
            functionName: c.fn,
            args: c.args,
        }))],
    }) as Array<Hex>;
    return [...opts.calls.entries()].map(([i, { fn }]) => {
        const def = CONTEST_ABI
            .find((e: any) => e.type === 'function' && e.name === fn) as AbiFunction;
        const decoded = decodeAbiParameters(def.outputs, r[i]);
        return def.outputs.length === 1 ? decoded[0] : decoded;
    }) as TResult;
}

export async function multiWriteContestContract
<TArgs extends any[] = any[]>(
    opts: {
        client: WalletClient;
        calls: Array<{ fn: string; args?: TArgs; }>;
}): Promise<void> {
    const txHash = await writeContract(opts.client, {
        account: opts.client.account!,
        chain: opts.client.chain, 
        address: CONTEST_ADDRESS,
        abi: CONTEST_ABI,
        functionName: 'multicall',
        args: [opts.calls.map(c => encodeFunctionData({
            abi: CONTEST_ABI,
            functionName: c.fn,
            args: c.args,
        }))],
    }) as Hex;
    const r = await waitForTransactionReceipt(
        opts.client,
        { hash: txHash },
    );
    if (r.status !== 'success') {
        throw new Error(`Transaction reverted`);
    }
}

export interface DecodedLog
<TArgs extends unknown[] | Record<string, any> = Record<string, any>>
extends Log {
    eventName: string;
    args: TArgs;
    blockNumber: bigint;
}

export async function getContestLogs<TLogs extends DecodedLog[] = DecodedLog[]>(
    client: PublicClient,
    events: Array<string | { name: string; args?: any[] }>,
    startBlock?: number,
): Promise<TLogs> {
    const fromBlock = startBlock ? BigInt(startBlock) : (
        CONTEST_DEPLOYED_BLOCK
            ? BigInt(CONTEST_DEPLOYED_BLOCK)
            : 'earliest'
    );
    const events_ = events.map(e => typeof(e) === 'string' ? { name: e } : e);
    return (await Promise.all(events_.map(e => client.getLogs({
        address: CONTEST_ADDRESS,
        event: ALL_EVENTS.find(a => a.name === e.name),
        args: e.args ?? undefined,
        fromBlock,
    })))).flat(1) as TLogs;
}

export async function waitForTxSuccess(client: Client, txHash: Hex)
: Promise<TransactionReceipt> {
    const r = await waitForTransactionReceipt(client, { hash: txHash });
    if (r.status !== 'success') {
        throw new Error(`Transaction failed`);
    }
    return r;
}

export enum SeasonState {
    Inactive = 0,
    Started = 1,
    Closed = 2,
    Revealed = 3,
}

export interface SeasonInfo {
    idx: number;
    state: SeasonState;
    publicKey: Hex | null;
    privateKey: Hex | null;
    prize: bigint;
    winner: Address | null;
    unclaimedPrize: bigint;
    startBlock: number; 
    closedBlock: number | null; 
    startTime: Date; 
    closedTime: Date | null;
}

export async function fetchSeasons(
    client: PublicClient,
    startBlock?: number,
): Promise<SeasonInfo[]> {
    const [logs, [currentPrize, currentSeasonIdx]] = await Promise.all([
        getContestLogs(
            client, [
                'SeasonStarted',
                'SeasonClosed',
                'SeasonRevealed',
                'WinnerDeclared',
                'PrizeClaimed',
            ],
            startBlock,
        ),
        multiReadContestContract<[bigint, number]>({
            client,
            calls: [
                { fn: 'currentSeasonPrize' },
                { fn: 'currentSeasonIdx' },
            ],
        }),
    ]);
    const seasonsByIdx = {} as { [idx: number]: SeasonInfo };
    for (const log of logs) {
        const { args } = log;
        const blockNumber = Number(log.blockNumber);
        if (log.eventName === 'SeasonStarted') {
            seasonsByIdx[args.season] = {
                idx: args.season,
                winner: null,
                closedBlock: null,
                startBlock: blockNumber,
                closedTime: null,
                startTime: new Date(0),
                prize: 0n,
                state: SeasonState.Started,
                unclaimedPrize: 0n,
                privateKey: '0x',
                publicKey: args.publicKey,
            };
            continue;
        }
        const szn = seasonsByIdx[args.season];
        if (!szn) {
            console.warn(`Found event for missing season idx: ${args.season}`);
        }
        if (log.eventName === 'SeasonClosed') {
            szn.state = SeasonState.Closed;
            szn.closedBlock = blockNumber;
        } else if (log.eventName === 'SeasonRevealed') {
            szn.privateKey = args.privateKey;
            szn.state = SeasonState.Revealed;
        } else if (log.eventName === 'WinnerDeclared') {
            if (args.season in seasonsByIdx) {
                const winSeason = seasonsByIdx[args.season];
                winSeason.winner = args.winner; 
                winSeason.prize = args.prize;
                winSeason.unclaimedPrize = args.prize;
            }
        } else {
            if (args.season in seasonsByIdx) {
                const winSeason = seasonsByIdx[args.season];
                winSeason.prize = args.prize; 
                winSeason.unclaimedPrize = 0n; 
            }
        }
    }
    if (seasonsByIdx[currentSeasonIdx]) {
        seasonsByIdx[currentSeasonIdx].prize = currentPrize;
    }
    // Get block times.
    const uniqueBlocks = Object.values(Object.assign({},
        ...Object.values(seasonsByIdx)
            .map(szn => [szn.startBlock, szn.closedBlock])
            .flat(1)
            .filter(v => typeof(v) === 'number')
            .map(b => ({ [b!]: b })),
    )) as number[];
    const blockTimes = await getBlockTimes(client, uniqueBlocks);
    const blockTimeByNumber = Object.assign({},
        ...uniqueBlocks.map((n, i) => ({ [n]: blockTimes[i] })),
    ) as Record<number, Date>;
    const seasons = Object.values(seasonsByIdx).sort((a, b) => a.idx - b.idx);
    for (const szn of seasons) {
        szn.startTime = blockTimeByNumber[szn.startBlock];
        if (szn.closedBlock) {
            szn.closedTime = blockTimeByNumber[szn.closedBlock];
        }
    }
    return seasons;
}

export async function getBlockTimes(
    client: PublicClient,
    blockNumbers: number[],
): Promise<Date[]> {
    return Promise.all(blockNumbers.map(
        async n => {
            const cacheKey = `${client.chain!.id}/blockTime/${n}`;
            const cached = await localStorage.getItem(cacheKey);
            if (cached) {
                return new Date(Number(cached));
            }
            const block = await client.getBlock({ blockNumber: BigInt(n) })
            const timestamp = Number(block.timestamp) * 1e3;
            await localStorage.setItem(cacheKey, timestamp.toString());
            return new Date(timestamp);
        },
    ));
}