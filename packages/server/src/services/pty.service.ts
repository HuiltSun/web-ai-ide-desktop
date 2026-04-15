import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { join } from 'path';
import type { ShellType } from '@web-ai-ide/shared';

export interface PTYProcess {
  id: string;
  pty: pty.IPty;
  shellType: ShellType;
}

export interface SessionStrategy {
  readonly shellType: ShellType;
  createSession(
    sessionId: string,
    cols: number,
    rows: number,
    env: Record<string, string>
  ): { success: boolean; error?: string };
  write(sessionId: string, data: string): void;
  resize(sessionId: string, cols: number, rows: number): void;
  kill(sessionId: string): void;
  list(): string[];
  get(sessionId: string): PTYProcess | undefined;
  has(sessionId: string): boolean;
}

class LocalShellStrategy implements SessionStrategy {
  readonly shellType: ShellType = 'local';
  private processes: Map<string, PTYProcess> = new Map();

  createSession(
    sessionId: string,
    cols: number,
    rows: number,
    env: Record<string, string>,
    shell: string = process.platform === 'win32' ? 'powershell.exe' : 'bash'
  ): { success: boolean; error?: string } {
    if (this.processes.has(sessionId)) {
      return { success: false, error: `Session ${sessionId} already exists` };
    }

    try {
      const proc = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        env,
        cwd: env.HOME || env.USERPROFILE || '/',
      });

      proc.onData((data: string) => {
        this.emit('output', { sessionId, data });
      });

      proc.onExit(({ exitCode }) => {
        this.emit('exit', { sessionId, exitCode });
        this.processes.delete(sessionId);
      });

      this.processes.set(sessionId, { id: sessionId, pty: proc, shellType: 'local' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to start PTY' };
    }
  }

  private emit(event: 'output' | 'exit', data: { sessionId: string; data?: string; exitCode?: number }): void {
    if (event === 'output' && data.data !== undefined) {
      this.onOutput?.({ sessionId: data.sessionId, data: data.data });
    } else if (event === 'exit' && data.exitCode !== undefined) {
      this.onExit?.({ sessionId: data.sessionId, exitCode: data.exitCode });
    }
  }

  onOutput?: (data: { sessionId: string; data: string }) => void;
  onExit?: (data: { sessionId: string; exitCode: number }) => void;

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

class OpenClaudeStrategy implements SessionStrategy {
  readonly shellType: ShellType = 'openclaude';
  private processes: Map<string, PTYProcess> = new Map();

  createSession(
    sessionId: string,
    cols: number,
    rows: number,
    env: Record<string, string>
  ): { success: boolean; error?: string } {
    if (this.processes.has(sessionId)) {
      return { success: false, error: `Session ${sessionId} already exists` };
    }

    try {
      const isWindows = process.platform === 'win32';
      const bunPath = isWindows ? 'bun.cmd' : 'bun';
      const args = ['run', 'scripts/grpc-cli.ts'];
      const openClaudeDir = join(process.cwd(), '../openclaude-temp');

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

      const proc = pty.spawn(bunPath, args, {
        name: 'xterm-256color',
        cols,
        rows,
        env: mergedEnv,
        cwd: openClaudeDir,
      });

      proc.onData((data: string) => {
        this.emit('output', { sessionId, data });
      });

      proc.onExit(({ exitCode }) => {
        this.emit('exit', { sessionId, exitCode });
        this.processes.delete(sessionId);
      });

      this.processes.set(sessionId, { id: sessionId, pty: proc, shellType: 'openclaude' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to start PTY' };
    }
  }

  private emit(event: 'output' | 'exit', data: { sessionId: string; data?: string; exitCode?: number }): void {
    if (event === 'output' && data.data !== undefined) {
      this.onOutput?.({ sessionId: data.sessionId, data: data.data });
    } else if (event === 'exit' && data.exitCode !== undefined) {
      this.onExit?.({ sessionId: data.sessionId, exitCode: data.exitCode });
    }
  }

  onOutput?: (data: { sessionId: string; data: string }) => void;
  onExit?: (data: { sessionId: string; exitCode: number }) => void;

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

export class PTYService extends EventEmitter {
  private strategies: Map<ShellType, SessionStrategy> = new Map();
  private localStrategy: LocalShellStrategy;
  private openClaudeStrategy: OpenClaudeStrategy;

  constructor() {
    super();

    this.localStrategy = new LocalShellStrategy();
    this.openClaudeStrategy = new OpenClaudeStrategy();

    this.localStrategy.onOutput = (data) => this.emit('output', data);
    this.localStrategy.onExit = (data) => this.emit('exit', data);
    this.openClaudeStrategy.onOutput = (data) => this.emit('output', data);
    this.openClaudeStrategy.onExit = (data) => this.emit('exit', data);

    this.strategies.set('local', this.localStrategy);
    this.strategies.set('openclaude', this.openClaudeStrategy);
  }

  createLocalSession(
    sessionId: string,
    shell: string = process.platform === 'win32' ? 'powershell.exe' : 'bash',
    cols: number = 80,
    rows: number = 24,
    env: Record<string, string> = process.env as Record<string, string>
  ): { success: boolean; error?: string } {
    return this.localStrategy.createSession(sessionId, cols, rows, env, shell);
  }

  createOpenClaudeSession(
    sessionId: string,
    cols: number = 80,
    rows: number = 24,
    env: Record<string, string> = process.env as Record<string, string>
  ): { success: boolean; error?: string } {
    return this.openClaudeStrategy.createSession(sessionId, cols, rows, env);
  }

  createSession(
    sessionId: string,
    shellType: ShellType,
    cols: number = 80,
    rows: number = 24,
    env: Record<string, string> = process.env as Record<string, string>,
    shell?: string
  ): { success: boolean; error?: string } {
    const strategy = this.strategies.get(shellType);
    if (!strategy) {
      return { success: false, error: `Unsupported shell type: ${shellType}` };
    }

    if (shellType === 'local' && shell) {
      return this.localStrategy.createSession(sessionId, cols, rows, env, shell);
    }

    return strategy.createSession(sessionId, cols, rows, env);
  }

  write(sessionId: string, shellType: ShellType, data: string): void {
    const strategy = this.strategies.get(shellType);
    if (strategy) {
      strategy.write(sessionId, data);
    }
  }

  resize(sessionId: string, shellType: ShellType, cols: number, rows: number): void {
    const strategy = this.strategies.get(shellType);
    if (strategy) {
      strategy.resize(sessionId, cols, rows);
    }
  }

  kill(sessionId: string, shellType: ShellType): void {
    const strategy = this.strategies.get(shellType);
    if (strategy) {
      strategy.kill(sessionId);
    }
  }

  list(shellType: ShellType): string[] {
    const strategy = this.strategies.get(shellType);
    if (strategy) {
      return strategy.list();
    }
    return [];
  }

  get(sessionId: string, shellType: ShellType): PTYProcess | undefined {
    const strategy = this.strategies.get(shellType);
    if (strategy) {
      return strategy.get(sessionId);
    }
    return undefined;
  }

  has(sessionId: string, shellType: ShellType): boolean {
    const strategy = this.strategies.get(shellType);
    if (strategy) {
      return strategy.has(sessionId);
    }
    return false;
  }
}

export const ptyService = new PTYService();
