console.log('🧪 Testing Phase 3: Role-Based Access Control\n');

const API_URL = 'http://localhost:3001/api';

// Test accounts
const accounts = {
  owner: { email: 'owner@example.com', password: 'password123' },
  superadmin: { email: 'superadmin@example.com', password: 'password123' },
  admin: { email: 'admin@example.com', password: 'password123' },
  broker: { email: 'broker@example.com', password: 'password123' },
  user: { email: 'user@example.com', password: 'password123' }
};

let tokens = {};

async function login(role) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accounts[role])
    });
    
    const data = await response.json();
    if (data.token) {
      tokens[role] = data.token;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Login failed for ${role}:`, error.message);
    return false;
  }
}

async function testCreateUser(creatorRole, targetRole) {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens[creatorRole]}`
      },
      body: JSON.stringify({
        name: `Test ${targetRole}`,
        email: `test-${targetRole}-${Date.now()}@example.com`,
        password: 'password123',
        role: targetRole
      })
    });
    
    return response.status;
  } catch (error) {
    return 500;
  }
}

async function runTests() {
  console.log('📋 Step 1: Login as all roles...\n');
  
  for (const role of Object.keys(accounts)) {
    const success = await login(role);
    console.log(`  ${success ? '✅' : '❌'} ${role.padEnd(12)} - ${success ? 'Logged in' : 'Failed'}`);
  }
  
  console.log('\n📋 Step 2: Test role creation permissions...\n');
  
  const tests = [
    // Owner tests
    { creator: 'owner', target: 'super_admin', shouldPass: true },
    { creator: 'owner', target: 'admin', shouldPass: true },
    { creator: 'owner', target: 'broker', shouldPass: true },
    { creator: 'owner', target: 'regular_user', shouldPass: true },
    
    // Super admin tests
    { creator: 'superadmin', target: 'owner', shouldPass: false },
    { creator: 'superadmin', target: 'super_admin', shouldPass: false },
    { creator: 'superadmin', target: 'admin', shouldPass: true },
    { creator: 'superadmin', target: 'broker', shouldPass: true },
    { creator: 'superadmin', target: 'regular_user', shouldPass: true },
    
    // Admin tests
    { creator: 'admin', target: 'super_admin', shouldPass: false },
    { creator: 'admin', target: 'admin', shouldPass: false },
    { creator: 'admin', target: 'broker', shouldPass: true },
    { creator: 'admin', target: 'regular_user', shouldPass: true },
    
    // Broker tests
    { creator: 'broker', target: 'admin', shouldPass: false },
    { creator: 'broker', target: 'broker', shouldPass: false },
    { creator: 'broker', target: 'regular_user', shouldPass: true },
    
    // Regular user tests
    { creator: 'user', target: 'regular_user', shouldPass: false }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const status = await testCreateUser(test.creator, test.target);
    const actualPass = status === 201;
    const testPassed = actualPass === test.shouldPass;
    
    if (testPassed) {
      passed++;
      console.log(`  ✅ ${test.creator.padEnd(12)} → ${test.target.padEnd(15)} ${test.shouldPass ? 'ALLOWED' : 'BLOCKED'} (Expected)`);
    } else {
      failed++;
      console.log(`  ❌ ${test.creator.padEnd(12)} → ${test.target.padEnd(15)} ${actualPass ? 'ALLOWED' : 'BLOCKED'} (Expected: ${test.shouldPass ? 'ALLOWED' : 'BLOCKED'})`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✅ All tests passed! Phase 3 role system working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
