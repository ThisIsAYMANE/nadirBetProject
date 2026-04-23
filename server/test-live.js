import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sports/football/live',
  method: 'GET'
};

console.log('Testing API-Sports LIVE endpoint...');

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
      console.log('Live match count:', json.count);
      
      if (json.data && json.data.length > 0) {
        console.log('\nFirst live match:');
        console.log(JSON.stringify(json.data[0], null, 2));
      } else {
        console.log('No live matches at the moment');
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