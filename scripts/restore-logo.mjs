import fs from 'fs';
import path from 'path';

const srcPath = path.resolve('public/assets/MdApp26_ico_1.svg');
const destPath = path.resolve('public/logo.svg');

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Quitar el rectángulo negro de fondo (el compound path inicial de la línea 10-11)
const rectString = 'M0 5740 l0 -5740 5925 0 5925 0 0 5740 0 5740 -5925 0 -5925 0 0\r\n-5740z ';
const rectStringLF = 'M0 5740 l0 -5740 5925 0 5925 0 0 5740 0 5740 -5925 0 -5925 0 0\n-5740z ';

content = content.replace(rectString, '').replace(rectStringLF, '');

// Si no coincide por los saltos de línea, lo buscamos de forma más genérica
if (content.includes('M0 5740 l0 -5740')) {
  const startIndex = content.indexOf('M0 5740 l0 -5740');
  const endIndex = content.indexOf('-5740z');
  if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex + 6);
  }
}

// 2. Inyectar la cabecera premium (defs de gradientes, glow y círculo de fondo centrado y pulido)
const headerPremium = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"
 "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="1185.000000pt" height="1148.000000pt" viewBox="0 0 1185.000000 1148.000000"
 preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="50%" stop-color="#FACC15" />
      <stop offset="100%" stop-color="#CA8A04" />
    </linearGradient>
    <linearGradient id="darkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#151d2a" />
      <stop offset="100%" stop-color="#05070a" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Fondo redondo oscuro con borde dorado centrado y ajustado de forma perfecta -->
  <circle cx="592" cy="574" r="540" fill="url(#darkGradient)" stroke="url(#goldGradient)" stroke-width="22" />

  <!-- Grupo del logo vectorizado pintado de dorado con efecto glow -->
  <g transform="translate(0.000000,1148.000000) scale(0.100000,-0.100000)"
     fill="url(#goldGradient)" filter="url(#glow)" stroke="none">`;

// Buscamos dónde arranca el primer grupo en el SVG original
const groupTagIndex = content.indexOf('<g ');
if (groupTagIndex !== -1) {
  // Reemplazamos la cabecera del original por nuestra cabecera premium
  const body = content.substring(groupTagIndex);
  // Reemplazamos la etiqueta <g ...> inicial del body
  const firstCloseGroupIndex = body.indexOf('>');
  const restOfBody = body.substring(firstCloseGroupIndex + 1);
  
  content = headerPremium + '\n' + restOfBody;
}

fs.writeFileSync(destPath, content, 'utf8');
console.log("✅ SVG del Logo restaurado a versión estable premium exitosamente.");
