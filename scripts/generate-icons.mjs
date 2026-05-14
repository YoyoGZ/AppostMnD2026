/**
 * generate-icons.mjs
 * Genera los íconos PWA oficiales desde mdapp26_ico.jpeg
 * - Elimina el espacio blanco alrededor del medallón
 * - Aplica fondo negro (#000000)
 * - Exporta en 512x512, 192x192 y 32x32 (favicon — solo balón)
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INPUT = path.join(ROOT, 'public', 'assets', 'mdapp26_ico.jpeg');
const OUTPUT_DIR = path.join(ROOT, 'public');

async function generateIcons() {
  console.log('📂 Leyendo imagen fuente...');
  
  const sourceBuffer = fs.readFileSync(INPUT);
  const metadata = await sharp(sourceBuffer).metadata();
  console.log(`   Dimensiones originales: ${metadata.width}x${metadata.height}`);

  // Recortar espacio blanco
  const trimmedBuffer = await sharp(sourceBuffer)
    .trim({ background: '#ffffff', threshold: 30 })
    .toBuffer();

  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log(`   Dimensiones tras recorte: ${trimmedMeta.width}x${trimmedMeta.height}`);

  // ── PWA icons: medallón completo ──
  for (const { name, size } of [
    { name: 'icon-512x512.png', size: 512 },
    { name: 'icon-192x192.png', size: 192 },
  ]) {
    const outputPath = path.join(OUTPUT_DIR, name);
    const medallionSize = Math.round(size * 0.92);
    const offset = Math.round((size - medallionSize) / 2);

    await sharp({
      create: { width: size, height: size, channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 } }
    })
    .composite([{
      input: await sharp(trimmedBuffer)
        .resize(medallionSize, medallionSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer(),
      top: offset, left: offset,
    }])
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(outputPath);
    console.log(`✅ Generado: public/${name} (${size}x${size}px)`);
  }

  // ── Favicon: recortar SOLO el balón dorado central ──
  console.log('\n🔵 Generando favicon optimizado (solo balón)...');
  const faviconSize = 32;
  const trimW = trimmedMeta.width;
  const trimH = trimmedMeta.height;

  // El balón ocupa ~50% del ancho y está centrado, levemente sobre el centro
  const ballSize = Math.round(trimW * 0.50);
  const ballLeft = Math.round((trimW - ballSize) / 2);
  const ballTop  = Math.round((trimH - ballSize) / 2) - Math.round(trimH * 0.03);

  const ballBuffer = await sharp(trimmedBuffer)
    .extract({ left: ballLeft, top: ballTop, width: ballSize, height: ballSize })
    .toBuffer();

  const iconSize   = Math.round(faviconSize * 0.86);
  const iconOffset = Math.round((faviconSize - iconSize) / 2);

  await sharp({
    create: { width: faviconSize, height: faviconSize, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 } }
  })
  .composite([{
    input: await sharp(ballBuffer)
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer(),
    top: iconOffset, left: iconOffset,
  }])
  .png({ quality: 100 })
  .toFile(path.join(OUTPUT_DIR, 'favicon.png'));

  console.log(`✅ Generado: public/favicon.png (${faviconSize}x${faviconSize}px) — solo balón dorado`);
  console.log('\n🎯 Todos los íconos generados exitosamente.');
}

generateIcons().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
