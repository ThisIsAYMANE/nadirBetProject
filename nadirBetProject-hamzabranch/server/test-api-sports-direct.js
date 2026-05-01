import fetch from 'node-fetch';

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.APISPORTS_API_KEY || '303e4402fcec0c684084b2b79a2b6338';

async function test() {
  console.log('Testing API-Sports directly...\n');
  console.log('API Key:', API_KEY);
  console.log('Base URL:', BASE_URL);

  // Test 1: Status
  console.log('\n1. Testing /status endpoint...');
  try {
    const statusRes = await fetch(`${BASE_URL}/status`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const statusData = await statusRes.json();
    console.log('Status:', statusRes.status);
    console.log('Success:', statusData.success);
    if (statusData.response) {
      console.log('Requests used:', statusData.response.requests?.current);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  // Test 2: Fixtures by date
  console.log('\n2. Testing /fixtures endpoint...');
  try {
    const fixtureRes = await fetch(`${BASE_URL}/fixtures?date=2026-04-10`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const fixtureData = await fixtureRes.json();
    console.log('Status:', fixtureRes.status);
    console.log('Results:', fixtureData.results);
    
    if (fixtureData.response && fixtureData.response.length > 0) {
      const first = fixtureData.response[0];
      console.log('\nFirst fixture:');
      console.log('  ID:', first.fixture?.id);
      console.log('  League:', first.league?.name);
      console.log('  Home:', first.teams?.home?.name);
      console.log('  Away:', first.teams?.away?.name);
      
      // Check odds
      if (first.odds) {
        console.log('  Odds available:', first.odds.length);
        if (first.odds[0]) {
          console.log('  First bookmaker odds:', JSON.stringify(first.odds[0]));
        }
      } else {
        console.log('  No odds in fixture response');
      }
    } else {
      console.log('No fixtures found for this date');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  // Test 3: Get specific fixture details
  console.log('\n3. Testing odds for specific fixture...');
  try {
    // First get some fixtures
    const allFixtures = await fetch(`${BASE_URL}/fixtures?date=2026-04-10`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const fixturesData = await allFixtures.json();
    
    console.log('Found', fixturesData.results, 'fixtures');
    
    // Find first one with league 39 (Premier League)
    const targetFixture = fixturesData.response?.find(f => f.league?.id === 39);
    
    if (targetFixture) {
      const fixtureId = targetFixture.fixture.id;
      console.log('\nFound Premier League fixture ID:', fixtureId);
      console.log('  Home:', targetFixture.teams?.home?.name);
      console.log('  Away:', targetFixture.teams?.away?.name);
      
      // Get odds for this fixture
      const oddsRes = await fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const oddsData = await oddsRes.json();
      console.log('Odds status:', oddsRes.status);
      console.log('Odds results:', oddsData.results);
      
      if (oddsData.response && oddsData.response.length > 0) {
        console.log('Full odds response:', JSON.stringify(oddsData.response[0], null, 2));
      } else {
        console.log('No odds response for this fixture');
        console.log('Response:', JSON.stringify(oddsData).substring(0, 1000));
      }
    } else {
      console.log('No Premier League fixture found today');
      // Show sample of first fixture
      if (fixturesData.response && fixturesData.response.length > 0) {
        console.log('Sample fixture:', JSON.stringify(fixturesData.response[0], null, 2));
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n=== Test Complete ===');
}

test().catch(console.error);