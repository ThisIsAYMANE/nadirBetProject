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
  console.error('❌ SPORTS_API_KEY not found');
  process.exit(1);
}

/**
 * Quick inspection - fetches first available event and shows all markets
 */
async function quickInspect(sportKey = 'soccer_epl') {
  console.log('🔍 Quick Market Inspector');
  console.log('='.repeat(80));
  console.log(`Sport: ${sportKey}\n`);

  try {
    // Step 1: Get first event from sport
    console.log('📥 Step 1: Fetching events...');
    const eventsPath = `/sports/${encodeURIComponent(sportKey)}/odds?regions=${DEFAULT_REGION}&markets=h2h&oddsFormat=decimal`;
    const url = `${BASE_URL}${eventsPath}${eventsPath.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
    
    const eventsRes = await fetch(url);
    if (!eventsRes.ok) {
      throw new Error(`Failed to fetch events: ${eventsRes.status}`);
    }
    
    const events = await eventsRes.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      console.log('⚠️  No events found for this sport');
      return;
    }

    const firstEvent = events[0];
    console.log(`✅ Found event: ${firstEvent.home_team} vs ${firstEvent.away_team}`);
    console.log(`   Event ID: ${firstEvent.id}\n`);

    // Step 2: Fetch ALL available markets for this event
    console.log('📥 Step 2: Fetching ALL markets for this event...');
    console.log('   (This uses the /events/{eventId}/odds endpoint which supports more markets)\n');
    
    // Request all common markets
    const allMarkets = [
      'h2h',                    // Head to head
      'spreads',                // Point spreads
      'totals',                 // Over/Under
      'btts',                   // Both teams to score
      'draw_no_bet',            // Draw no bet
      'alternate_spreads',      // Alternate spreads
      'alternate_totals',       // Alternate totals
      'team_totals',            // Team totals
      'alternate_team_totals',  // Alternate team totals
      'double_chance'           // Double chance
    ].join(',');

    const eventOddsPath = `/events/${encodeURIComponent(firstEvent.id)}/odds?regions=${DEFAULT_REGION}&markets=${allMarkets}&oddsFormat=decimal`;
    const eventUrl = `${BASE_URL}${eventOddsPath}${eventOddsPath.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
    
    const eventRes = await fetch(eventUrl);
    if (!eventRes.ok) {
      const text = await eventRes.text();
      console.log(`⚠️  Note: Some markets may not be available (${eventRes.status})`);
      console.log(`   Response: ${text.substring(0, 200)}...\n`);
      
      // Try with just basic markets
      const basicMarkets = 'h2h,spreads,totals,btts,draw_no_bet';
      const basicPath = `/events/${encodeURIComponent(firstEvent.id)}/odds?regions=${DEFAULT_REGION}&markets=${basicMarkets}&oddsFormat=decimal`;
      const basicUrl = `${BASE_URL}${basicPath}${basicPath.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
      
      const basicRes = await fetch(basicUrl);
      if (!basicRes.ok) {
        throw new Error(`Failed to fetch event odds: ${basicRes.status}`);
      }
      
      const eventData = await basicRes.json();
      displayMarkets(eventData, firstEvent);
      return;
    }

    const eventData = await eventRes.json();
    displayMarkets(eventData, firstEvent);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Display markets in a readable format
 */
function displayMarkets(eventData, originalEvent) {
  console.log('='.repeat(80));
  console.log(`📊 MARKET ANALYSIS: ${originalEvent.home_team} vs ${originalEvent.away_team}`);
  console.log('='.repeat(80));

  if (!eventData.bookmakers || eventData.bookmakers.length === 0) {
    console.log('⚠️  No bookmakers found for this event');
    return;
  }

  // Use first bookmaker as reference
  const bookmaker = eventData.bookmakers[0];
  console.log(`\n📚 Bookmaker: ${bookmaker.key} (${bookmaker.title})`);
  console.log(`   Markets available: ${bookmaker.markets?.length || 0}\n`);

  if (!bookmaker.markets || bookmaker.markets.length === 0) {
    console.log('⚠️  No markets found');
    return;
  }

  // Display each market
  bookmaker.markets.forEach((market, index) => {
    console.log(`\n${index + 1}. Market: ${market.key}`);
    console.log('   '.repeat(1) + '-'.repeat(76));
    
    if (market.outcomes && market.outcomes.length > 0) {
      market.outcomes.forEach((outcome, oIndex) => {
        const price = outcome.price || 'N/A';
        const point = outcome.point !== undefined ? ` (${outcome.point > 0 ? '+' : ''}${outcome.point})` : '';
        const name = outcome.name || outcome.description || 'N/A';
        console.log(`   ${oIndex + 1}. ${name.padEnd(30)} @ ${price}${point}`);
      });
    } else {
      console.log('   No outcomes available');
    }
  });

  // Show JSON structure
  console.log('\n\n' + '='.repeat(80));
  console.log('📄 FULL JSON STRUCTURE (First Market Only)');
  console.log('='.repeat(80));
  if (bookmaker.markets && bookmaker.markets.length > 0) {
    console.log(JSON.stringify({
      market_key: bookmaker.markets[0].key,
      outcomes: bookmaker.markets[0].outcomes
    }, null, 2));
  }

  // Save full response
  const outputPath = join(__dirname, '..', 'data', `event-markets-${Date.now()}.json`);
  const fs = await import('fs');
  const { writeFileSync, mkdirSync } = fs;
  
  try {
    mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  } catch (e) {
    // Directory exists
  }
  
  writeFileSync(outputPath, JSON.stringify(eventData, null, 2));
  console.log(`\n💾 Full response saved to: ${outputPath}`);
}

// Parse command line
const sportKey = process.argv[2] || 'soccer_epl';

quickInspect(sportKey)
  .then(() => {
    console.log('\n✅ Inspection complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
