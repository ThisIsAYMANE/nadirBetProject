/**
 * Quick Casino Test Plan – API only (no Live Casino; Live Casino endpoint can take 1–2 min).
 * Requires backend running: npm start (in server folder).
 * Usage: node scripts/run-casino-test-plan-quick.js [BASE_URL]
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

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
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
  console.log('Casino Test Plan – Quick API checks');
  console.log('Base URL:', BASE);
  console.log('');

  try {
    const health = await get('/health');
    ok('Health returns 200', health.status === 200);
  } catch (e) {
    failed++;
    console.log('  FAIL: Health', e.message);
    if (e.cause?.code === 'ECONNREFUSED') {
      console.log('  → Start backend: cd server && npm start');
    }
    console.log('\nResult:', passed, 'passed', failed, 'failed');
    process.exit(1);
  }

  console.log('Phase 2.1 – Games list (single page, no type)');
  try {
    const all = await get('/api/casino/games?perPage=5');
    ok('Games returns 200', all.status === 200);
    ok('Items array present', Array.isArray(all.data?.items), all.data?.items?.length);
    ok('_meta present', all.data?._meta != null);
  } catch (e) {
    failed++;
    console.log('  FAIL: Games list', e.message);
  }
  console.log('');

  console.log('Phase 2.2 – Providers');
  try {
    const prov = await get('/api/casino/providers?currency=EUR');
    ok('Providers returns 200', prov.status === 200);
    const providers = prov.data?.providers ?? (Array.isArray(prov.data) ? prov.data : null);
    ok('Providers list exists', Array.isArray(providers) && providers.length > 0, providers?.length);
  } catch (e) {
    failed++;
    console.log('  FAIL: Providers', e.message);
  }
  console.log('');

  console.log('---');
  console.log('Result:', passed, 'passed', failed, 'failed');
  console.log('(For Live Casino API test run: node scripts/run-casino-test-plan.js – may take 1–2 min)');
  process.exit(failed > 0 ? 1 : 0);
}

main();
