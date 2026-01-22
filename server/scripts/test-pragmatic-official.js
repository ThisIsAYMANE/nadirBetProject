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

// Generate MD5 hash according to Pragmatic Play spec
function generateHash(params, secretKey) {
  // 1. Sort all parameters by keys in alphabetical order
  const sortedKeys = Object.keys(params).sort();
  
  // 2. Append them in key1=value1&key2=value2 format
  const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  
  // 3. Append secret key
  const hashString = paramString + secretKey;
  
  console.log('   Hash calculation:');
  console.log('     Params string:', paramString);
  console.log('     + Secret key:', secretKey);
  console.log('     = Hash string:', hashString);
  
  // 4. Calculate MD5
  const hash = crypto.createHash('md5').update(hashString).digest('hex');
  console.log('     MD5 hash:', hash);
  
  return hash;
}

// Make GET request
function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    console.log(`\n📡 GET ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}`);
        console.log(`📥 Content-Type: ${res.headers['content-type']}`);
        console.log(`📥 Response: ${data.substring(0, 500)}`);
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode === 200
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Make POST request
function makePostRequest(url, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const urlObj = new URL(url);
    
    console.log(`\n📡 POST ${url}`);
    console.log(`📤 Body: ${postData}`);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}`);
        console.log(`📥 Content-Type: ${res.headers['content-type']}`);
        console.log(`📥 Response: ${data.substring(0, 500)}`);
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode === 200
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runOfficialTests() {
  console.log('🧪 PRAGMATIC PLAY API - OFFICIAL CONNECTION TEST');
  console.log('='.repeat(70));
  console.log('\n📋 Configuration:');
  console.log('   API URL:', API_URL);
  console.log('   Secure Login:', SECURE_LOGIN);
  console.log('   Secret Key:', SECRET_KEY ? '***' + SECRET_KEY.slice(-4) : 'NOT SET');
  console.log('\n' + '='.repeat(70));
  
  // ========================================================================
  // TEST 1: HealthCheck (GET - No Authentication Required)
  // According to Section 2.5, Page 24 of the documentation
  // ========================================================================
  console.log('\n\n📍 TEST 1: HealthCheck Endpoint (No Authentication)');
  console.log('─'.repeat(70));
  console.log('Purpose: Test basic connectivity to Pragmatic Play API');
  console.log('Expected: {"error": "0", "description": "OK"}');
  console.log('Note: This endpoint does NOT require authentication');
  
  try {
    const healthUrl = `${API_URL}/IntegrationService/v3/http/CasinoGameAPI/health/heartbeatCheck`;
    const result1 = await makeGetRequest(healthUrl);
    
    if (result1.success) {
      try {
        const json = JSON.parse(result1.body);
        if (json.error === "0" || json.error === 0) {
          console.log('\n✅ SUCCESS! HealthCheck passed!');
          console.log('   API is reachable and responding correctly.');
        } else {
          console.log('\n⚠️  WARNING: HealthCheck responded but with error:');
          console.log('   Error:', json.error);
          console.log('   Description:', json.description);
        }
      } catch (e) {
        console.log('\n⚠️  Got 200 response but body is not valid JSON');
      }
    } else if (result1.status === 403) {
      console.log('\n❌ FAILED: 403 Forbidden');
      console.log('   🔒 Your IP address is likely NOT whitelisted by Pragmatic Play');
      console.log('   📧 Action Required: Contact Pragmatic Play support to whitelist your IP');
    } else {
      console.log(`\n❌ FAILED: HTTP ${result1.status}`);
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log('   Network connectivity issue or wrong domain');
  }
  
  console.log('\n' + '='.repeat(70));
  
  // ========================================================================
  // TEST 2: Environments Endpoint (GET with Authentication)
  // According to Section 8.1, Page 113 of the documentation
  // ========================================================================
  console.log('\n\n📍 TEST 2: System API - Environments (With Authentication)');
  console.log('─'.repeat(70));
  console.log('Purpose: Test authentication and get environment configuration');
  console.log('Expected: List of game server domains and configurations');
  
  try {
    const params = {
      secureLogin: SECURE_LOGIN
    };
    
    console.log('\n🔐 Generating authentication hash...');
    const hash = generateHash(params, SECRET_KEY);
    
    // Build query string
    const queryString = `secureLogin=${encodeURIComponent(SECURE_LOGIN)}&hash=${hash}`;
    const envUrl = `${API_URL}/IntegrationService/v3/http/SystemAPI/environments?${queryString}`;
    
    const result2 = await makeGetRequest(envUrl);
    
    if (result2.success) {
      try {
        const json = JSON.parse(result2.body);
        console.log('\n✅ SUCCESS! Environments endpoint works!');
        console.log('\n📋 Environment Data:');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('\n⚠️  Got 200 response but body is not valid JSON');
      }
    } else if (result2.status === 403) {
      console.log('\n❌ FAILED: 403 Forbidden');
      console.log('   Possible causes:');
      console.log('   1. IP address not whitelisted (most likely)');
      console.log('   2. Invalid credentials');
      console.log('   3. Account not activated');
    } else {
      console.log(`\n❌ FAILED: HTTP ${result2.status}`);
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // ========================================================================
  // TEST 3: Get Casino Games (POST with Authentication)
  // Testing if game list endpoint is accessible
  // ========================================================================
  console.log('\n\n📍 TEST 3: Casino Game API - Get Games (POST with Authentication)');
  console.log('─'.repeat(70));
  console.log('Purpose: Test if we can retrieve the game catalog');
  
  try {
    const params = {
      secureLogin: SECURE_LOGIN
    };
    
    console.log('\n🔐 Generating authentication hash...');
    const hash = generateHash(params, SECRET_KEY);
    
    const requestBody = {
      secureLogin: SECURE_LOGIN,
      hash: hash
    };
    
    const gamesUrl = `${API_URL}/IntegrationService/v3/http/CasinoGameAPI/getCasinoGames`;
    
    const result3 = await makePostRequest(gamesUrl, requestBody);
    
    if (result3.success) {
      try {
        const json = JSON.parse(result3.body);
        console.log('\n✅ SUCCESS! Got games list!');
        
        const games = json.gameList || json.games || [];
        console.log(`\n📊 Total games: ${games.length}`);
        
        if (games.length > 0) {
          console.log('\n🎮 Sample games (first 3):');
          games.slice(0, 3).forEach((game, i) => {
            console.log(`   ${i + 1}. ${game.gameName || game.name} (ID: ${game.gameID || game.id})`);
          });
        }
      } catch (e) {
        console.log('\n⚠️  Got 200 response but body is not valid JSON');
      }
    } else if (result3.status === 403) {
      console.log('\n❌ FAILED: 403 Forbidden');
      console.log('   Your IP address needs to be whitelisted');
    } else {
      console.log(`\n❌ FAILED: HTTP ${result3.status}`);
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // ========================================================================
  // SUMMARY AND RECOMMENDATIONS
  // ========================================================================
  console.log('\n\n📊 TEST SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(70));
  console.log('\n🔍 Diagnosis:\n');
  console.log('If ALL tests show 403 Forbidden:');
  console.log('  → Your IP address is NOT whitelisted by Pragmatic Play');
  console.log('  → This is the most common issue for new integrations');
  console.log('  → Solution: Contact Pragmatic Play support\n');
  
  console.log('If HealthCheck works but authenticated endpoints fail:');
  console.log('  → API is reachable but credentials might be wrong');
  console.log('  → Or your account might not be activated yet');
  console.log('  → Solution: Verify credentials with Pragmatic Play\n');
  
  console.log('If some tests pass:');
  console.log('  → You have partial access');
  console.log('  → Some specific endpoints might need additional permissions\n');
  
  console.log('📧 What to tell Pragmatic Play Support:\n');
  console.log('  "I am setting up integration with account: sctfdstck_freebetzone"');
  console.log('  "Please whitelist my IP address for API access"');
  console.log('  "I need access to: CasinoGameAPI and SystemAPI endpoints"');
  console.log('  "Current issue: Receiving 403 Forbidden on all API requests"\n');
  
  console.log('💡 To get your public IP address, run:');
  console.log('   node check-my-ip.js\n');
  
  console.log('='.repeat(70));
  console.log('\n✨ Test Complete!\n');
}

// Run the tests
runOfficialTests().catch(console.error);









