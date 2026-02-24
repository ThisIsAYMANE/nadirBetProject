/**
 * Run Casino Test Plan (Phase 1.2 and Phase 2 API checks).
 * Requires backend running: npm start (in server folder).
 * Usage: node scripts/run-casino-test-plan.js [BASE_URL]
 * Default BASE_URL: http://localhost:3001
 */

const BASE = process.argv[2] || 'http://localhost:3001';
let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log('  OK:', name, detail ? `(${detail})` : '');
    return true;
  }
  failed++;
  console.log('  FAIL:', name, detail ? `(${detail})` : '');
  return false;
}

async function get(path, opts = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs || 25000);
  const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
  clearTimeout(t);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = null;
  }
  return { status: res.status, data, text };
}

async function main() {
  console.log('Casino Test Plan – API checks');
  console.log('Base URL:', BASE);
  console.log('');

  // Phase 1.2: Live Casino list (backend may fetch many Slotegrator pages; allow 90s)
  console.log('Phase 1.2 – Live Casino list');
  try {
    const live = await get('/api/casino/games?type=Live%20Casino&perPage=20&expand=tags,parameters,images', { timeoutMs: 90000 });
    ok('Live Casino request returns 200', live.status === 200, `got ${live.status}`);
    ok('Response has items array', Array.isArray(live.data?.items), live.data?.items ? `length ${live.data.items.length}` : '');
    ok('Response has _meta', live.data?._meta != null, live.data?._meta ? `totalCount=${live.data._meta.totalCount}` : '');
    if (Array.isArray(live.data?.items) && live.data.items.length > 0) {
      const first = live.data.items[0];
      ok('Items have uuid, name, provider, has_lobby, type', first.uuid && first.name != null && first.has_lobby !== undefined && first.type != null);
      const withLobby = live.data.items.filter((g) => g.has_lobby === 1);
      ok('Live Casino items are lobby or type contains live', live.data.items.every((g) => g.has_lobby === 1 || (g.type && String(g.type).toLowerCase().includes('live'))), `has_lobby=1: ${withLobby.length}`);
    }
  } catch (e) {
    failed++;
    console.log('  FAIL: Live Casino request threw', e.message);
    if (e.cause?.code === 'ECONNREFUSED') {
      console.log('  → Start backend with: cd server && npm start');
    }
  }
  console.log('');

  // Phase 2.1: Category filter (API)
  console.log('Phase 2.1 – Category filter (API)');
  try {
    const slots = await get('/api/casino/games?type=Slots&perPage=5');
    ok('Slots type returns 200', slots.status === 200);
    ok('Slots items exist', Array.isArray(slots.data?.items) && slots.data.items.length > 0, slots.data?.items?.length);

    const table = await get('/api/casino/games?type=Table%20Games&perPage=5');
    ok('Table Games type returns 200', table.status === 200);
    ok('Table Games items exist', Array.isArray(table.data?.items), table.data?.items?.length);

    const all = await get('/api/casino/games?perPage=5');
    ok('No type returns 200', all.status === 200);
    ok('All games items exist', Array.isArray(all.data?.items) && all.data.items.length > 0);
  } catch (e) {
    failed++;
    console.log('  FAIL: Category filter request threw', e.message);
  }
  console.log('');

  // Phase 2: Providers
  console.log('Phase 2.2 – Providers');
  try {
    const prov = await get('/api/casino/providers?currency=EUR');
    ok('Providers returns 200', prov.status === 200);
    const providers = prov.data?.providers ?? prov.data;
    ok('Providers list exists', Array.isArray(providers) || (prov.data && typeof prov.data === 'object'), Array.isArray(providers) ? providers.length : '');
  } catch (e) {
    failed++;
    console.log('  FAIL: Providers request threw', e.message);
  }
  console.log('');

  console.log('---');
  console.log('Result:', passed, 'passed', failed, 'failed');
  process.exit(failed > 0 ? 1 : 0);
}

main();
