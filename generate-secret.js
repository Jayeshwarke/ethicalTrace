// Generate a secure session secret
import crypto from 'crypto';

// Generate 64-character random string
const secret = crypto.randomBytes(32).toString('hex');
console.log('Your SESSION_SECRET:');
console.log(secret);
console.log('\nCopy this string and use it as your SESSION_SECRET in Vercel environment variables.');
