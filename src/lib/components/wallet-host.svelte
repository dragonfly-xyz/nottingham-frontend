<script lang="ts">
    import { foundry, mainnet, sepolia, zkSync, zkSyncSepoliaTestnet } from "viem/chains";
    import { PUBLIC_PROJECT_ID as PROJECT_ID } from "$env/static/public";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { type Web3Modal, createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi";
    import { disconnect, reconnect } from "@wagmi/core";
    import { createWalletClient, custom, type Chain, type CustomTransport } from "viem";
    import { page } from "$app/stores";
    import { CONTEST_CHAIN_ID } from "$lib/contest";

    export const CHAIN_BY_ID = {
        300: zkSyncSepoliaTestnet,
        324: zkSync,
        11155111: sepolia,
        31337: foundry,
    } as Record<number | string, Chain>;

    const WAGMI_METADATA = {
        name: 'Nottingham',
        description: '',
        url: $page.url.origin,
        icons: [],
    };
    const dispatch = createEventDispatcher();

    let config = defaultWagmiConfig({
        chains: [CHAIN_BY_ID[CONTEST_CHAIN_ID]],
        projectId: PROJECT_ID,
        metadata: WAGMI_METADATA,
    });
    let modal: Web3Modal | undefined;

    $: {
        const status = $config?.status;
        if (status === 'connected') {
            const { connector, accounts } =
                $config.connections.get($config.current!)!;
            (async () => {
                const [provider, chainId] = await Promise.all([
                    connector.getProvider() as Promise<CustomTransport>,
                    connector.getChainId(),
                ]);
                const transport = custom(provider as any);
                const chain = CHAIN_BY_ID[chainId] ?? mainnet;
                dispatch('connected', {
                    address: accounts[0],
                    client: createWalletClient({
                        transport,
                        account: accounts[0],
                        chain,
                    }),
                    chain,
                });
            })();
        } else if (status === 'disconnected') {
            dispatch('disconnected', {});
        } else if (status === 'connecting') {
            dispatch('connecting');
        }
    }

    onMount(async () => {
        if (!['connected', 'reconnecting'].includes($config?.status)) {
            reconnect(config);
        }
        modal = createWeb3Modal({
            wagmiConfig: config,
            projectId: PROJECT_ID,
        });
    });

    onDestroy(async () => {
        if (modal) {
            modal.close();
            modal = undefined;
        }
    });

    function connectWallet() {
        if (!modal) {
            return;
        }
        modal.open();
    }

    function disconnectWallet() {
        disconnect(config);
    }
</script>

<div>
    <slot {connectWallet} {disconnectWallet} />
</div>