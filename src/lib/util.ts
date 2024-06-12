import { toHex, type Hex, type Log } from "viem";

export const ONE_MINUTE = 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_MINUTE_MS = ONE_MINUTE * 1e3;
export const ONE_HOUR_MS = ONE_HOUR * 1e3;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;
export const NOOP = () => {};

export function randomHex(size: number = 32): Hex {
    const buf = new Uint8Array(size);
    crypto.getRandomValues(buf);
    return toHex(buf);
}

export function randomName(letters: number = 12): string {
    const buf = new Uint8Array(letters);
    return String.fromCharCode(
        ...crypto.getRandomValues(buf).map(v => v % 26 + 0x61),
    );
}

export function sortLogs<T extends Log>(logs: T[], reversed: boolean = false): T[] {
    const ids = logs.map(
        log => (log.blockNumber! << 64n) |
            (BigInt(log.transactionIndex!) << 32n) |
            BigInt(log.logIndex!),
    );
    const idxs = logs.map((_, i) => i);
    if (reversed) {
        idxs.sort((a, b) => cmpBigInt(ids[b], ids[a]));
    } else {
        idxs.sort((a, b) => cmpBigInt(ids[a], ids[b]));
    }
    return logs.map((_, i) => logs[idxs[i]]);
}

export function cmpBigInt(a: bigint, b: bigint): number {
    if (a === b) {
        return 0;
    }
    if (a < b) {
        return -1;
    }
    return 1;
}

export function cmpDate(a: Date, b: Date): number {
    return a.getTime() - b.getTime();
}

export class UserError extends Error {
    constructor(msg: string, private readonly _friendlyError?: string) {
        super(msg);
    }

    public get friendlyError(): string {
        return this._friendlyError ?? this.message;
    }
}

export function getFriendlyErrorMsg(err: Error): string {
    return (err as any).friendlyError ?? err.message;
}

