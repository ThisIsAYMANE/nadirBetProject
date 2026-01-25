/**
 * Test script for Slotegrator casino callbacks
 * This script helps test the callback endpoint with proper X-Sign signatures
 * 
 * Usage: node scripts/test-casino-callback.js <action> <player_id> <amount>
 * Example: node scripts/test-casino-callback.js bet USER_ID 100
 */

import crypto from 'crypto';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../env');
let envVars = {};

try {
  const envFile = readFileSync(envPath, 'utf-8');
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
} catch (error) {
  console.error('Error loading env file:', error.message);
  process.exit(1);
}

const MERCHANT_ID = envVars.CASINO_MERCHANT_ID;
const MERCHANT_KEY = envVars.CASINO_MERCHANT_KEY;
const CALLBACK_URL = envVars.CASINO_CALLBACK_URL || 'http://localhost:3001/api/casino/callback';

if (!MERCHANT_ID || !MERCHANT_KEY) {
  console.error('❌ CASINO_MERCHANT_ID and CASINO_MERCHANT_KEY must be set in env file');
  process.exit(1);
}

/**
 * Calculate X-Sign signature
 */
function calculateXSign(params, headers, merchantKey) {
  const merged = { ...params, ...headers };
  const sorted = Object.keys(merged).sort();
  const queryString = sorted
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(merged[key]))}`)
    .join('&');
  return crypto.createHmac('sha1', merchantKey).update(queryString).digest('hex');
}

/**
 * Generate test callback
 */
function generateCallback(action, playerId, amount, options = {}) {
  const {
    transactionId = `TEST_${action.toUpperCase()}_${Date.now()}`,
    gameUuid = 'TEST_GAME_UUID',
    sessionId = 'TEST_SESSION_ID',
    currency = 'EUR',
    roundId = null,
    betTransactionId = null,
    rollbackTransactions = null,
  } = options;

  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');

  const body = {
    action,
    player_id: playerId,
    transaction_id: transactionId,
    session_id: sessionId,
    game_uuid: gameUuid,
    amount: String(amount),
    currency,
  };

  if (roundId) body.round_id = roundId;
  if (betTransactionId) body.bet_transaction_id = betTransactionId;
  if (rollbackTransactions) body.rollback_transactions = JSON.stringify(rollbackTransactions);

  const headers = {
    'X-Merchant-Id': MERCHANT_ID,
    'X-Timestamp': String(timestamp),
    'X-Nonce': nonce,
  };

  const xSign = calculateXSign(body, headers, MERCHANT_KEY);
  headers['X-Sign'] = xSign;

  return { body, headers };
}

/**
 * Send test callback
 */
async function sendCallback(action, playerId, amount, options = {}) {
  const { body, headers } = generateCallback(action, playerId, amount, options);

  console.log('\n📤 Sending callback:');
  console.log('Action:', action);
  console.log('Player ID:', playerId);
  console.log('Amount:', amount);
  console.log('Transaction ID:', body.transaction_id);
  console.log('URL:', CALLBACK_URL);

  try {
    const formData = new URLSearchParams();
    Object.keys(body).forEach(key => {
      formData.append(key, body[key]);
    });

    const response = await fetch(CALLBACK_URL, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log('\n📥 Response:');
    console.log('Status:', response.status, response.statusText);
    console.log('Body:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Callback processed successfully');
    } else {
      console.log('\n❌ Callback failed');
    }

    return { success: response.ok, status: response.status, data: responseData };
  } catch (error) {
    console.error('\n❌ Error sending callback:', error.message);
    throw error;
  }
}

// Main execution
const [action, playerId, amountStr] = process.argv.slice(2);

if (!action || !playerId || !amountStr) {
  console.log('Usage: node scripts/test-casino-callback.js <action> <player_id> <amount> [options]');
  console.log('\nActions: balance, bet, win, refund, rollback');
  console.log('\nExamples:');
  console.log('  node scripts/test-casino-callback.js balance USER_ID 0');
  console.log('  node scripts/test-casino-callback.js bet USER_ID 100');
  console.log('  node scripts/test-casino-callback.js win USER_ID 200');
  console.log('  node scripts/test-casino-callback.js refund USER_ID 100 --bet-transaction-id TEST_BET_001');
  process.exit(1);
}

const amount = parseFloat(amountStr);

if (isNaN(amount)) {
  console.error('❌ Amount must be a number');
  process.exit(1);
}

// Parse additional options
const options = {};
const args = process.argv.slice(5);
for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace('--', '');
  const value = args[i + 1];
  if (key && value) {
    if (key === 'rollback-transactions') {
      options.rollbackTransactions = JSON.parse(value);
    } else {
      options[key.replace(/-/g, '_')] = value;
    }
  }
}

sendCallback(action, playerId, amount, options)
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
