/**
 * generate-icons.mjs
 * Genera los íconos PWA oficiales desde public/logo.svg de alta fidelidad.
 * - Mantiene los gradientes dorados, sombras y filtros.
 * - Genera icon-512x512.png y icon-192x192.png manteniendo el fondo oscuro premium.
 * - Genera favicon.png recortando la estrella dorada del centro con fondo transparente.
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INPUT = path.join(ROOT, 'public', 'logo.svg');
const OUTPUT_DIR = path.join(ROOT, 'public');

async function generateIcons() {
  console.log('📂 Leyendo SVG fuente de alta fidelidad...');
  
  if (!fs.existsSync(INPUT)) {
    throw new Error(`No se encontró el archivo de entrada: ${INPUT}`);
  }

  // ── PWA icons: renderizar el escudo con fondo oscuro directamente a PNG ──
  for (const { name, size } of [
    { name: 'icon-512x512.png', size: 512 },
    { name: 'icon-192x192.png', size: 192 },
  ]) {
    const outputPath = path.join(OUTPUT_DIR, name);
    
    // Renderizamos el SVG directamente al tamaño de salida.
    // Esto conserva el escudo con sus degradados oscuros y dorados al 100% de calidad.
    // Para asegurar que el icono sea cuadrado con fondo negro en la PWA (si se requiere),
    // creamos un lienzo negro y componemos el escudo centrado y sutilmente más pequeño (92%)
    // para dar un margen elegante de respiración.
    const medallionSize = Math.round(size * 0.92);
    const offset = Math.round((size - medallionSize) / 2);

    // Rasterizar el SVG a un buffer PNG temporal al tamaño del medallón.
    // Sharp maneja los gradientes perfectamente al redimensionar un SVG directo.
    const svgRasterized = await sharp(INPUT)
      .resize(medallionSize, medallionSize)
      .png()
      .toBuffer();

    await sharp({
      create: { 
        width: size, 
        height: size, 
        channels: 4,
        background: { r: 5, g: 7, b: 10, alpha: 1 } // Fondo azul/negro oscuro de la marca (#05070a)
      }
    })
    .composite([{
      input: svgRasterized,
      top: offset, 
      left: offset,
    }])
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(outputPath);

    console.log(`✅ Generado PWA Icon: public/${name} (${size}x${size}px)`);
  }

  // ── Favicon: recortar el balón dorado del centro ──
  console.log('\n🔵 Generando favicon de alta fidelidad (balón central dorado)...');
  const faviconSize = 32;
  
  // Renderizamos el SVG original a un buffer de alta resolución (512x512) para recortar con máxima nitidez.
  const highResBase = await sharp(INPUT)
    .resize(512, 512)
    .png()
    .toBuffer();

  // El balón central dorado ocupa el centro del viewBox de 512x512.
  // Hacemos un recorte del centro exacto de 220x220px para capturar el balón completo con su brillo
  const starBoxSize = 220;
  const starLeft = Math.round((512 - starBoxSize) / 2); // 146
  const starTop = Math.round((512 - starBoxSize) / 2); // 146 (exactamente centrado)

  const starBuffer = await sharp(highResBase)
    .extract({ left: starLeft, top: starTop, width: starBoxSize, height: starBoxSize })
    .toBuffer();

  const iconSize = Math.round(faviconSize * 0.90); // 29px de estrella
  const iconOffset = Math.round((faviconSize - iconSize) / 2); // 2px offset

  await sharp({
    create: { 
      width: faviconSize, 
      height: faviconSize, 
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Favicon premium con transparencia
    }
  })
  .composite([{
    input: await sharp(starBuffer)
      .resize(iconSize, iconSize, { fit: 'contain' })
      .toBuffer(),
    top: iconOffset,
    left: iconOffset,
  }])
  .png({ quality: 100 })
  .toFile(path.join(OUTPUT_DIR, 'favicon.png'));

  console.log(`✅ Generado Favicon: public/favicon.png (${faviconSize}x${faviconSize}px)`);
  console.log('\n🎯 Todos los iconos regenerados exitosamente con alta fidelidad.');
}

generateIcons().catch(err => {
  console.error('❌ Error al generar los iconos:', err.stack || err.message);
  process.exit(1);
});
