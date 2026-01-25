import { readFileSync } from 'fs';
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
  console.error('Error reading env file, trying .env...');
  // Try dotenv as fallback
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
const DEFAULT_REGION = envVars.SPORTS_API_REGION || 'eu';

if (!API_KEY) {
  console.error('❌ SPORTS_API_KEY not found in env file or environment variables');
  console.error('Please set SPORTS_API_KEY in server/env file');
  process.exit(1);
}

/**
 * Fetch JSON from The Odds API
 */
async function fetchOddsAPI(path) {
  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
  
  console.log(`\n📡 Fetching: ${url.replace(API_KEY, '***')}`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return await res.json();
  } catch (error) {
    console.error('❌ Error fetching:', error.message);
    throw error;
  }
}

/**
 * Analyze and display market structure
 */
function analyzeMarkets(data) {
  if (!Array.isArray(data) || data.length === 0) {
    console.log('⚠️  No events found in response');
    return;
  }

  console.log(`\n✅ Found ${data.length} event(s)\n`);
  console.log('='.repeat(80));

  // Track all unique markets across all events
  const allMarkets = new Set();
  const marketStructures = {};

  data.forEach((event, index) => {
    console.log(`\n📊 Event ${index + 1}: ${event.home_team} vs ${event.away_team}`);
    console.log(`   ID: ${event.id}`);
    console.log(`   Sport: ${event.sport_key || 'N/A'}`);
    console.log(`   Commence Time: ${event.commence_time || 'N/A'}`);
    console.log(`   Bookmakers: ${event.bookmakers?.length || 0}`);

    if (event.bookmakers && event.bookmakers.length > 0) {
      // Analyze markets from first bookmaker (they usually have similar markets)
      const firstBookmaker = event.bookmakers[0];
      console.log(`\n   📋 Bookmaker: ${firstBookmaker.key} (${firstBookmaker.title})`);
      
      if (firstBookmaker.markets) {
        firstBookmaker.markets.forEach(market => {
          allMarkets.add(market.key);
          
          if (!marketStructures[market.key]) {
            marketStructures[market.key] = {
              name: market.key,
              outcomes: new Set(),
              sampleStructure: null
            };
          }

          // Collect outcome types
          if (market.outcomes) {
            market.outcomes.forEach(outcome => {
              marketStructures[market.key].outcomes.add(outcome.name || JSON.stringify(outcome));
            });
          }

          // Store sample structure for first occurrence
          if (!marketStructures[market.key].sampleStructure) {
            marketStructures[market.key].sampleStructure = {
              key: market.key,
              outcomes: market.outcomes?.map(o => ({
                name: o.name,
                price: o.price,
                point: o.point,
                description: o.description
              })) || []
            };
          }
        });

        console.log(`   📈 Available Markets (${firstBookmaker.markets.length}):`);
        firstBookmaker.markets.forEach(market => {
          console.log(`      • ${market.key}`);
          if (market.outcomes) {
            const outcomeNames = market.outcomes.map(o => o.name || o.description || 'N/A').join(', ');
            console.log(`        Outcomes: ${outcomeNames}`);
          }
        });
      }
    }

    console.log('-'.repeat(80));
  });

  // Summary of all markets found
  console.log(`\n\n📊 SUMMARY: All Unique Markets Found (${allMarkets.size})`);
  console.log('='.repeat(80));
  Array.from(allMarkets).sort().forEach(marketKey => {
    const market = marketStructures[marketKey];
    console.log(`\n🔹 ${marketKey}`);
    if (market.outcomes.size > 0) {
      console.log(`   Outcomes: ${Array.from(market.outcomes).join(', ')}`);
    }
    if (market.sampleStructure) {
      console.log(`   Sample Structure:`);
      console.log(JSON.stringify(market.sampleStructure, null, 2));
    }
  });

  return { allMarkets, marketStructures };
}

/**
 * Main inspection function
 */
async function inspectMarkets(options = {}) {
  const {
    sportKey = 'soccer_epl',
    eventId = null,
    markets = 'h2h,spreads,totals,btts,draw_no_bet,alternate_spreads,alternate_totals',
    regions = DEFAULT_REGION
  } = options;

  console.log('🔍 The Odds API Market Inspector');
  console.log('='.repeat(80));
  console.log(`Sport: ${sportKey}`);
  console.log(`Markets: ${markets}`);
  console.log(`Region: ${regions}`);
  if (eventId) {
    console.log(`Event ID: ${eventId}`);
  }

  try {
    let data;

    if (eventId) {
      // Fetch specific event odds (supports more markets)
      console.log('\n📥 Fetching odds for specific event...');
      const path = `/events/${encodeURIComponent(eventId)}/odds?regions=${regions}&markets=${markets}&oddsFormat=decimal`;
      data = await fetchOddsAPI(path);
      
      // The event endpoint returns a single event object
      if (data && !Array.isArray(data)) {
        data = [data];
      }
    } else {
      // Fetch odds for sport
      console.log('\n📥 Fetching odds for sport...');
      const path = `/sports/${encodeURIComponent(sportKey)}/odds?regions=${regions}&markets=${markets}&oddsFormat=decimal`;
      data = await fetchOddsAPI(path);
    }

    if (!data) {
      console.error('❌ No data returned from API');
      return;
    }

    // Analyze the response
    const analysis = analyzeMarkets(data);

    // Save full response to file
    const outputPath = join(__dirname, '..', 'data', `odds-api-response-${Date.now()}.json`);
    const fs = await import('fs');
    const { writeFileSync, mkdirSync } = fs;
    
    try {
      mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Full API response saved to: ${outputPath}`);

    return { data, analysis };

  } catch (error) {
    console.error('\n❌ Error during inspection:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {};

// Parse command line arguments
args.forEach(arg => {
  if (arg.startsWith('--sport=')) {
    options.sportKey = arg.split('=')[1];
  } else if (arg.startsWith('--event=')) {
    options.eventId = arg.split('=')[1];
  } else if (arg.startsWith('--markets=')) {
    options.markets = arg.split('=')[1];
  } else if (arg.startsWith('--regions=')) {
    options.regions = arg.split('=')[1];
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: node inspect-odds-api-markets.js [options]

Options:
  --sport=<sportKey>     Sport key (e.g., soccer_epl, basketball_nba)
                        Default: soccer_epl
  --event=<eventId>      Specific event ID to inspect
  --markets=<markets>    Comma-separated markets to fetch
                        Default: h2h,spreads,totals,btts,draw_no_bet,alternate_spreads,alternate_totals
  --regions=<regions>    Comma-separated regions (us,uk,au,eu)
                        Default: eu
  --help, -h            Show this help message

Examples:
  # Inspect EPL matches with all common markets
  node inspect-odds-api-markets.js --sport=soccer_epl

  # Inspect a specific event with all markets
  node inspect-odds-api-markets.js --event=abc123def456

  # Inspect NBA with specific markets
  node inspect-odds-api-markets.js --sport=basketball_nba --markets=h2h,spreads,totals

  # Inspect US markets
  node inspect-odds-api-markets.js --sport=americanfootball_nfl --regions=us
    `);
    process.exit(0);
  }
});

// Run inspection
inspectMarkets(options)
  .then(() => {
    console.log('\n✅ Inspection complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Inspection failed:', error);
    process.exit(1);
  });
