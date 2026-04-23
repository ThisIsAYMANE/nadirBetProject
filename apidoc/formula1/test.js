const axios = require('axios');

const API_KEY = '303e4402fcec0c684084b2b79a2b6338';
const BASE_URL = 'https://v1.formula-1.api-sports.io';

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

async function testCompetitions() {
  try {
    const response = await client.get('/competitions');
    console.log('✓ Competitions test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Competitions test failed:', error.message);
    return false;
  }
}

async function testTeams() {
  try {
    const response = await client.get('/teams');
    console.log('✓ Teams test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Teams test failed:', error.message);
    return false;
  }
}

async function testDrivers() {
  try {
    const response = await client.get('/drivers?search=hamilton');
    console.log('✓ Drivers test passed - results:', response.data.results);
    return response.data.results > 0;
  } catch (error) {
    console.error('✗ Drivers test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Running API-Formula-1 tests...\n');
  
  const results = await Promise.all([
    testSeasons(),
    testCompetitions(),
    testTeams(),
    testDrivers()
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
