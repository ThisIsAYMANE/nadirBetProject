import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import https from 'https';
import crypto from 'crypto';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from 'env' file
const envPath = join(__dirname, 'env');
const envFile = readFileSync(envPath, 'utf-8');

envFile.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      process.env[key.trim()] = value;
    }
  }
});

const SECURE_LOGIN = process.env.PRAGMATIC_SECURE_LOGIN;
const SECRET_KEY = process.env.PRAGMATIC_SECRET_KEY;
const API_URL = process.env.PRAGMATIC_API_URL;

// Generate hash
function generateHash(params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return crypto
    .createHash('md5')
    .update(`${sortedParams}${SECRET_KEY}`)
    .digest('hex');
}

// Make API request
function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_URL);
    const postData = JSON.stringify(data);
    
    console.log(`\n📡 Making request to: ${url}`);
    console.log(`📤 Request body:`, JSON.stringify(data, null, 2));
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`📥 Response Status: ${res.statusCode}`);
        console.log(`📥 Response Headers:`, res.headers['content-type']);
        console.log(`📥 Response Body:`, responseData.substring(0, 500));
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseData,
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Testing Multiple Pragmatic API Endpoints\n');
  console.log('Configuration:');
  console.log('  API URL:', API_URL);
  console.log('  Secure Login:', SECURE_LOGIN);
  console.log('  Secret Key:', SECRET_KEY ? '***' + SECRET_KEY.slice(-4) : 'NOT SET');
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 1: System API - Get environments
  console.log('Test 1: Get Environments (SystemAPI)');
  try {
    const params1 = { secureLogin: SECURE_LOGIN };
    const hash1 = generateHash(params1);
    
    const result1 = await makeRequest(
      '/IntegrationService/v3/http/SystemAPI/environments',
      { ...params1, hash: hash1 }
    );
    
    if (result1.success) {
      console.log('✅ SUCCESS - Environments endpoint works!');
    } else {
      console.log('❌ FAILED - Status:', result1.status);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 2: Get Casino Games (different variations)
  console.log('Test 2a: Get Casino Games (with trailing slash)');
  try {
    const params2 = { secureLogin: SECURE_LOGIN };
    const hash2 = generateHash(params2);
    
    const result2 = await makeRequest(
      '/IntegrationService/v3/http/CasinoGameAPI/getCasinoGames/',
      { ...params2, hash: hash2 }
    );
    
    if (result2.success) {
      console.log('✅ SUCCESS - Got games!');
      try {
        const games = JSON.parse(result2.body);
        console.log('   Games count:', games.gameList?.length || games.games?.length || 'unknown');
      } catch (e) {
        console.log('   Response:', result2.body.substring(0, 200));
      }
    } else {
      console.log('❌ FAILED - Status:', result2.status);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n' + '-'.repeat(70) + '\n');

  // Test 2b: Without trailing slash
  console.log('Test 2b: Get Casino Games (without trailing slash)');
  try {
    const params2b = { secureLogin: SECURE_LOGIN };
    const hash2b = generateHash(params2b);
    
    const result2b = await makeRequest(
      '/IntegrationService/v3/http/CasinoGameAPI/getCasinoGames',
      { ...params2b, hash: hash2b }
    );
    
    if (result2b.success) {
      console.log('✅ SUCCESS - Got games!');
      try {
        const games = JSON.parse(result2b.body);
        console.log('   Games count:', games.gameList?.length || games.games?.length || 'unknown');
      } catch (e) {
        console.log('   Response:', result2b.body.substring(0, 200));
      }
    } else {
      console.log('❌ FAILED - Status:', result2b.status);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 3: Get available games (alternative endpoint)
  console.log('Test 3: Get Available Games (alternative)');
  try {
    const params3 = { 
      secureLogin: SECURE_LOGIN,
      symbol: ''  // Empty symbol to get all games
    };
    const hash3 = generateHash(params3);
    
    const result3 = await makeRequest(
      '/IntegrationService/v3/http/CasinoGameAPI/getAvailableGames',
      { ...params3, hash: hash3 }
    );
    
    if (result3.success) {
      console.log('✅ SUCCESS - Got games!');
    } else {
      console.log('❌ FAILED - Status:', result3.status);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 4: Game Categories
  console.log('Test 4: Get Game Categories');
  try {
    const params4 = { secureLogin: SECURE_LOGIN };
    const hash4 = generateHash(params4);
    
    const result4 = await makeRequest(
      '/IntegrationService/v3/http/CasinoGameAPI/gameCategories',
      { ...params4, hash: hash4 }
    );
    
    if (result4.success) {
      console.log('✅ SUCCESS - Got categories!');
    } else {
      console.log('❌ FAILED - Status:', result4.status);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');
  console.log('\n✨ Test Complete!\n');
}

testEndpoints().catch(console.error);




