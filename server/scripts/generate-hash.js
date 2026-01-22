import bcrypt from 'bcryptjs';

const password = 'admin123';
const saltRounds = 10;

console.log('Generating bcrypt hash for password:', password);
const hash = bcrypt.hashSync(password, saltRounds);
console.log('Hash:', hash);

console.log('');
console.log('SQL UPDATE statements:');
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@bettingplatform.com';`);
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'broker1@premiumbets.com';`);
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'broker2@globalgaming.com';`);
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'broker3@elitesports.com';`);
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'john.smith@email.com';`);
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'sarah.j@email.com';`);
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'mike.w@email.com';`);
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'emma.davis@email.com';`);
