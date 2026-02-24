/**
 * Inspect what game types and has_lobby values Slotegrator actually returns.
 * Run from server folder: node scripts/inspect-casino-game-types.js
 *
 * Use this to see why "Live Casino" might be empty and what type strings to filter on.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env (same as server)
const envPath = join(__dirname, '..', 'env');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) process.env[key.trim()] = value;
    }
  });
} catch (e) {
  console.error('Load env failed:', e.message);
  process.exit(1);
}

import casinoApiService from '../src/services/CasinoApiService.js';

const PAGES_TO_FETCH = 10; // inspect first 10 pages (500 games)

async function main() {
  console.log('Fetching up to', PAGES_TO_FETCH, 'pages from Slotegrator...\n');

  const typeCounts = {};
  const typesWithLobby = new Set();
  const providerByType = {};
  let totalGames = 0;
  let lobbyCount = 0;

  for (let page = 1; page <= PAGES_TO_FETCH; page++) {
    const response = await casinoApiService.getGames({
      page,
      perPage: 50,
      expand: 'tags,parameters,images',
    });
    const items = response.items || [];
    if (items.length === 0) break;

    for (const g of items) {
      totalGames++;
      const t = g.type != null ? String(g.type).trim() : '(empty)';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
      if (g.has_lobby === 1) {
        lobbyCount++;
        typesWithLobby.add(t);
        if (!providerByType[t]) providerByType[t] = new Set();
        providerByType[t].add(g.provider || '(no provider)');
      }
    }

    if (items.length < 50) break;
  }

  console.log('--- All game types (count) ---');
  const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  for (const [t, count] of sorted) {
    const liveHint = t.toLowerCase().includes('live') ? '  <-- contains "live"' : '';
    console.log(`  "${t}": ${count}${liveHint}`);
  }

  console.log('\n--- Types that have has_lobby === 1 (likely live/table games) ---');
  if (typesWithLobby.size === 0) {
    console.log('  (none in first', totalGames, 'games)');
  } else {
    for (const t of typesWithLobby) {
      const providers = providerByType[t] ? [...providerByType[t]].join(', ') : '';
      console.log(`  "${t}"  providers: ${providers}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log('  Total games scanned:', totalGames);
  console.log('  Games with has_lobby=1:', lobbyCount);
  console.log('  Unique type strings:', Object.keys(typeCounts).length);

  const liveLike = sorted.filter(([t]) => t.toLowerCase().includes('live'));
  if (liveLike.length > 0) {
    console.log('\n  Types containing "live" (used for Live Casino filter):', liveLike.map(([t]) => `"${t}"`).join(', '));
  } else {
    console.log('\n  No game type contains "live". Use has_lobby=1 to show live/table games.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
