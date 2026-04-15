import { ptyService } from './pty.service.js';
import type { ShellType, CreateSessionPayload } from '@web-ai-ide/shared';

export class ShellRegistry {
  createSession(sessionId: string, payload: CreateSessionPayload): { success: boolean; error?: string } {
    return ptyService.createSession(
      sessionId,
      payload.shellType,
      payload.cols || 80,
      payload.rows || 24,
      process.env as Record<string, string>,
      payload.shell
    );
  }

  write(sessionId: string, type: ShellType, data: string): void {
    ptyService.write(sessionId, type, data);
  }

  resize(sessionId: string, type: ShellType, cols: number, rows: number): void {
    ptyService.resize(sessionId, type, cols, rows);
  }

  kill(sessionId: string, type: ShellType): void {
    ptyService.kill(sessionId, type);
  }

  list(type: ShellType): string[] {
    return ptyService.list(type);
  }
}

export const shellRegistry = new ShellRegistry();
