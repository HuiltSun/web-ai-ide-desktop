import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { join } from 'path';

export interface PTYProcess {
  id: string;
  pty: pty.IPty;
  pid: number;
}

export class PTYManager extends EventEmitter {
  private processes: Map<string, PTYProcess> = new Map();

  private getOpenClaudePath(): string {
    return join(process.cwd(), '../openclaude-temp/dist/cli.mjs');
  }

  createOpenClaudeSession(
    sessionId: string,
    cols: number = 80,
    rows: number = 24,
    env: Record<string, string> = process.env as Record<string, string>
  ): { success: boolean; error?: string } {
    if (this.processes.has(sessionId)) {
      return { success: false, error: `Session ${sessionId} already exists` };
    }

    try {
      const openClaudePath = this.getOpenClaudePath();
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'bun.exe' : 'bun';
      const args = isWindows ? ['run', 'dev:grpc:cli'] : ['run', 'dev:grpc:cli'];
      const cwd = join(process.cwd(), '../openclaude-temp');

      const mergedEnv: Record<string, string> = {
        ...env,
        FORCE_COLOR: '1',
        TERM: 'xterm-256color',
      };

      if (env.OPENAI_API_KEY) mergedEnv.OPENAI_API_KEY = env.OPENAI_API_KEY;
      if (env.OPENAI_BASE_URL) mergedEnv.OPENAI_BASE_URL = env.OPENAI_BASE_URL;
      if (env.OPENAI_MODEL) mergedEnv.OPENAI_MODEL = env.OPENAI_MODEL;
      if (env.ANTHROPIC_API_KEY) mergedEnv.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
      if (env.ANTHROPIC_MODEL) mergedEnv.ANTHROPIC_MODEL = env.ANTHROPIC_MODEL;
      if (env.GRPC_HOST) mergedEnv.GRPC_HOST = env.GRPC_HOST;
      if (env.GRPC_PORT) mergedEnv.GRPC_PORT = env.GRPC_PORT;

      const proc = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols,
        rows,
        env: mergedEnv,
        cwd,
      });

      proc.onData((data: string) => {
        this.emit('output', { sessionId, data });
      });

      proc.onExit(({ exitCode }) => {
        this.emit('exit', { sessionId, exitCode });
        this.processes.delete(sessionId);
      });

      this.processes.set(sessionId, { id: sessionId, pty: proc, pid: proc.pid });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to start PTY' };
    }
  }

  write(sessionId: string, data: string): void {
    const process = this.processes.get(sessionId);
    if (process) {
      process.pty.write(data);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const process = this.processes.get(sessionId);
    if (process) {
      process.pty.resize(cols, rows);
    }
  }

  kill(sessionId: string): void {
    const process = this.processes.get(sessionId);
    if (process) {
      process.pty.kill();
      this.processes.delete(sessionId);
    }
  }

  list(): string[] {
    return Array.from(this.processes.keys());
  }

  get(sessionId: string): PTYProcess | undefined {
    return this.processes.get(sessionId);
  }

  has(sessionId: string): boolean {
    return this.processes.has(sessionId);
  }
}

export const ptyManager = new PTYManager();