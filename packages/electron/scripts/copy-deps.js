const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkgDir = path.join(__dirname, '..');
const workspaceRoot = path.join(pkgDir, '..');
const targetNodeModules = path.join(pkgDir, 'node_modules');

const requiredDeps = ['7zip-bin', 'electron'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createSymlink(src, dest) {
  if (!fs.existsSync(src)) return false;

  ensureDir(path.dirname(dest));

  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  try {
    fs.symlinkSync(src, dest, 'junction');
    return true;
  } catch (err) {
    console.error(`Failed to create symlink: ${err.message}`);
    return false;
  }
}

const workspaceNodeModules = path.join(workspaceRoot, 'node_modules');

for (const dep of requiredDeps) {
  const srcPath = path.join(workspaceNodeModules, dep);
  const destPath = path.join(targetNodeModules, dep);

  if (fs.existsSync(srcPath)) {
    if (createSymlink(srcPath, destPath)) {
      console.log(`Linked ${dep} -> electron node_modules`);
    }
  }
}
