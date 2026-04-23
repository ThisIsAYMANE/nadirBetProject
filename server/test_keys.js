const https = require('https');

const tokens = [
    'QR6SlN85OYDt0KgiQw7Lu0u9T653Vx5q5kWWgSxOChaL0TM0909iYptqPWAC',
    '404cfffc9b5859cf33f141b1fb9568d8'
];

tokens.forEach(token => {
    const url = `https://api.sportmonks.com/v3/football/fixtures/date/2024-05-11?api_token=${token}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Token: ${token.substring(0, 10)}... -> Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log(`Valid Token Found! Response starts with: ${data.substring(0, 50)}`);
            }
        });
    }).on('error', (err) => {
        console.log(`Error testing token ${token}:`, err.message);
    });
});
