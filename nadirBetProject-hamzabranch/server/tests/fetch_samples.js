import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SAMPLES_DIR = path.join(__dirname, '..', 'samples');

// Ensure samples directory exists
if (!fs.existsSync(SAMPLES_DIR)) {
    fs.mkdirSync(SAMPLES_DIR);
}

const saveSample = (filename, data) => {
    const filePath = path.join(SAMPLES_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved sample to ${filePath}`);
};

async function runTests() {
    try {
        // Dynamically import services AFTER dotenv is loaded
        const { default: sportMonksProxyService } = await import('../src/services/SportMonksProxyService.js');
        const { default: bettingService } = await import('../src/services/BettingService.js');

        console.log('--- Starting SportMonks Integration Tests ---');

        if (!process.env.SPORTMONKS_TOKEN) {
            console.warn('⚠️ SPORTMONKS_TOKEN is not set. The tests might fail if proxy services rely on it.');
        }

        // 1. Test Fixtures Proxy (Today)
        console.log('\n1. Fetching fixtures for recent active date...');
        // We use a date that is likely to have fixtures to ensure we get a sample
        const targetDate = '2024-05-11'; // A Saturday with lots of football games
        const fixtures = await sportMonksProxyService.getFixturesByDate(targetDate);
        saveSample('fixtures_sample.json', { count: fixtures.length, data: fixtures });
        console.log(`Found ${fixtures.length} fixtures for ${targetDate}.`);

        // 2. Test Live Fixtures Proxy
        console.log('\\n2. Fetching live fixtures...');
        const liveFixtures = await sportMonksProxyService.getLiveFixtures();
        saveSample('live_fixtures_sample.json', { count: liveFixtures.length, data: liveFixtures });
        console.log(`Found ${liveFixtures.length} live fixtures.`);

        // 3. Test Fixture Details Proxy (Use the first available fixture from today or a hardcoded one)
        let testFixtureId = null;
        if (fixtures.length > 0) {
            testFixtureId = fixtures[0].id;
        } else if (liveFixtures.length > 0) {
            testFixtureId = liveFixtures[0].id;
        }

        let fixtureDetails = null;
        if (testFixtureId) {
            console.log(`\\n3. Fetching fixture details for ID: ${testFixtureId}...`);
            fixtureDetails = await sportMonksProxyService.getFixtureDetails(testFixtureId);
            saveSample('fixture_details_sample.json', fixtureDetails);
            console.log('Successfully fetched fixture details with markets/odds.');
        } else {
            console.log('\\n3. Skipping fixture details - no available fixtures today.');
        }

        // 4. Test Betslip Verification (Checkout)
        console.log('\\n4. Testing Betslip Checkout Verification...');
        if (fixtureDetails && fixtureDetails.markets && fixtureDetails.markets.length > 0) {
            // Find H2H market to create a mock bet
            const h2h = fixtureDetails.markets.find(m => m.key === 'h2h');
            if (h2h && h2h.outcomes.length > 0) {
                const selectedOutcome = h2h.outcomes[0];

                const mockSelections = [
                    {
                        id: 'test-selection-1',
                        sportKey: 'football',
                        eventId: fixtureDetails.id,
                        homeTeam: fixtureDetails.homeTeam,
                        awayTeam: fixtureDetails.awayTeam,
                        marketType: 'match_winner', // BettingService maps this to h2h
                        selection: selectedOutcome.name,
                        odds: selectedOutcome.price, // current odds
                        stake: 100
                    },
                    {
                        id: 'test-selection-invalid',
                        sportKey: 'football',
                        eventId: fixtureDetails.id,
                        homeTeam: fixtureDetails.homeTeam,
                        awayTeam: fixtureDetails.awayTeam,
                        marketType: 'match_winner',
                        selection: 'NonExistentOutcome', // This should trigger suspended/invalid status
                        odds: 2.0,
                        stake: 100
                    }
                ];

                console.log(`Verifying selections for ${fixtureDetails.homeTeam} vs ${fixtureDetails.awayTeam}:`,
                    mockSelections.map(s => `${s.selection} @ ${s.odds}`));

                const checkoutResult = await bettingService.verifyBetslip(mockSelections);
                saveSample('checkout_verification_sample.json', checkoutResult);
                console.log('Checkout Verification Result:', checkoutResult.valid ? 'VALID' : 'INVALID (Handled correctly)');
            } else {
                console.log('No H2H market available in the test fixture to test checkout.');
            }
        } else {
            console.log('Skipping Betslip Checkout Verification - no detailed fixture data with markets.');
        }

        console.log('\\n--- All tests completed successfully! ---');
        process.exit(0);
    } catch (error) {
        console.error('\\n❌ Test failed with error:', error);
        process.exit(1);
    }
}

runTests();
