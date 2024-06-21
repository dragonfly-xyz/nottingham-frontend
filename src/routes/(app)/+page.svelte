<script lang="ts">
    import { base } from "$app/paths";
    import ContestProgress from "$lib/components/contest-progress.svelte";
    import Lede from "$lib/components/lede.svelte";
    import Page from "$lib/components/page.svelte";
    import { CONTEST_ADDRESS } from "$lib/contest";
    import { LAUNCHED, LAUNCH_TIME, SCHEDULE, SCHEDULED_PRIZES, getSiteContext } from "$lib/site";
    import type { Chain } from "viem";

    const { publicClient } = getSiteContext();
    let chain: Chain;
    $: chain = publicClient.chain!;

</script>

<style lang="scss">
    @use "../../lib/styles/global.scss" as *;

    .illustration {
        float: right;
        height: 8em;
       
        @include mobile {
            float: none;
            margin: 0 auto;
            width: fit-content;
        }

        > img {
            height: 100%;
        }

        > img:nth-child(1) {
            transform: scale(-1, 1);
        }
    }

    #progress {
        > .content {
            // margin-left: 2ex;
        }
    }

    section {
        > ul {
            > li {
                margin-bottom: 0.5em;
            }
        }
    }

    #timeline {
        > .events {
            display: flex;
            flex-direction: column;

            @include mobile {
                gap: 0.5em;
            }

            > .event, .prize-event {
                display: flex;
                flex-direction: row;
                justify-content: space-between;

                @include mobile {
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                > * {
                    flex: 1 0 fit-content;
                }

                > .spacer {
                    display: contents;

                    @include mobile {
                        display: none;
                    }
                    
                    &::after {
                        content: '..................................................................................................................................................................................................................................';
                        overflow: hidden;
                        text-overflow: clip;
                        display: block;
                        flex: 0 1 auto;
                        opacity: 0.25;
                    }
                }
            }
        }

        > .disclaimer {
            text-align: right;
            font-size: 0.75em;

            @include mobile {
                margin-top: 0.5em;
                text-align: center;
            }
        }
    }

    .u {
        text-decoration: underline;
    }
</style>

<Page>
    <Lede>
        <h1 class="initialed">Searchers of Nottingham</h1>
        <p>
            Nottingham beckons, merchants bold! Hawk your wares, outmaneuvering rivals in the Market's fickle dance. Bribe your way to Sheriff and control the trade flow to your own benefit. Wit and coin win the day - become Nottingham's wealthiest merchant!
        </p>
    </Lede>
    <div class="illustration">
        <img src={`${base}/aristocrat.png`} alt="medieval illustration" />
        <img src={`${base}/merchants.png`} alt="medieval illustration" />
    </div>
    <section id="gameplay">
        <h2><a href="#gameplay" class="inherit">Gameplay</a></h2>
        <p>
            Searchers of Nottingham is a multiplayer, <a href="https://chain.link/education-hub/maximal-extractable-value-mev" target="_blank">MEV</a>-themed game built on the <a href="https://ethereum.org" target="_blank">Ethereum</a> Virtual Machine. Players submit compiled <a href="https://ethereum.org/en/developers/docs/smart-contracts/" target="_blank">smart contracts</a> which represent Merchants at a medieval fair trying to stock their stall with goods (tokens). Merchants face each other in multiple small games. Each round Merchants will try to exchange their gold and goods at the Market (a constant product <a href="https://chain.link/education-hub/what-is-an-automated-market-maker-amm" target="_blank">AMM</a>). But a Merchant can also choose to bid gold to become the Sheriff for that round. The Sheriff chooses the order in which all trades are made and can also make their own trades at will. The first Merchant to acquire the maximum amount of any single good will win!
        </p>
    </section>
    <section id="contest">
        <h2><a href="#contest" class="inherit">The Contest</a></h2>
        <p>
            The contest will run approximately over a period of 15 days, with every 5 days marking a "Season." Seasons are made up of quick, daily tournaments and one final and conclusive tournament on the last day. Tournaments pit all players in the season against each other to produce an overall ranking.
        </p>
        <p>
            On every day of a season, "Market Day" tournaments will be held every 2 hours. These tournaments award no prizes but are important to partake in because they give players a sense of how well their contract performs against others and creates an opportunity to discover and experiment with meta-strategies.
        </p>
        <p>
            On the last day of the season, a single "Grand Faire" tournament is held. The Grand Faire DOES award prizes (in ETH) to the winner, and will also consist of more matches for certainty. The Grand Faire prize increases with each successive season, as players naturally become more sophisticated with time.
        </p>
        <p>
            The contest is free to join, but you will need a <em>very</em> small amount of ETH on <a href={chain.blockExplorers?.default.url} target="_blank">{chain.name}</a> to cover gas for registration, submissions, and to claim any prizes.
        </p>
        <h3 id="tournaments"><a href="#tournaments" class="inherit">Tournaments</a></h3>
        <p>
            Players are ranked in a series of <em>offchain</em> tournament-style matches against each other, consisting of 4 players at a time. The top performing players of each bracket advance into the next bracket, and so on. The player that maintains the highest overall ranking in the final bracket wins the tournament!
        </p>
        <p>
            To participate in tournaments, players must make at least one code submission while that season is open (any time before the Grand Faire). <em>Submissions from a prior season will not automatically roll over into the next.</em> <span class="u">You can submit multiple times</span> and are encouraged to do so over the 5 days! Only the most recent submission will be used, so there is no harm in submitting early.
        </p>
        <p>
            Code submissions are published onchain but are encrypted with a key that will only be revealed when the season is closes. This allows players to decrypt past season winners to train against and incentivizes players to gradually refine their solutions in the next.
        </p>
        {#if SCHEDULE.length}
        <div id="timeline">
            <h3><a href="#timeline" class="inherit">Timeline</a></h3>
            <p>
                A total of ${SCHEDULED_PRIZES.reduce((a, v) => a + v).toLocaleString()}* will be awarded across {SCHEDULED_PRIZES.length} season ending tournaments.
            </p>
            <div class="events">
                {#if LAUNCH_TIME.getTime() != 0}
                <div class="event">
                    <div>{LAUNCH_TIME.toLocaleDateString()}</div>
                    <div class="spacer" />
                    <div>Contest Launch</div>
                </div>
                {/if}
                {#each SCHEDULE as time, i}
                <div class="prize-event">
                    <div class="date">{ time.toLocaleDateString() }</div>
                    <div class="spacer" />
                    <div class="name">
                        Grand Faire
                        {#if SCHEDULED_PRIZES[i]}
                        (prize: ${ Number(SCHEDULED_PRIZES[i]).toLocaleString() }*)
                        {/if}
                    </div>
                </div>
                {/each}
            </div>
            {#if SCHEDULED_PRIZES.length}
            <div class="disclaimer">
                (* Prizes are USD equivalent of ETH, valued approximately at time of contest launch)
            </div>
            <div class="disclaimer">
                (Dates are subject to change)
            </div>
            {/if}
        </div>
        {/if}
    </section>
    {#if LAUNCHED}
    <section id="progress">
        <h2><a href="#progress" class="inherit">Contest Progress</a></h2>
        <p>
            Once the minimum number of players for a season (4) have submitted code, regular tournament results will appear here. You will be able to observe performance across brackets and even view a play-by-play of individual matches.
        </p>
        <div class="content">
            <ContestProgress />
        </div>
    </section>
    {/if}
    <section id="resources" class="resources">
        <h2><a href="#resources" class="inherit">Resources</a></h2>
        <ul>
            {#if LAUNCHED}
            <li>
                <a href="https://github.com/dragonfly-xyz/nottingham-contracts" target="_blank">🚩 Game contracts</a> (start here!)
                <ul>
                    <li>A <a href="https://book.getfoundry.sh" target="_blank">foundry</a> development environment containing all the core game logic, sample agents, and a local match runner. Once you've developed a contract, come back here to upload it and join tournaments during the season to see how it does.</li>
                </ul>
            </li>
            {:else}
            <li>
                <a href="#resources">Game contracts</a>
                <ul>
                    Will be revealed at launch!
                </ul>
            </li>
            {/if}
            <li>
                <a href="https://t.me/+Fjy4JEgoqLJmZmI5" target="_blank">Telegram Support Group</a>
                <ul>
                    <li>Overburdened Guildsmen? Find Solace Here! Announcements, lots of strategy/design discussions, technical support, and general good vibes.</li>
                </ul>
            </li>
            <li>
                <a href="https://x.com/dragonfly_xyz" target="_blank">Dragonfly Twitter Account</a>
                <ul>
                    <li>
                        Here we'll post major progress updates and any important announcements. Be sure to follow!
                    </li>
                </ul>
            </li>
            <li>
                <a href={`${chain.blockExplorers?.default.url}address/${CONTEST_ADDRESS}`} target="_blank">Contest contract</a>
                <ul>
                    <li>
                        The onchain component of the contest, which handles registration, submissions, and payouts.
                    </li>
                </ul>
            </li>
        </ul>
    </section>
    <section>
        <h2>Legal Disclosures</h2>
        <ul>
            <li>
                <a href={`${base}/rules`}>Contest Rules</a>
            </li>
            <li>
                <a href={`${base}/privacy`}>Privacy Agreement</a>
            </li>
        </ul>
    </section>
</Page>