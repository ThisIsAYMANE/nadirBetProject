const { ApiFootball } = require('./dist');
const fs = require('fs');

const env = fs.readFileSync('./.env', 'utf-8');
const apiKey = env.split('\n').find(l => l.startsWith('API_KEY='))?.split('=')[1] || '';

if (!apiKey) {
  console.error('Please set your API_KEY in .env file');
  process.exit(1);
}

const api = new ApiFootball({
  apiKey,
  cacheTTL: 300,
});

async function main() {
  console.log('=== API-Football SDK Demo ===\n');

  console.log('1. Getting API status...');
  try {
    const status = await api.getStatus();
    console.log('   Plan:', status.response.subscription.plan);
    console.log('   Active:', status.response.subscription.active);
    console.log('   Requests:', status.response.requests.current, '/', status.response.requests.limit_day);
  } catch (e) {
    console.error('   Error:', e.message);
  }

  console.log('\n2. Getting leagues for England...');
  try {
    const leagues = await api.request('/leagues', { country: 'England', current: 'true' });
    console.log('   Found', leagues.results, 'leagues');
    leagues.response.slice(0, 3).forEach(l => {
      console.log('   -', l.league.name, '(' + l.league.type + ')');
    });
  } catch (e) {
    console.error('   Error:', e.message);
  }

  console.log('\n3. Getting timezones...');
  try {
    const tz = await api.getTimezone();
    console.log('   Found', tz.results, 'timezones');
    console.log('   Sample:', tz.response.slice(0, 3));
  } catch (e) {
    console.error('   Error:', e.message);
  }

  console.log('\n=== Demo Complete ===');
}

main().catch(console.error);