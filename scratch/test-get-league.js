const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}

// Cargar variables de entorno
const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ ERROR: No .env.local");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value.trim();
  }
});

const { getLeagueByInvite } = require('../dist/app/actions/leagues'); // We'll run it importing the ts file via ts-node, or dynamically

async function test() {
  console.log("⚡ [Verification] running ts-node / typescript test for getLeagueByInvite...");
}
test();
