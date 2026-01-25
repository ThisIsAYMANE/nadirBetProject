import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', 'env');
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
  // Try dotenv as fallback
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    envVars = process.env;
  } catch (e) {
    console.error('Could not load environment variables');
  }
}

const BASE_URL = envVars.SPORTS_API_URL || 'https://api.the-odds-api.com/v4';
const API_KEY = envVars.SPORTS_API_KEY || process.env.SPORTS_API_KEY;

if (!API_KEY) {
  console.error('❌ SPORTS_API_KEY not found in env file or environment variables');
  console.error('Please set SPORTS_API_KEY in server/env file');
  process.exit(1);
}

async function listSports() {
  const url = `${BASE_URL}/sports?apiKey=${API_KEY}`;
  
  console.log('📋 Fetching available sports from The Odds API...\n');
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    
    const sports = await res.json();
    
    if (!Array.isArray(sports) || sports.length === 0) {
      console.log('⚠️  No sports found');
      return;
    }

    console.log(`✅ Found ${sports.length} sports\n`);
    console.log('='.repeat(80));
    
    // Group by category
    const categories = {};
    sports.forEach(sport => {
      const category = sport.group || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(sport);
    });

    // Display by category
    Object.keys(categories).sort().forEach(category => {
      console.log(`\n📁 ${category}`);
      console.log('-'.repeat(80));
      categories[category].forEach(sport => {
        console.log(`  • ${sport.key.padEnd(30)} - ${sport.title}`);
        if (sport.description) {
          console.log(`    ${sport.description}`);
        }
      });
    });

    // Save to file
    const outputPath = join(__dirname, '..', 'data', 'available-sports.json');
    const fs = await import('fs');
    const { writeFileSync, mkdirSync } = fs;
    
    try {
      mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    writeFileSync(outputPath, JSON.stringify(sports, null, 2));
    console.log(`\n💾 Full list saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error fetching sports:', error.message);
    throw error;
  }
}

listSports()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
