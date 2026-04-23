import http from 'http';

const testEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    console.log(`\n📋 Testing: ${description}`);
    console.log(`   URL: http://localhost:3001${path}`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        try {
          const json = JSON.parse(data);
          console.log(`   Success: ${json.success}`);
          console.log(`   Count: ${json.count || 'N/A'}`);
          
          if (json.matches && json.matches.length > 0) {
            console.log(`   First match: ${json.matches[0].homeTeam} vs ${json.matches[0].awayTeam}`);
            console.log(`   League: ${json.matches[0].league}`);
            console.log(`   Odds: Home ${json.matches[0].odds?.home || 'N/A'}, Draw ${json.matches[0].odds?.draw || 'N/A'}, Away ${json.matches[0].odds?.away || 'N/A'}`);
          } else if (json.data && json.data.length > 0) {
            console.log(`   First live match: ${json.data[0].homeTeam} vs ${json.data[0].awayTeam}`);
          } else {
            console.log(`   Data: ${JSON.stringify(json).substring(0, 100)}`);
          }
        } catch (e) {
          console.log(`   Parse error: ${e.message}`);
          console.log(`   Raw: ${data.substring(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`   Error: ${e.message}`);
      resolve();
    });

    req.end();
  });
};

async function runTests() {
  console.log('========================================');
  console.log('Testing API-Sports Backend Endpoints');
  console.log('========================================');
  
  await testEndpoint('/api/sports/football/fixtures?date=2026-04-10', 'Fixtures by date');
  await testEndpoint('/api/sports/football/live', 'Live fixtures');
  await testEndpoint('/api/sports/football/leagues', 'Leagues');
  await testEndpoint('/api/sports/status', 'API Status');
  
  console.log('\n✅ All tests completed!');
}

runTests();