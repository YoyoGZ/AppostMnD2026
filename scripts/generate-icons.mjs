/**
 * generate-icons.mjs
 * Genera los íconos PWA oficiales y el favicon desde public/assets/logo_oficial.png.
 * - Mantiene los gradientes, sombras y transparencias del logo definitivo de la App.
 * - Genera icon-512x512.png y icon-192x192.png centrando el logo en el fondo premium oscuro de la marca (#050505).
 * - Genera favicon.png con fondo transparente (32x32px).
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INPUT = path.join(ROOT, 'public', 'assets', 'logo_oficial.png');
const OUTPUT_DIR = path.join(ROOT, 'public');

async function generateIcons() {
  console.log('📂 Leyendo logo oficial PNG de alta fidelidad...');
  
  if (!fs.existsSync(INPUT)) {
    throw new Error(`No se encontró el archivo de entrada: ${INPUT}`);
  }

  // ── PWA icons: renderizar el logo centrado con fondo oscuro de la marca (#050505) ──
  for (const { name, size } of [
    { name: 'icon-512x512.png', size: 512 },
    { name: 'icon-192x192.png', size: 192 },
  ]) {
    const outputPath = path.join(OUTPUT_DIR, name);
    
    // Dejamos un margen del 90% para que el logo respire elegantemente dentro de la caja de la PWA
    const logoSize = Math.round(size * 0.90);
    const offset = Math.round((size - logoSize) / 2);

    // Redimensionar el logo a la caja contenedora
    const logoResized = await sharp(INPUT)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Crear el lienzo con fondo oscuro (#050505) de la marca y superponer el logo
    await sharp({
      create: { 
        width: size, 
        height: size, 
        channels: 4,
        background: { r: 5, g: 5, b: 5, alpha: 1 } // #050505
      }
    })
    .composite([{
      input: logoResized,
      top: offset, 
      left: offset,
    }])
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(outputPath);

    console.log(`✅ Generado PWA Icon: public/${name} (${size}x${size}px)`);
  }

  // ── Favicon: redimensionar el logo oficial con fondo transparente ──
  console.log('\n🔵 Generando favicon transparente de alta fidelidad...');
  const faviconSize = 32;
  
  await sharp(INPUT)
    .resize(faviconSize, faviconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(OUTPUT_DIR, 'favicon.png'));

  console.log(`✅ Generado Favicon: public/favicon.png (${faviconSize}x${faviconSize}px)`);
  console.log('\n🎯 Todos los iconos de MundiAPP26 regenerados exitosamente a partir del logo oficial.');
}

generateIcons().catch(err => {
  console.error('❌ Error al generar los iconos:', err.stack || err.message);
  process.exit(1);
});
