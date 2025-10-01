const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'admin123'; // Default password for all users
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Generated hash for password "admin123":');
    console.log(hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification test:', isValid);
    
    return hash;
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHashes();