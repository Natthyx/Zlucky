const crypto = require('crypto');

/**
 * Generates a secure random string for use as CRON_SECRET or other secrets.
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

const secret = generateSecret();

console.log('\n🔐 Generated Secure Secret:');
console.log('----------------------------');
console.log(secret);
console.log('----------------------------');
console.log('\nCopy and paste this into your .env.local as CRON_SECRET\n');
