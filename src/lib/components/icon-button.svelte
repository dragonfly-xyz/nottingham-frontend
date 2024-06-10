<script lang="ts">
    import { base } from "$app/paths";

    export let icon: string;
    export let hoverIcon: string | null = null;
    export let title: string | null = null;

    const ICONS = {
        'purse-closed': {
            sheet: `${base}/sprites.png`,
            row: 0,
            col: 1,
            rows: 1,
            cols: 4,
        },
        'purse-open': {
            sheet: `${base}/sprites.png`,
            row: 0,
            col: 0,
            rows: 1,
            cols: 4,
        },
    };

    let vars = {} as Record<string, null | string>;

    $: {
        updateVars(icon, hoverIcon);
    }

    function updateVars(icon: string | null, hoverIcon: string | null): void {
        vars = {};
        if (icon) {
            if (icon in ICONS) {
                const { sheet, row, col, rows, cols } = ICONS[icon as keyof typeof ICONS];
                Object.assign(vars, {
                    '--sheet-url': `url('${sheet}')`,
                    '--row': row,
                    '--col': col,
                    '--rows': rows,
                    '--cols': cols,
                });
            } else {
                Object.assign(vars, {
                    '--sheet-url': `url(${icon})`,
                });
            }
        }
        if (hoverIcon) {
            if (hoverIcon in ICONS) {
                const { sheet, row, col, rows, cols } = ICONS[hoverIcon as keyof typeof ICONS];
                Object.assign(vars, {
                    '--sheet-url-hover': `url('${sheet}')`,
                    '--row-hover': row,
                    '--col-hover': col,
                    '--rows-hover': rows,
                    '--cols-hover': cols,
                });
            } else {
                Object.assign(vars, {
                    '--sheet-url-hover': `url(${hoverIcon})`,
                });
            }
        }
    }

    function joinStyles(vars: Record<string, null | string>): string {
        return Object.entries(vars).filter(([k,v]) => v !== null).map(([k, v]) => `${k}: ${v};`).join(' ');
    }
</script>

<style lang="scss">
    @import "../styles/global.scss";

    button {
        --size: 4em;
        --sheet-url: none;
        --row: 0;
        --col: 0;
        --rows: 1;
        --cols: 1;
        --bg-size: calc(var(--cols) * var(--size)) calc(var(--rows) * var(--size));
        --bg-pos: calc(-1 * var(--col) * var(--size)) calc(-1 * var(--row) * var(--size));
        --sheet-url-hover: var(--sheet-url);
        --row-hover: var(--row);
        --col-hover: var(--col);
        --rows-hover: var(--rows);
        --cols-hover: var(--cols);
        --bg-size-hover: calc(var(--cols-hover) * var(--size)) calc(var(--rows-hover) * var(--size));
        --bg-pos-hover: calc(-1 * var(--col-hover) * var(--size)) calc(-1 * var(--row-hover) * var(--size));
        background: none;
        border: none;
        cursor: pointer;
        background-repeat: no-repeat;
        width: var(--size);
        height: var(--size);
        background-image: var(--sheet-url);
        background-size: var(--bg-size);
        background-position: var(--bg-pos);

        &:hover {
            background-image: var(--sheet-url-hover);
            background-size: var(--bg-size-hover);
            background-position: var(--bg-pos-hover);
            transform: scale(1.05) rotate(10deg);
        }
    }
</style>

<button on:click style={joinStyles(vars)} title={title} class="custom" />