import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sports/football/fixtures?date=2026-04-10',
  method: 'GET'
};

console.log('Testing API-Sports fixtures endpoint...');

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
        console.log('\nFirst match:');
        console.log(JSON.stringify(json.matches[0], null, 2));
      } else {
        console.log('No matches found');
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