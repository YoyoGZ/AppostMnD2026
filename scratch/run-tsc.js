const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("⚙️ Running typescript type check...");

const outputPath = path.resolve(__dirname, 'tsc-result.txt');

try {
  const stdout = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
  fs.writeFileSync(outputPath, "✅ No errors found!\n" + stdout);
  console.log("✅ Success! No type errors found.");
} catch (error) {
  fs.writeFileSync(outputPath, `❌ TS Errors:\nStdout:\n${error.stdout}\n\nStderr:\n${error.stderr}`);
  console.error("❌ Type errors found. Written to tsc-result.txt");
}
