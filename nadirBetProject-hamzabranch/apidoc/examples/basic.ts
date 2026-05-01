import { ApiFootball } from '../src';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.API_KEY || '';

if (!apiKey || apiKey === 'your_api_key_here') {
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
    console.error('   Error:', e);
  }

  console.log('\n2. Getting leagues for England...');
  try {
    const leagues = await api.request('/leagues', { country: 'England', current: 'true' });
    const data = leagues as { results: number; response: Array<{ league: { name: string; type: string } }> };
    console.log('   Found', data.results, 'leagues');
    data.response.slice(0, 3).forEach((l: any) => {
      console.log('   -', l.league.name, '(' + l.league.type + ')');
    });
  } catch (e) {
    console.error('   Error:', e);
  }

  console.log('\n3. Getting timezones...');
  try {
    const tz = await api.getTimezone();
    const data = tz as { results: number; response: string[] };
    console.log('   Found', data.results, 'timezones');
    console.log('   Sample:', data.response.slice(0, 3));
  } catch (e) {
    console.error('   Error:', e);
  }

  console.log('\n=== Demo Complete ===');
}

main().catch(console.error);