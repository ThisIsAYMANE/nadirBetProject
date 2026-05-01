import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sports/football',
  method: 'GET'
};

console.log('Testing /api/sports/football endpoint...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      console.log('Match count:', json.count);
      
      if (json.matches && json.matches.length > 0) {
        console.log('\nFirst 3 matches:');
        json.matches.slice(0, 3).forEach((m, i) => {
          console.log(`${i+1}. ${m.homeTeam} vs ${m.awayTeam} (${m.league})`);
        });
      }
    } catch (e) {
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();