const path = require('path');
const dotenv = require('dotenv');
const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('--- Env Debugger ---');
console.log('Dirname:', __dirname);
console.log('Env Path:', path.join(__dirname, '..', '.env'));
if (result.error) {
    console.error('❌ Dotenv Error:', result.error.message);
} else {
    console.log('✅ Dotenv loaded successfully');
}

console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME ? 'DEFINED' : 'UNDEFINED');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'DEFINED' : 'UNDEFINED');
console.log('--------------------');
