<script lang="ts">
    import Page from "$lib/components/page.svelte";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import type { Address } from "viem";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";
    import { PUBLIC_DATA_URL } from "$env/static/public";
    import Lede from "$lib/components/lede.svelte";
    import CatSpinner from "$lib/components/cat-spinner.svelte";
    import { base } from "$app/paths";
    import { createBusy, type BusyState } from "$lib/kit";
    import { UserError, getFriendlyErrorMsg } from "$lib/util";
    import Player from "$lib/components/player.svelte";

    interface Player {
        name: string;
        address: Address;
        created: Date;
    }

    let busyState: BusyState;
    const busyAwait = createBusy(s => busyState = s);
    enum SortOption {
        Name = 'name',
        Joined = 'joined',
        LastTournamentScore = 'tournament',
        LastScrimmage = 'scrimmage',
    }
    export let sortBy: string | undefined = undefined;
    let players = [] as Player[];

    $: {
        const querySortBy = $page.url.searchParams.get('sortBy');
        if (sortBy && querySortBy !== sortBy) {
            $page.url.searchParams.set('sortBy', sortBy);
            if (browser) {
                goto(`?${$page.url.searchParams.toString()}`);
            }
        }
    }
    $: players = sortPlayers(players, sortBy);

    onMount(async () => {
        await busyAwait((async () => {
            const resp = await fetch(`${PUBLIC_DATA_URL}/players`, {
                headers: {
                    'content-type': 'application/json',
                },
            });
            if (!resp.ok) {
                const { error: errorMsg } = await resp.json();
                throw new UserError(`Failed to fetch players: ${errorMsg}`);
            }
            players = (await resp.json()).map((p: any) => ({
                name: p.name,
                address: p.address,
                created: new Date(p.created),
            }));
            sortBy = $page.url.searchParams.get('sortBy') as any ?? 'name';
        })());
    });

    function sortPlayers(players_: Player[], sortBy_: typeof sortBy): Player[] {
        if (sortBy_ === 'joined') {
            players_.sort((a, b) => a.created.getTime() - b.created.getTime());
        } else {
            players_.sort((a, b) => a.name.localeCompare(b.name));
        }
        return players_;
    }
</script>

<style lang="scss">
    @use '../../../lib/styles/global.scss' as *;

    ol {
        max-width: min-content;
        padding-inline-start: 0;
    }
    li {
        display: flex;
        gap: 4ex;
        justify-content: space-between;
    }

    .sort-options {
        display: flex;
        gap: 1ex;
        > .opt:not(:last-child)::after {
            content: ', ';
        }
        > .opt:last-child::after {
            content: '.';
        }
    }
</style>

<Page title="Merchant Dashboard">
   <Lede>
       <h1>Merchants</h1>
   </Lede> 
    <section>
        <div class="sort-options">
            <div>
                Sort by
            </div>
            {#each [ [SortOption.Name, 'Name'], [SortOption.Joined, 'Date joined']] as [opt, text]}<!--
            --><div class="opt"><!--
                --><a href="." on:click|preventDefault={() => sortBy = opt}>{text}</a><!--
            --></div><!--
            -->{/each}
        </div>
        {#if busyState instanceof Promise}
        <div class="spinner">
            <CatSpinner />
        </div>
        {:else if busyState instanceof Error}
        <div class="error">
            <CatSpinner failed />
            {getFriendlyErrorMsg(busyState)}
        </div>
        {:else}
        <div class="players-list">
            {#if players.length}
            <ol>
                {#each players as player, i (player.address)}
                <li>
                    <span>{i + 1}.</span>
                    <span><Player name={player.name} /></span>
                    <span>{player.created.toLocaleDateString()}</span>
                </li>
                {/each}
            </ol>
            {:else}
            <div>No registered players.</div>
            {/if}
        </div>
        {/if}
    </section>
</Page>