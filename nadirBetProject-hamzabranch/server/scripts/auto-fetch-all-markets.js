import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
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
  // Try to use process.env as fallback
  envVars = process.env;
}

const BASE_URL = envVars.SPORTS_API_URL || 'https://api.the-odds-api.com/v4';
const API_KEY = envVars.SPORTS_API_KEY || process.env.SPORTS_API_KEY;
const DEFAULT_REGION = envVars.SPORTS_API_REGION || 'us';

if (!API_KEY) {
  console.error('❌ SPORTS_API_KEY not found');
  process.exit(1);
}

/**
 * Auto-fetch: Find first event and get all markets
 */
async function autoFetchAllMarkets(sportKey = 'americanfootball_nfl', region = DEFAULT_REGION) {
  console.log('🚀 Auto-Fetch All Markets');
  console.log('='.repeat(80));
  console.log(`Sport: ${sportKey}`);
  console.log(`Region: ${region}\n`);

  try {
    // Step 1: Get first event
    console.log('📥 Step 1: Finding first available event...');
    const eventsUrl = `${BASE_URL}/sports/${encodeURIComponent(sportKey)}/odds?regions=${region}&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
    
    const eventsRes = await fetch(eventsUrl);
    if (!eventsRes.ok) {
      throw new Error(`Failed to fetch events: ${eventsRes.status}`);
    }
    
    const events = await eventsRes.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      console.log('⚠️  No events found for this sport');
      console.log('💡 Try a different sport or region');
      return;
    }

    // Try up to 3 events in case the first one is not available
    let event = null;
    for (let i = 0; i < Math.min(3, events.length); i++) {
      const candidateEvent = events[i];
      console.log(`\n🔍 Trying event ${i + 1}: ${candidateEvent.home_team} vs ${candidateEvent.away_team}`);
      console.log(`   Event ID: ${candidateEvent.id}`);
      
      // Quick check if event is available by trying to fetch it
      const checkUrl = `${BASE_URL}/events/${encodeURIComponent(candidateEvent.id)}/odds?regions=${region}&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
      const checkRes = await fetch(checkUrl);
      
      if (checkRes.ok) {
        event = candidateEvent;
        console.log(`✅ Event is available!`);
        break;
      } else {
        console.log(`⚠️  Event not available (${checkRes.status}), trying next...`);
      }
    }

    if (!event) {
      console.log('\n❌ None of the events are available. They may have all started or been removed.');
      console.log('💡 Try a different sport or check back later for new events.');
      return;
    }

    console.log(`\n✅ Using: ${event.home_team} vs ${event.away_team}`);
    console.log(`   Event ID: ${event.id}\n`);

    // Step 2: Call fetch-all-markets.js script
    console.log('📥 Step 2: Fetching ALL markets...\n');
    console.log(`💡 Executing: node fetch-all-markets.js ${event.id} ${sportKey} ${region}\n`);
    
    // Use relative path to avoid Windows path issues with spaces
    const scriptPath = './fetch-all-markets.js';
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [
        scriptPath,
        event.id,
        sportKey,
        region
      ], {
        stdio: 'inherit',
        cwd: __dirname,
        shell: true // Use shell on Windows to handle paths properly
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`\n💡 To fetch markets for this specific event again, use:`);
          console.log(`   node scripts/fetch-all-markets.js ${event.id} ${sportKey} ${region}`);
          resolve();
        } else {
          reject(new Error(`Script exited with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// Parse command line
const sportKey = process.argv[2] || 'americanfootball_nfl';
const region = process.argv[3] || DEFAULT_REGION;

if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log(`
Usage: node auto-fetch-all-markets.js [sportKey] [region]

Automatically finds the first available event for a sport and fetches ALL markets.

Arguments:
  sportKey   - Sport key (default: americanfootball_nfl)
  region     - Region: us, uk, au, eu (default: us)

Examples:
  # NFL with all markets
  node auto-fetch-all-markets.js americanfootball_nfl us

  # NBA with all markets
  node auto-fetch-all-markets.js basketball_nba us

  # Soccer with all markets
  node auto-fetch-all-markets.js soccer_epl eu

Popular Sports:
  - americanfootball_nfl (NFL)
  - basketball_nba (NBA)
  - baseball_mlb (MLB)
  - icehockey_nhl (NHL)
  - soccer_epl (English Premier League)
  - soccer_uefa_champs_league (Champions League)
    `);
  process.exit(0);
}

autoFetchAllMarkets(sportKey, region)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
