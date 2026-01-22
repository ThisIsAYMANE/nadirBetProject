import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from 'env' file (not .env)
const envPath = join(__dirname, 'env');
const envFile = readFileSync(envPath, 'utf-8');

// Parse env file manually
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

// Now dynamically import the service after env vars are loaded
const { default: pragmaticApiService } = await import('./src/services/PragmaticApiService.js');

async function testPragmaticConnection() {
  console.log('🧪 Testing Pragmatic Play API Connection...\n');
  
  try {
    // Test 1: Check service initialization
    console.log('1️⃣ Checking service configuration...');
    console.log('   API URL:', pragmaticApiService.apiUrl);
    console.log('   Secure Login:', pragmaticApiService.secureLogin);
    console.log('   Provider ID:', pragmaticApiService.providerId);
    console.log('   ✓ Service initialized\n');
    
    // Test 2: Test hash generation
    console.log('2️⃣ Testing hash generation...');
    const testParams = { 
      secureLogin: pragmaticApiService.secureLogin 
    };
    const hash = pragmaticApiService.generateHash(testParams);
    console.log('   Generated hash:', hash);
    console.log('   ✓ Hash generation works\n');
    
    // Test 3: Call Pragmatic API to get games
    console.log('3️⃣ Calling Pragmatic Play API...');
    console.log('   Endpoint: POST /IntegrationService/v3/http/CasinoGameAPI/getCasinoGames/');
    console.log('   Full URL:', pragmaticApiService.apiUrl + '/IntegrationService/v3/http/CasinoGameAPI/getCasinoGames/');
    console.log('   This may take a few seconds...\n');
    
    // Show what we're sending
    console.log('   Request params:', JSON.stringify({ ...testParams, hash: hash }, null, 2));
    console.log('');
    
    const games = await pragmaticApiService.getAvailableGames();
    
    console.log('✅ SUCCESS! Pragmatic API responded!\n');
    console.log('📊 Response Summary:');
    console.log('   Games received:', Array.isArray(games) ? games.length : 'N/A');
    
    if (Array.isArray(games) && games.length > 0) {
      console.log('\n📋 Sample game (first 3):');
      games.slice(0, 3).forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.name || game.title || 'Unknown'} (ID: ${game.id || game.symbol || game.gameId || 'N/A'})`);
      });
    } else {
      console.log('\n⚠️  Warning: Games array is empty or not in expected format');
      console.log('   Response type:', typeof games);
      console.log('   Response:', JSON.stringify(games).substring(0, 200) + '...');
    }
    
    console.log('\n✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to connect to Pragmatic API\n');
    console.error('Error details:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify PRAGMATIC_API_URL in server/env file');
    console.log('   3. Verify PRAGMATIC_SECURE_LOGIN in server/env file');
    console.log('   4. Verify PRAGMATIC_SECRET_KEY in server/env file');
    console.log('   5. Check if Pragmatic API is accessible:', pragmaticApiService.apiUrl);
    
    process.exit(1);
  }
}

// Run the test
testPragmaticConnection();

