import https from 'https';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IP_HISTORY_FILE = join(__dirname, 'ip-history.json');

function getCurrentIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ip);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkIP() {
  console.log('🌐 Checking your current IP address...\n');
  
  const currentIP = await getCurrentIP();
  const timestamp = new Date().toISOString();
  
  console.log('📍 Current IP:', currentIP);
  console.log('🕐 Time:', timestamp);
  
  // Load history
  let history = [];
  if (existsSync(IP_HISTORY_FILE)) {
    try {
      const historyData = readFileSync(IP_HISTORY_FILE, 'utf-8');
      history = JSON.parse(historyData);
    } catch (e) {
      console.log('⚠️  Could not read IP history file');
    }
  }
  
  // Check if IP changed
  const lastEntry = history[history.length - 1];
  
  if (lastEntry) {
    if (lastEntry.ip === currentIP) {
      console.log('✅ IP has NOT changed since last check');
      console.log(`   Last checked: ${new Date(lastEntry.timestamp).toLocaleString()}`);
      
      const firstEntry = history[0];
      const daysSinceFirst = Math.floor(
        (new Date(timestamp) - new Date(firstEntry.timestamp)) / (1000 * 60 * 60 * 24)
      );
      
      if (history.length > 1) {
        console.log(`\n📊 Stability: IP has been stable for ${history.length} checks`);
        if (daysSinceFirst > 0) {
          console.log(`   Over ${daysSinceFirst} day(s)`);
        }
        console.log('   💡 This suggests you likely have a static IP!');
      }
    } else {
      console.log('⚠️  IP HAS CHANGED!');
      console.log(`   Previous IP: ${lastEntry.ip}`);
      console.log(`   New IP: ${currentIP}`);
      console.log(`   Changed at: ${timestamp}`);
      console.log('\n❌ You have a DYNAMIC IP - it can change over time');
      console.log('   You will need to request whitelisting again from Pragmatic Play');
    }
  } else {
    console.log('📝 First time checking - IP logged');
  }
  
  // Add to history
  history.push({
    ip: currentIP,
    timestamp: timestamp
  });
  
  // Keep only last 100 entries
  if (history.length > 100) {
    history = history.slice(-100);
  }
  
  // Save history
  writeFileSync(IP_HISTORY_FILE, JSON.stringify(history, null, 2));
  
  console.log('\n💾 IP logged to:', IP_HISTORY_FILE);
  console.log('\n💡 Run this script periodically to monitor IP changes:');
  console.log('   - After restarting your router');
  console.log('   - Once a day for a week');
  console.log('   - After power outages');
  
  // Show all unique IPs
  const uniqueIPs = [...new Set(history.map(h => h.ip))];
  if (uniqueIPs.length > 1) {
    console.log('\n📊 IP History:');
    uniqueIPs.forEach(ip => {
      const count = history.filter(h => h.ip === ip).length;
      const firstSeen = history.find(h => h.ip === ip).timestamp;
      console.log(`   ${ip} - seen ${count} time(s), first: ${new Date(firstSeen).toLocaleString()}`);
    });
  }
}

checkIP().catch(console.error);




