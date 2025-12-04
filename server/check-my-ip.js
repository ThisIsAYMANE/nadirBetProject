import https from 'https';

console.log('🌐 Checking your public IP address...\n');

// Method 1: ipify
https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ Your public IP address is:', json.ip);
      console.log('\n📧 Send this IP to Pragmatic Play support and ask them to whitelist it.');
      console.log('   Tell them: "Please whitelist my IP address for API access"');
      console.log('\n💡 If you\'re testing from different locations, each location needs to be whitelisted.');
    } catch (e) {
      console.error('Error parsing IP response');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching IP:', err.message);
});

// Method 2: Alternative service
setTimeout(() => {
  https.get('https://api.myip.com', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('\n✅ Confirmed IP (from alternative service):', json.ip);
        console.log('   Country:', json.country);
      } catch (e) {}
    });
  }).on('error', () => {});
}, 1000);




