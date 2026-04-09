import { PTYService } from './pty.service.js';
import type { ShellType, CreateSessionPayload } from '@web-ai-ide/shared';

export class ShellRegistry {
  private ptyService: PTYService;

  constructor() {
    this.ptyService = new PTYService();
  }

  getPTYService(): PTYService {
    return this.ptyService;
  }

  async createSession(sessionId: string, payload: CreateSessionPayload): Promise<void> {
    switch (payload.shellType) {
      case 'local':
        this.ptyService.createSession(
          sessionId,
          payload.shell,
          payload.cols || 80,
          payload.rows || 24
        );
        break;
      case 'ssh':
      case 'webcontainer':
        throw new Error(`Shell type ${payload.shellType} not implemented yet`);
      default:
        throw new Error(`Unknown shell type: ${payload.shellType}`);
    }
  }

  write(sessionId: string, type: ShellType, data: string): void {
    if (type === 'local') {
      this.ptyService.write(sessionId, data);
    }
  }

  resize(sessionId: string, type: ShellType, cols: number, rows: number): void {
    if (type === 'local') {
      this.ptyService.resize(sessionId, cols, rows);
    }
  }

  kill(sessionId: string, type: ShellType): void {
    if (type === 'local') {
      this.ptyService.kill(sessionId);
    }
  }

  list(type: ShellType): string[] {
    if (type === 'local') {
      return this.ptyService.list();
    }
    return [];
  }
}
