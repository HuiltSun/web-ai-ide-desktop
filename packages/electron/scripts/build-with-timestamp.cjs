const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const pkgDir = path.join(__dirname, '..');
const rootDir = path.join(pkgDir, '..', '..');
const isProduction = process.argv.includes('--production');
const isUnpacked = process.argv.includes('--dir');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

let outputDir;
let buildMode;

if (isProduction) {
  outputDir = path.join(rootDir, 'release', `release-${timestamp}`);
  buildMode = 'Production (NSIS)';
} else if (isUnpacked) {
  outputDir = path.join(rootDir, 'release', 'dev');
  buildMode = 'Development (unpacked)';
} else {
  outputDir = path.join(rootDir, 'release', `release-${timestamp}`);
  buildMode = 'Production (NSIS)';
}

console.log(`Building Web AI IDE...`);
console.log(`Output: ${outputDir}`);
console.log(`Mode: ${buildMode}`);

try {
  console.log('\n1. Vite build...');
  execSync('npx vite build', { stdio: 'inherit', cwd: pkgDir });

  console.log('\n2. TypeScript...');
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit', cwd: pkgDir });

  console.log('\n3. Electron Builder...');
  let builderCmd = `npx electron-builder --win --config.directories.output="${outputDir}"`;
  if (!isProduction && isUnpacked) {
    builderCmd += ' --dir';
  }
  execSync(builderCmd, { stdio: 'inherit', cwd: pkgDir });

  if (isProduction) {
    const debugFile = path.join(outputDir, 'builder-debug.yml');
    if (fs.existsSync(debugFile)) {
      fs.unlinkSync(debugFile);
      console.log('  Cleaned: builder-debug.yml');
    }
  }

  console.log(`\n✓ Build completed!`);
  console.log(`  Output: ${outputDir}`);
} catch (error) {
  console.error('\n✗ Build failed:', error.message);
  if (error.stderr) {
    console.error('stderr:', error.stderr.toString());
  }
  process.exit(1);
}