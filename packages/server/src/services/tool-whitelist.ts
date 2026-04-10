import path from 'path';
import fs from 'fs';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspaces');

export function isPathAllowed(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return resolved.startsWith(WORKSPACE_ROOT);
}

export function sanitizeWorkingDirectory(sessionId: string): string {
  const userDir = path.join(WORKSPACE_ROOT, sessionId);

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  return userDir;
}

export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}