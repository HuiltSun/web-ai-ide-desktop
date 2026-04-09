import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export interface PTYProcess {
  id: string;
  pty: pty.IPty;
  shellType: 'local';
}

export class PTYService extends EventEmitter {
  private processes: Map<string, PTYProcess> = new Map();

  createSession(
    sessionId: string,
    shell: string = process.platform === 'win32' ? 'powershell.exe' : 'bash',
    cols: number = 80,
    rows: number = 24,
    env: Record<string, string> = process.env as Record<string, string>
  ): void {
    if (this.processes.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

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
}
