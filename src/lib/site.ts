import { type Readable } from "svelte/store";
import type {
    Address,
    Chain,
    PublicClient,
    WalletClient,
} from "viem";
import { createPublicClient as cpc, http, } from "viem";
import {
    foundry,
    mainnet,
    sepolia,
    zkSync,
    zkSyncSepoliaTestnet,
} from "viem/chains";
import { getContext } from "svelte";
import type { SeasonInfo } from "./contest";
import * as publicEnv from "$env/static/public";
import { PUBLIC_CHAIN_ID, PUBLIC_RPC_URL } from "$env/static/public";

export const MAINTENANCE_MODE = !!publicEnv.PUBLIC_MAINTENANCE_MODE;
export const ANNOUNCEMENT = publicEnv.PUBLIC_ANNOUNCEMENT ?? null;
export const INVITE_ONLY = !!publicEnv.PUBLIC_INVITE_ONLY;
export const LAUNCH_TIME = new Date(publicEnv.PUBLIC_LAUNCH_TIME ?? 0);
export const LAUNCHED = LAUNCH_TIME.getTime() < Date.now();
export const SCHEDULE = (publicEnv.PUBLIC_SCHEDULE ? publicEnv.PUBLIC_SCHEDULE.split(',') : []).map(d => new Date(d));
export const SCHEDULED_PRIZES = (publicEnv.PUBLIC_SCHEDULED_PRIZES ? publicEnv.PUBLIC_SCHEDULED_PRIZES.split(',') : []);

export interface ScoredPlayer {
    name: string;
    address: Address;
    score: number;
}

export interface Wallet {
    address: Address;
    client: WalletClient;
    chain: Chain;
}

export interface SiteContext {
    wallet: Readable<Wallet | null>;
    playerName: Readable<string | null>;
    publicClient: PublicClient;
    seasons: Readable<SeasonInfo[]>;
}

export const CHAIN_BY_ID = {
    11155111: sepolia,
    1: mainnet,
    300: zkSyncSepoliaTestnet,
    324: zkSync,
    31337: foundry,
} satisfies Record<number, Chain>;

export function createPublicClient(): PublicClient {
    const transport = http(PUBLIC_RPC_URL);
    const chain = CHAIN_BY_ID[Number(PUBLIC_CHAIN_ID) as keyof typeof CHAIN_BY_ID];
    if (!chain) {
        throw new Error(`Unsupported chain: ${PUBLIC_CHAIN_ID}`);
    }
    return (cpc as any)({ transport, chain });
}

export type TournamentType = 'tournament' | 'scrimmage';


export const SITE_CONTEXT_NAME = 'site';

export function getSiteContext(): SiteContext {
    return getContext(SITE_CONTEXT_NAME);
}

export function formatScore(rawScore: number): string {
    return (rawScore * 1e3 + 1e3).toFixed(0);
}