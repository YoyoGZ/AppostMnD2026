const ts = require('typescript');
const path = require('path');
const fs = require('fs');

console.log("🔍 Running programmatic TypeScript diagnostics...");

// Archivos a revisar
const files = [
  path.resolve(__dirname, '../src/app/actions/leagues.ts'),
  path.resolve(__dirname, '../src/app/join/[code]/JoinClient.tsx'),
  path.resolve(__dirname, '../src/app/join/[code]/page.tsx')
];

// Opciones de compilación básicas similares a tsconfig.json
const options = {
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  esModuleInterop: true,
  skipLibCheck: true,
  strict: false
};

const program = ts.createProgram(files, options);
const diagnostics = ts.getPreEmitDiagnostics(program);

const outputPath = path.resolve(__dirname, 'ts-diagnostics.txt');
let logContent = "";

if (diagnostics.length > 0) {
  logContent = `❌ Encontrados ${diagnostics.length} errores de tipo:\n\n`;
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const filename = path.basename(diagnostic.file.fileName);
      logContent += `${filename} (${line + 1},${character + 1}): ${message}\n`;
    } else {
      logContent += `${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}\n`;
    }
  });
  console.log("❌ Errores encontrados. Ver ts-diagnostics.txt");
} else {
  logContent = "✅ TypeScript compiló perfectamente. Cero errores de tipo en los archivos modificados.";
  console.log("✅ Cero errores de tipo.");
}

fs.writeFileSync(outputPath, logContent);
