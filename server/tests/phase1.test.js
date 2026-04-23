import db from '../src/database/db.js';

async function testPhase1() {
    console.log('Testing Database setup for SportMonks...');
    try {
        const res = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sm_%'");
        const tables = res.rows.map(r => r.name);
        console.log('SportMonks Tables found:', tables);

        if (tables.length < 6) {
            console.error('❌ Not all sm_ tables were created!');
            process.exit(1);
        }
        console.log('✅ Phase 1 Database Tables verification passed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed', err);
        process.exit(1);
    }
}

testPhase1();
