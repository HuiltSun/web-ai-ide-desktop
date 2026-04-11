import { EventEmitter } from 'node:events';
import * as readline from 'node:readline';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crossSpawn from 'cross-spawn';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** 开发为 src/services，构建后为 dist/services */
const SERVER_ROOT = path.join(__dirname, '../..');
const SIDECAR_SCRIPT = path.join(SERVER_ROOT, 'scripts', 'agent-grpc-sidecar.ts');

/**
 * 与拉 Agent 子进程一致：优先绝对路径（IDE 启动的 Node 常继承不到完整 PATH，裸 `bun` 会 ENOENT）。
 * 可设置 `BUN_PATH` 或 `AGENT_BUN_PATH` 指向 bun 可执行文件。
 */
export function resolveBunExecutable(): string {
  const bunName = process.platform === 'win32' ? 'bun.exe' : 'bun';
  const tryPaths = [
    process.env.BUN_PATH,
    process.env.AGENT_BUN_PATH,
    path.join(os.homedir(), '.bun', 'bin', bunName),
  ];
  for (const p of tryPaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  // 与 agent-process-manager 一致，交给 cross-spawn 在 PATH 中解析（含 Windows 的 bun.cmd）
  return 'bun';
}

function stripGrpcProxyEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const next = { ...env };
  delete next.grpc_proxy;
  delete next.GRPC_PROXY;
  delete next.http_proxy;
  delete next.HTTP_PROXY;
  delete next.https_proxy;
  delete next.HTTPS_PROXY;
  delete next.ALL_PROXY;
  delete next.all_proxy;
  return next;
}

/**
 * 通过 Bun 子进程承载 gRPC Chat 流，避免 Node grpc-js 与 Bun gRPC 服务之间的 HTTP/2 协议错误。
 * 对外表现类似 grpc.ClientDuplexStream：write / cancel / data / error / end
 */
export class BunGrpcChatBridge extends EventEmitter {
  private readonly child: ChildProcess;
  private readonly rl: readline.Interface;
  private readyDone = false;

  private constructor(child: ChildProcess) {
    super();
    this.child = child;
    this.rl = readline.createInterface({ input: child.stdout!, crlfDelay: Infinity });
  }

  static async connect(host: string, port: number, absoluteProtoPath: string): Promise<BunGrpcChatBridge> {
    const bunExe = resolveBunExecutable();
    const child = crossSpawn(bunExe, [SIDECAR_SCRIPT], {
      cwd: SERVER_ROOT,
      env: stripGrpcProxyEnv({
        ...process.env,
        AGENT_GRPC_HOST: host,
        AGENT_GRPC_PORT: String(port),
        OPENCLAUDE_PROTO_PATH: path.resolve(absoluteProtoPath),
      }),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (!child) {
      throw new Error(
        `Failed to spawn Bun gRPC sidecar (crossSpawn returned null). Tried: ${bunExe}. Set BUN_PATH to the full path of bun.`
      );
    }

    child.stderr?.on('data', (chunk: Buffer) => {
      console.error(`[bun-grpc-sidecar] ${chunk.toString()}`);
    });

    const bridge = new BunGrpcChatBridge(child);
    await new Promise<void>((resolve, reject) => {
      const onSpawnError = (err: Error) => {
        child.off('error', onSpawnError);
        reject(
          new Error(
            `${err.message} (bun: ${bunExe}). Install Bun or set BUN_PATH / AGENT_BUN_PATH to the bun executable.`
          )
        );
      };
      child.once('error', onSpawnError);
      bridge
        .waitReady()
        .then(() => {
          child.off('error', onSpawnError);
          resolve();
        })
        .catch((e) => {
          child.off('error', onSpawnError);
          reject(e);
        });
    });
    return bridge;
  }

  private waitReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Bun gRPC sidecar ready timeout (25s)'));
      }, 25_000);

      const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
        clearTimeout(timer);
        this.rl.close();
        reject(new Error(`Bun gRPC sidecar exited before ready (code=${code} signal=${signal})`));
      };
      this.child.on('exit', onExit);

      const onLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          const p = JSON.parse(trimmed) as { t?: string };
          if (p.t === 'r') {
            clearTimeout(timer);
            this.child.removeListener('exit', onExit);
            this.rl.off('line', onLine);
            this.rl.on('line', (l) => this.onDataLine(l));
            this.readyDone = true;
            resolve();
          }
        } catch {
          /* wait for valid ready line */
        }
      };
      this.rl.on('line', onLine);
    });
  }

  private onDataLine(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const p = JSON.parse(trimmed) as { t: string; m?: unknown; c?: number };
      if (p.t === 'd') {
        this.emit('data', p.m);
      } else if (p.t === 'e') {
        const msg = typeof p.m === 'string' ? p.m : 'gRPC error';
        const err = new Error(msg) as Error & { code?: number };
        if (typeof p.c === 'number') err.code = p.c;
        this.emit('error', err);
      } else if (p.t === 'n') {
        this.emit('end');
      }
    } catch {
      /* ignore */
    }
  }

  write(msg: Record<string, unknown>): void {
    if (!this.readyDone || !this.child.stdin) return;
    this.child.stdin.write(`${JSON.stringify({ op: 'w', msg })}\n`);
  }

  cancel(): void {
    try {
      this.child.stdin?.write(`${JSON.stringify({ op: 'x' })}\n`);
    } catch {
      /* ignore */
    }
    this.child.kill();
    this.rl.close();
  }
}
