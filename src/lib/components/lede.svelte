<script lang="ts">
    // export let title: string;
</script>

<style lang="scss">
    @import "../../lib/styles/global.scss";

    .initialed {
        &::first-letter {
            @extend .fancy-font;
            font-style: normal;
            font-weight: 100;
            font-size: 3em;
            float: left;
            text-transform: capitalize;
            line-height: 0.95em;
            letter-spacing: 0.05ex;
            background: url('/gold-leaf-texture.jpg');
            background-size: 100%;
            background-clip: text;
            color: rgba(0,0,0,0);
            padding-bottom: 0.05em;
        }
    }

    .lede {
        margin-bottom: 1em;

        > :global(h1) {
            @extend .initialed;
            margin: 0 !important;
            color: rgb(176, 138, 40);
            text-indent: 0 !important;
        }
        > :global(p) {
            margin-top: 0;
        }
        > :global(p):nth-last-child(2) {
            margin-bottom: 0;
        }
        > *:last-child {
            clear: both;
        }
    }
</style>

<div class="lede">
    <slot></slot>
    <div />
</div>
