const axios = require('axios');

const API_KEY = '303e4402fcec0c684084b2b79a2b6338';
const BASE_URL = 'https://v1.handball.api-sports.io';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-apisports-key': API_KEY },
  timeout: 10000
});

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
    const response = await client.get('/leagues?season=2021');
    console.log('✓ Leagues test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Leagues test failed:', error.message);
    return false;
  }
}

async function testTeams() {
  try {
    const response = await client.get('/teams?league=1&season=2021');
    console.log('✓ Teams test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Teams test failed:', error.message);
    return false;
  }
}

async function testGames() {
  try {
    const response = await client.get('/games?league=1&season=2021');
    console.log('✓ Games test passed - results:', response.data.results);
    return true;
  } catch (error) {
    console.error('✗ Games test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Running API-Handball tests...\n');
  
  const results = await Promise.all([
    testSeasons(),
    testLeagues(),
    testTeams(),
    testGames()
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
