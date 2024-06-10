import { readable, type Readable } from "svelte/store";
import { NOOP } from "./util";

export type ReadableSetter<T extends any> = (v: T) => void;

export function createReadable<T>(initial: T)
    : [Readable<T>, ReadableSetter<T>]
{
    let setter: ReadableSetter<T> = NOOP;
    const r = readable(initial, set => { setter = set; });
    return [ r, (v: T) => setter(v) ];
}

export type BusyState<T = void> = undefined | Promise<T> | Error | T;

export function createBusy<T = any>(
    update: (result: BusyState<T>) => void,
): (p: Promise<T> | (() => Promise<T>)) => Promise<T> {
    let busyCount = 0;
    return (p: Promise<T> | (() => Promise<T>)) => {
        if (typeof p === 'function') {
            p = p();
        }
        if (busyCount++ === 0) {
            update(p);
        }
        return p.then(v => {
            if (--busyCount === 0) {
                update(v);
            }
            return v;
        }).catch(err => {
            if (--busyCount === 0) {
                update(err);
            }
            throw err;
        });
    };
}