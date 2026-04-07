const { execSync } = require('child_process');
const path = require('path');

const pkgDir = path.join(__dirname, '..');
const rootDir = path.join(pkgDir, '..', '..');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outputDir = path.join(rootDir, 'release', `release-${timestamp}`);

console.log(`Building Web AI IDE...`);
console.log(`Output: ${outputDir}`);

try {
  console.log('\n1. Vite build...');
  execSync('npx vite build', { stdio: 'inherit', cwd: pkgDir });

  console.log('\n2. TypeScript...');
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit', cwd: pkgDir });

  console.log('\n3. Electron Builder (NSIS)...');
  execSync(`npx electron-builder --win --config.directories.output="${outputDir}"`, {
    stdio: 'inherit',
    cwd: pkgDir
  });

  console.log(`\n✓ Build completed!`);
  console.log(`  Output: ${outputDir}`);

  const debugFile = path.join(outputDir, 'builder-debug.yml');
  if (fs.existsSync(debugFile)) {
    fs.unlinkSync(debugFile);
    console.log(`  Cleaned: builder-debug.yml`);
  }
} catch (error) {
  console.error('\n✗ Build failed');
  process.exit(1);
}
