const fs = require('fs');
const path = require('path');

// Evitar error de certificados SSL en entornos locales
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Cargar variables de entorno desde .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ ERROR: No se encontró el archivo .env.local en la raíz.");
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

const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
  console.error("❌ ERROR: MP_ACCESS_TOKEN no encontrado en .env.local.");
  process.exit(1);
}

console.log("🔍 Conectando con Mercado Pago API para obtener transacciones...");

async function debugMp() {
  const mpUrl = "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10";
  try {
    const response = await fetch(mpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Error HTTP ${response.status}:`, errText);
      return;
    }

    const data = await response.json();
    console.log(`\n📊 Encontradas ${data.results?.length || 0} transacciones recientes en MP.`);
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((p, index) => {
        console.log(`\n--- [Transacción #${index + 1}] ---`);
        console.log(`ID: ${p.id}`);
        console.log(`Estado: ${p.status} (${p.status_detail})`);
        console.log(`Monto: ${p.transaction_amount} ${p.currency_id}`);
        console.log(`Descripción: "${p.description}"`);
        console.log(`Fecha: ${p.date_created}`);
        console.log(`Payer Email: ${p.payer?.email}`);
        console.log(`Metadata:`, JSON.stringify(p.metadata, null, 2));
      });
    } else {
      console.log("ℹ️ No hay transacciones en esta cuenta.");
    }
  } catch (err) {
    console.error("❌ Error de conexión:", err);
  }
}

debugMp();
