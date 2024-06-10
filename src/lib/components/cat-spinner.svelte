<script lang="ts">
    export let failed: boolean | null = null;
</script>

<style lang="scss">
    @use "../styles/global.scss";

    :root {
        --size: 5em;
    }

    .spinner {
        display: inline-block;
        background-image: url('/cat-spinner.png');
        width: var(--size);
        height: var(--size);
        background-repeat: no-repeat;
        background-size: calc(3 * var(--size));
        animation: spin 0.33s steps(1, end) infinite;
        transform: scale(-1, 1);
        filter: sepia(0.5);
        display: flex;
        align-items: center;

        &.failed {
            animation: none;
            transform: scale(-1,-1) rotate(12deg);
            background-position: calc(var(--size) * -2) 0;
        }
    }


    @keyframes spin {
        0% {
            background-position: calc(var(--size) * -2) 0;
        }
        33% {
            background-position: calc(var(--size) * -1) 0;
        }
        66% {
            background-position: 0 0;
        }
    }
</style>

<div class="spinner" title="loading..." class:failed={failed === true}></div>