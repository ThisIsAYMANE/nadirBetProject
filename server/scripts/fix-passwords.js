import bcrypt from 'bcryptjs';

async function generateHashes() {
  const passwords = {
    'admin@bettingplatform.com': 'admin123',
    'broker1@premiumbets.com': 'broker123',
    'broker2@globalgaming.com': 'broker123',
    'broker3@elitesports.com': 'broker123',
    'john.smith@email.com': 'user123',
    'sarah.j@email.com': 'user123',
    'mike.w@email.com': 'user123',
    'emma.davis@email.com': 'user123'
  };

  console.log('Generating bcrypt hashes...\n');
  
  const updates = [];
  
  for (const [email, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    updates.push(`UPDATE users SET password_hash = '${hash}' WHERE email = '${email}';`);
    console.log(`Generated hash for ${email}: ${hash.substring(0, 30)}...`);
  }
  
  console.log('\n=== SQL UPDATE STATEMENTS ===\n');
  updates.forEach(update => console.log(update));
  
  return updates;
}

generateHashes().catch(console.error);
