/**
 * Quick script to verify environment variables are loaded correctly
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', 'env');

console.log('🔍 Checking environment variables...\n');
console.log('Env file path:', envPath);

try {
  const envFile = readFileSync(envPath, 'utf-8');
  console.log('✅ Env file found\n');
  
  const envVars = {};
  envFile.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        envVars[key.trim()] = value;
      }
    }
  });

  console.log('📋 Casino Environment Variables:');
  console.log('CASINO_MERCHANT_ID:', envVars.CASINO_MERCHANT_ID ? '✅ Set' : '❌ Missing');
  console.log('CASINO_MERCHANT_KEY:', envVars.CASINO_MERCHANT_KEY ? '✅ Set' : '❌ Missing');
  console.log('CASINO_API_BASE_URL:', envVars.CASINO_API_BASE_URL || '❌ Missing');
  console.log('CASINO_DEFAULT_CURRENCY:', envVars.CASINO_DEFAULT_CURRENCY || '❌ Missing');
  console.log('CASINO_CALLBACK_URL:', envVars.CASINO_CALLBACK_URL || '❌ Missing');
  console.log('CASINO_RETURN_URL:', envVars.CASINO_RETURN_URL || '❌ Missing');
  
  if (envVars.CASINO_MERCHANT_ID && envVars.CASINO_MERCHANT_KEY) {
    console.log('\n✅ All required casino variables are set!');
    console.log('\n💡 If the server is running, restart it to load these variables.');
  } else {
    console.log('\n❌ Missing required casino variables!');
  }
} catch (error) {
  console.error('❌ Error reading env file:', error.message);
  console.log('\n💡 Make sure the file exists at:', envPath);
}
