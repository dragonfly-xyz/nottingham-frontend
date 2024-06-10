<script lang="ts">
    export let title = "";
</script>

<style lang="scss">
    @use '../styles/global.scss' as *;

    .page {
        @extend .content-font;
        padding: 1em 1ex;
        position: relative;
        
        .content {
            overflow: hidden;
        }
    }
</style>

<svelte:head>
    <title>{ title ? `Nottingham: ${title}`: 'Searchers of Nottingham'}</title>
</svelte:head>
<div class="page">
    <div class="content">
        <slot />
    </div>
</div>