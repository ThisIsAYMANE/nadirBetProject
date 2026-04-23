const axios = require('axios');

const API_KEY = '303e4402fcec0c684084b2b79a2b6338';
const BASE_URL = 'https://v1.afl.api-sports.io';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-apisports-key': API_KEY },
  timeout: 10000
});

async function testTimezone() {
  try {
    const response = await client.get('/timezone');
    console.log('✓ Timezone test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Timezone test failed:', error.message);
    return false;
  }
}

async function testSeasons() {
  try {
    const response = await client.get('/seasons');
    console.log('✓ Seasons test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Seasons test failed:', error.message);
    return false;
  }
}

async function testLeagues() {
  try {
    const response = await client.get('/leagues?season=2023');
    console.log('✓ Leagues test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Leagues test failed:', error.message);
    return false;
  }
}

async function testTeams() {
  try {
    const response = await client.get('/teams?league=1&season=2023');
    console.log('✓ Teams test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Teams test failed:', error.message);
    return false;
  }
}

async function testGames() {
  try {
    const response = await client.get('/games?league=1&season=2023');
    console.log('✓ Games test passed - results:', response.data.results);
    return true;
  } catch (error) {
    console.error('✗ Games test failed:', error.message);
    return false;
  }
}

async function testStandings() {
  try {
    const response = await client.get('/standings?league=1&season=2023');
    console.log('✓ Standings test passed - results:', response.data.results);
    return true;
  } catch (error) {
    console.error('✗ Standings test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Running API-AFL tests...\n');
  
  const results = await Promise.all([
    testTimezone(),
    testSeasons(),
    testLeagues(),
    testTeams(),
    testGames(),
    testStandings()
  ]);
  
  const passed = results.filter(r => r).length;
  console.log(`\nResults: ${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('All tests passed! ✓');
  } else {
    console.log('Some tests failed!');
    process.exit(1);
  }
}

runTests();
