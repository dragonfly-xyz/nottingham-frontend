<script lang="ts">
    import { base } from "$app/paths";

    export let name: string;
</script>

<style lang="scss">
    @use '../styles/global.scss' as *;
</style>

<a href={`${base}/player?name=${name}`}><!--
    -->{name}<!--
--></a>