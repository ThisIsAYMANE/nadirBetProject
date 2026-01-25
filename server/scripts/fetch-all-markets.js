import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', 'env');
let envVars = {};

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        envVars[key.trim()] = value;
      }
    }
  });
} catch (error) {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    envVars = process.env;
  } catch (e) {
    console.error('Could not load environment variables');
  }
}

const BASE_URL = envVars.SPORTS_API_URL || 'https://api.the-odds-api.com/v4';
const API_KEY = envVars.SPORTS_API_KEY || process.env.SPORTS_API_KEY;
const DEFAULT_REGION = envVars.SPORTS_API_REGION || 'us'; // Default to 'us' for more markets

if (!API_KEY) {
  console.error('❌ SPORTS_API_KEY not found in env file or environment variables');
  process.exit(1);
}

/**
 * All possible market types from The Odds API
 */
const ALL_MARKETS = {
  // Featured Markets
  featured: [
    'h2h',              // Head to head / Moneyline
    'spreads',          // Point spreads / Handicap
    'totals',           // Over/Under totals
    'outrights',        // Outrights / Futures
  ],
  
  // Additional Markets (Soccer)
  soccer: [
    'btts',                    // Both Teams to Score
    'draw_no_bet',             // Draw No Bet
    'h2h_3_way',               // 3-way match winner
    'double_chance',            // Double Chance
    'alternate_spreads',       // Alternate Spreads
    'alternate_totals',        // Alternate Totals
    'team_totals',             // Team Totals
    'alternate_team_totals',   // Alternate Team Totals
    'alternate_spreads_corners', // Handicap Corners
    'alternate_totals_corners',  // Total Corners
    'alternate_spreads_cards',   // Handicap Cards
    'alternate_totals_cards',    // Total Cards
  ],
  
  // Game Period Markets
  periods: [
    // Quarters
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    // Halves
    'h2h_h1', 'h2h_h2',
    'h2h_3_way_h1', 'h2h_3_way_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
    // Periods (Hockey)
    'h2h_p1', 'h2h_p2', 'h2h_p3',
    'h2h_3_way_p1', 'h2h_3_way_p2', 'h2h_3_way_p3',
    'spreads_p1', 'spreads_p2', 'spreads_p3',
    'totals_p1', 'totals_p2', 'totals_p3',
    'alternate_spreads_p1', 'alternate_spreads_p2', 'alternate_spreads_p3',
    'alternate_totals_p1', 'alternate_totals_p2', 'alternate_totals_p3',
    'team_totals_p1', 'team_totals_p2', 'team_totals_p3',
    'alternate_team_totals_p1', 'alternate_team_totals_p2', 'alternate_team_totals_p3',
    // Innings (Baseball)
    'h2h_1st_1_innings', 'h2h_1st_3_innings', 'h2h_1st_5_innings', 'h2h_1st_7_innings',
    'h2h_3_way_1st_1_innings', 'h2h_3_way_1st_3_innings', 'h2h_3_way_1st_5_innings', 'h2h_3_way_1st_7_innings',
    'spreads_1st_1_innings', 'spreads_1st_3_innings', 'spreads_1st_5_innings', 'spreads_1st_7_innings',
    'totals_1st_1_innings', 'totals_1st_3_innings', 'totals_1st_5_innings', 'totals_1st_7_innings',
    'alternate_spreads_1st_1_innings', 'alternate_spreads_1st_3_innings', 'alternate_spreads_1st_5_innings', 'alternate_spreads_1st_7_innings',
    'alternate_totals_1st_1_innings', 'alternate_totals_1st_3_innings', 'alternate_totals_1st_5_innings', 'alternate_totals_1st_7_innings',
  ],
  
  // NFL Player Props
  nfl_player_props: [
    'player_assists',
    'player_defensive_interceptions',
    'player_field_goals',
    'player_kicking_points',
    'player_pass_attempts',
    'player_pass_completions',
    'player_pass_interceptions',
    'player_pass_longest_completion',
    'player_pass_rush_yds',
    'player_pass_rush_reception_tds',
    'player_pass_rush_reception_yds',
    'player_pass_tds',
    'player_pass_yds',
    'player_pass_yds_q1',
    'player_pats',
    'player_receptions',
    'player_reception_longest',
    'player_reception_tds',
    'player_reception_yds',
    'player_rush_attempts',
    'player_rush_longest',
    'player_rush_reception_tds',
    'player_rush_reception_yds',
    'player_rush_tds',
    'player_rush_yds',
    'player_sacks',
    'player_solo_tackles',
    'player_tackles_assists',
    'player_tds_over',
    'player_1st_td',
    'player_anytime_td',
    'player_last_td',
  ],
  
  // NBA Player Props
  nba_player_props: [
    'player_points',
    'player_points_q1',
    'player_rebounds',
    'player_rebounds_q1',
    'player_assists',
    'player_assists_q1',
    'player_threes',
    'player_blocks',
    'player_steals',
    'player_blocks_steals',
    'player_turnovers',
    'player_points_rebounds_assists',
    'player_points_rebounds',
    'player_points_assists',
    'player_rebounds_assists',
    'player_field_goals',
    'player_frees_made',
    'player_frees_attempts',
    'player_first_basket',
    'player_first_team_basket',
    'player_double_double',
    'player_triple_double',
    'player_method_of_first_basket',
  ],
  
  // MLB Player Props
  mlb_player_props: [
    'batter_home_runs',
    'batter_first_home_run',
    'batter_hits',
    'batter_total_bases',
    'batter_rbis',
    'batter_runs_scored',
    'batter_hits_runs_rbis',
    'batter_singles',
    'batter_doubles',
    'batter_triples',
    'batter_walks',
    'batter_strikeouts',
    'batter_stolen_bases',
    'pitcher_strikeouts',
    'pitcher_record_a_win',
    'pitcher_hits_allowed',
    'pitcher_walks',
    'pitcher_earned_runs',
    'pitcher_outs',
  ],
  
  // NHL Player Props
  nhl_player_props: [
    'player_points',
    'player_power_play_points',
    'player_assists',
    'player_blocked_shots',
    'player_shots_on_goal',
    'player_goals',
    'player_total_saves',
    'player_goal_scorer_first',
    'player_goal_scorer_last',
    'player_goal_scorer_anytime',
  ],
  
  // Soccer Player Props
  soccer_player_props: [
    'player_goal_scorer_anytime',
    'player_first_goal_scorer',
    'player_last_goal_scorer',
    'player_to_receive_card',
    'player_to_receive_red_card',
    'player_shots_on_target',
    'player_shots',
    'player_assists',
  ],
};

/**
 * Fetch odds from API
 */
async function fetchOddsAPI(path) {
  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      // Handle 400 (bad request) and 404 (not found) gracefully
      if (res.status === 400 || res.status === 404) {
        // Some markets might not be available, return null instead of error
        return null;
      }
      throw new Error(`API error ${res.status}: ${text.substring(0, 200)}`);
    }
    return await res.json();
  } catch (error) {
    if (error.message.includes('400') || error.message.includes('404')) {
      return null; // Market or event not available
    }
    // Don't throw for network errors that might be 404s
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get all markets for an event by trying different market groups
 */
async function getAllMarketsForEvent(eventId, sportKey, region = DEFAULT_REGION) {
  console.log(`\n🔍 Fetching ALL markets for event: ${eventId}`);
  console.log(`   Sport: ${sportKey}, Region: ${region}\n`);
  
  const allResults = {
    eventId,
    sportKey,
    region,
    markets: {},
    summary: {
      totalMarkets: 0,
      availableMarkets: [],
      unavailableMarkets: [],
      bookmakers: new Set(),
    }
  };

  // Try featured markets first
  console.log('📊 Fetching Featured Markets...');
  const featuredMarkets = ALL_MARKETS.featured.join(',');
  const featuredData = await fetchOddsAPI(
    `/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${featuredMarkets}&oddsFormat=decimal`
  );
  
  if (!featuredData) {
    console.log('⚠️  Event not found (404). This could mean:');
    console.log('   - The event has already started/finished');
    console.log('   - The event was removed from the API');
    console.log('   - The event ID is invalid');
    console.log('💡 Try running auto-fetch-all-markets.js again to get a fresh event ID.');
    return allResults;
  }
  
  if (featuredData && featuredData.bookmakers) {
    processMarkets(featuredData, ALL_MARKETS.featured, allResults);
  }

  // Try soccer markets if applicable
  if (sportKey.includes('soccer') || sportKey.includes('football')) {
    console.log('⚽ Fetching Soccer Markets...');
    const soccerMarkets = ALL_MARKETS.soccer.join(',');
    const soccerData = await fetchOddsAPI(
      `/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${soccerMarkets}&oddsFormat=decimal`
    );
    
    if (soccerData && soccerData.bookmakers) {
      processMarkets(soccerData, ALL_MARKETS.soccer, allResults);
    }
  }

  // Try NFL player props if NFL
  if (sportKey.includes('americanfootball_nfl') || sportKey.includes('nfl')) {
    console.log('🏈 Fetching NFL Player Props...');
    const nflProps = ALL_MARKETS.nfl_player_props.join(',');
    const nflData = await fetchOddsAPI(
      `/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${nflProps}&oddsFormat=american`
    );
    
    if (nflData && nflData.bookmakers) {
      processMarkets(nflData, ALL_MARKETS.nfl_player_props, allResults);
    }
  }

  // Try NBA player props if NBA
  if (sportKey.includes('basketball_nba') || sportKey.includes('nba')) {
    console.log('🏀 Fetching NBA Player Props...');
    const nbaProps = ALL_MARKETS.nba_player_props.join(',');
    const nbaData = await fetchOddsAPI(
      `/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${nbaProps}&oddsFormat=american`
    );
    
    if (nbaData && nbaData.bookmakers) {
      processMarkets(nbaData, ALL_MARKETS.nba_player_props, allResults);
    }
  }

  // Try MLB player props if MLB
  if (sportKey.includes('baseball_mlb') || sportKey.includes('mlb')) {
    console.log('⚾ Fetching MLB Player Props...');
    const mlbProps = ALL_MARKETS.mlb_player_props.join(',');
    const mlbData = await fetchOddsAPI(
      `/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${mlbProps}&oddsFormat=american`
    );
    
    if (mlbData && mlbData.bookmakers) {
      processMarkets(mlbData, ALL_MARKETS.mlb_player_props, allResults);
    }
  }

  // Try NHL player props if NHL
  if (sportKey.includes('icehockey_nhl') || sportKey.includes('nhl')) {
    console.log('🏒 Fetching NHL Player Props...');
    const nhlProps = ALL_MARKETS.nhl_player_props.join(',');
    const nhlData = await fetchOddsAPI(
      `/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${nhlProps}&oddsFormat=american`
    );
    
    if (nhlData && nhlData.bookmakers) {
      processMarkets(nhlData, ALL_MARKETS.nhl_player_props, allResults);
    }
  }

  // Try soccer player props if soccer
  if (sportKey.includes('soccer')) {
    console.log('⚽ Fetching Soccer Player Props...');
    const soccerProps = ALL_MARKETS.soccer_player_props.join(',');
    const soccerPropsData = await fetchOddsAPI(
      `/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${soccerProps}&oddsFormat=decimal`
    );
    
    if (soccerPropsData && soccerPropsData.bookmakers) {
      processMarkets(soccerPropsData, ALL_MARKETS.soccer_player_props, allResults);
    }
  }

  return allResults;
}

/**
 * Process markets from API response
 */
function processMarkets(data, marketList, results) {
  if (!data || !data.bookmakers) return;

  data.bookmakers.forEach(bookmaker => {
    results.summary.bookmakers.add(bookmaker.key);
    
    bookmaker.markets?.forEach(market => {
      if (!results.markets[market.key]) {
        results.markets[market.key] = {
          key: market.key,
          available: true,
          bookmakers: [],
          sampleOutcomes: null,
        };
        results.summary.totalMarkets++;
        results.summary.availableMarkets.push(market.key);
      }
      
      results.markets[market.key].bookmakers.push({
        key: bookmaker.key,
        title: bookmaker.title,
        outcomes: market.outcomes,
      });
      
      // Store sample outcomes from first bookmaker
      if (!results.markets[market.key].sampleOutcomes && market.outcomes) {
        results.markets[market.key].sampleOutcomes = market.outcomes.map(o => ({
          name: o.name,
          description: o.description,
          price: o.price,
          point: o.point,
        }));
      }
    });
  });
}

/**
 * Display results
 */
function displayResults(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPLETE MARKET ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Event ID: ${results.eventId}`);
  console.log(`Sport: ${results.sportKey}`);
  console.log(`Region: ${results.region}`);
  console.log(`Bookmakers: ${Array.from(results.summary.bookmakers).join(', ')}`);
  console.log(`Total Markets Found: ${results.summary.totalMarkets}\n`);

  // Group markets by category
  const categories = {
    'Featured Markets': [],
    'Soccer Markets': [],
    'Player Props': [],
    'Period Markets': [],
    'Other': [],
  };

  results.summary.availableMarkets.forEach(marketKey => {
    if (ALL_MARKETS.featured.includes(marketKey)) {
      categories['Featured Markets'].push(marketKey);
    } else if (ALL_MARKETS.soccer.includes(marketKey)) {
      categories['Soccer Markets'].push(marketKey);
    } else if (
      marketKey.startsWith('player_') ||
      marketKey.startsWith('batter_') ||
      marketKey.startsWith('pitcher_')
    ) {
      categories['Player Props'].push(marketKey);
    } else if (
      marketKey.includes('_q') ||
      marketKey.includes('_h') ||
      marketKey.includes('_p') ||
      marketKey.includes('_innings')
    ) {
      categories['Period Markets'].push(marketKey);
    } else {
      categories['Other'].push(marketKey);
    }
  });

  // Display by category
  Object.entries(categories).forEach(([category, markets]) => {
    if (markets.length > 0) {
      console.log(`\n📁 ${category} (${markets.length})`);
      console.log('-'.repeat(80));
      markets.forEach(marketKey => {
        const market = results.markets[marketKey];
        console.log(`\n  🔹 ${marketKey}`);
        console.log(`     Bookmakers: ${market.bookmakers.length}`);
        if (market.sampleOutcomes && market.sampleOutcomes.length > 0) {
          console.log(`     Sample Outcomes:`);
          market.sampleOutcomes.slice(0, 3).forEach(outcome => {
            const desc = outcome.description ? ` (${outcome.description})` : '';
            const point = outcome.point !== undefined ? ` @ ${outcome.point}` : '';
            console.log(`       • ${outcome.name}${desc}${point} - ${outcome.price}`);
          });
          if (market.sampleOutcomes.length > 3) {
            console.log(`       ... and ${market.sampleOutcomes.length - 3} more`);
          }
        }
      });
    }
  });

  // Save full results
  const outputPath = join(__dirname, '..', 'data', `all-markets-${Date.now()}.json`);
  
  try {
    mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  } catch (e) {
    // Directory exists
  }
  
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n\n💾 Full results saved to: ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: node fetch-all-markets.js <eventId> [sportKey] [region]

Fetches ALL available markets for a specific event, including:
- Featured markets (h2h, spreads, totals)
- Soccer markets (btts, draw_no_bet, etc.)
- Player props (NFL, NBA, MLB, NHL, Soccer)
- Period markets (quarters, halves, innings)

Arguments:
  eventId    - The event ID from The Odds API (required)
  sportKey   - Sport key (default: auto-detect from event)
  region     - Region: us, uk, au, eu (default: us)

Examples:
  # Fetch all markets for an NFL event
  node fetch-all-markets.js a512a48a58c4329048174217b2cc7ce0 americanfootball_nfl us

  # Fetch all markets for a soccer event
  node fetch-all-markets.js abc123def456 soccer_epl eu

How to get eventId:
  1. Run: node scripts/quick-inspect-event.js <sportKey>
  2. Copy the Event ID from the output
  3. Use it with this script
    `);
    process.exit(0);
  }

  const eventId = args[0];
  const sportKey = args[1] || 'americanfootball_nfl';
  const region = args[2] || 'us';

  try {
    const results = await getAllMarketsForEvent(eventId, sportKey, region);
    displayResults(results);
    console.log('\n✅ Analysis complete!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
