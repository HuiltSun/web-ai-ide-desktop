import { ChildProcess } from 'child_process';
import crossSpawn from 'cross-spawn';
import * as net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { BunGrpcChatBridge, resolveBunExecutable } from './bun-grpc-chat-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(
  path.join(__dirname, '../../../openclaude-temp/src/proto/openclaude.proto')
);
const PORT_POOL_START = 50052;
const PORT_POOL_SIZE = 100;

/** 与子进程 `GRPC_HOST` 一致，避免 Windows 上 `localhost` 在 IPv4/IPv6 间解析不一致导致 TCP 探测与 gRPC 实际监听不在同一监听栈，从而出现 HTTP/2 Protocol error。 */
const GRPC_LOOPBACK = '127.0.0.1';

/** 子进程在 `bindAsync` 回调后极短窗口内首包 HTTP/2 可能尚未完全就绪，TCP 通后略等再建 gRPC 客户端。 */
const GRPC_POST_TCP_SETTLE_MS = 800;

export interface ProviderConfig {
  type: 'anthropic' | 'openai' | 'gemini' | 'github' | 'ollama' | 'qwen';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface AgentProcess {
  pid: number;
  port: number;
  userId: string;
  sessionId: string;
  lastActivity: number;
  proc: ChildProcess;
}

export class AgentProcessManager {
  private processes: Map<string, AgentProcess> = new Map();
  private creating: Map<string, Promise<AgentProcess>> = new Map();
  private portPool: number[] = [];
  private usedPorts: Set<number> = new Set();

  constructor() {
    for (let i = 0; i < PORT_POOL_SIZE; i++) {
      this.portPool.push(PORT_POOL_START + i);
    }
  }

  private allocatePort(): number {
    if (this.portPool.length === 0) {
      throw new Error('Port pool exhausted');
    }
    const port = this.portPool.pop()!;
    this.usedPorts.add(port);
    return port;
  }

  private releasePort(port: number): void {
    this.usedPorts.delete(port);
    this.portPool.push(port);
  }

  private async waitForPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = 10000;

      const check = () => {
        const socket = new net.Socket();

        socket.setTimeout(100);
        socket.on('connect', () => {
          socket.destroy();
          resolve();
        });
        socket.on('timeout', () => {
          socket.destroy();
          if (Date.now() - startTime < timeout) {
            setTimeout(check, 100);
          } else {
            reject(new Error(`Port ${port} did not become available within ${timeout}ms`));
          }
        });
        socket.on('error', () => {
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Port ${port} did not become available within ${timeout}ms`));
          } else {
            setTimeout(check, 100);
          }
        });

        socket.connect(port, GRPC_LOOPBACK);
      };

      setTimeout(check, 100);
    });
  }

  async createProcess(userId: string, sessionId: string, provider: ProviderConfig): Promise<AgentProcess> {
    // 直接启动新进程，不使用共享服务器
    console.log('Starting new agent process...');

    // 如果连接失败，尝试启动新进程
    const port = this.allocatePort();

    let agentProc: ChildProcess | null = null;
    try {
      const env: Record<string, string> = {
        ...process.env as Record<string, string>,
      };

      if (provider.type === 'anthropic') {
        env.ANTHROPIC_API_KEY = provider.apiKey;
        if (provider.baseUrl) env.ANTHROPIC_BASE_URL = provider.baseUrl;
        if (provider.model) env.ANTHROPIC_MODEL = provider.model;
      } else if (provider.type === 'openai') {
        env.OPENAI_API_KEY = provider.apiKey;
        if (provider.baseUrl) env.OPENAI_BASE_URL = provider.baseUrl;
        if (provider.model) env.OPENAI_MODEL = provider.model;
      } else if (provider.type === 'gemini') {
        env.GEMINI_API_KEY = provider.apiKey;
        if (provider.baseUrl) env.GEMINI_BASE_URL = provider.baseUrl;
        if (provider.model) env.GEMINI_MODEL = provider.model;
      } else if (provider.type === 'qwen') {
        env.OPENAI_API_KEY = provider.apiKey;
        env.OPENAI_BASE_URL = provider.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        if (provider.model) env.OPENAI_MODEL = provider.model;
      }

      env.GRPC_PORT = String(port);
      env.GRPC_HOST = GRPC_LOOPBACK;

      const openClaudeDir = path.join(__dirname, '../../../openclaude-temp');
      console.log(`Starting agent process in: ${openClaudeDir}`);
      console.log(`GRPC_HOST: ${GRPC_LOOPBACK} GRPC_PORT: ${port}`);
      
      // openclaude-temp 大量依赖 `bun:bundle` 等 Bun 专有模块，不可用 Node+tsx 替代启动。
      const args = ['run', 'dev:grpc'];
      const bunExe = resolveBunExecutable();
      console.log(`Spawning: ${bunExe} ${args.join(' ')}`);

      agentProc = crossSpawn(bunExe, args, {
        cwd: openClaudeDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (!agentProc) {
        throw new Error('Failed to spawn agent process (crossSpawn returned null)');
      }

      // 监听输出以便调试
      agentProc.stdout?.on('data', (data) => {
        console.log(`Agent stdout: ${data}`);
      });
      
      agentProc.stderr?.on('data', (data) => {
        console.error(`Agent stderr: ${data}`);
      });
      
      agentProc.on('error', (err) => {
        console.error(`Agent process error:`, err);
      });
      
      agentProc.on('exit', (code, signal) => {
        console.log(`Agent process exited with code ${code}, signal ${signal}`);
      });

      await this.waitForPort(port);
      await new Promise((r) => setTimeout(r, GRPC_POST_TCP_SETTLE_MS));

      const agentProcess: AgentProcess = {
        pid: agentProc.pid!,
        port,
        userId,
        sessionId,
        lastActivity: Date.now(),
        proc: agentProc,
      };

      agentProc.on('exit', () => {
        this.releasePort(port);
      });

      this.processes.set(`${userId}:${sessionId}`, agentProcess);
      return agentProcess;
    } catch (err) {
      if (agentProc) {
        agentProc.kill();
      }
      this.releasePort(port);
      throw err;
    }
  }

  async getOrCreateProcess(userId: string, sessionId: string, provider: ProviderConfig): Promise<AgentProcess> {
    const key = `${userId}:${sessionId}`;

    if (this.processes.has(key)) {
      const existing = this.processes.get(key)!;
      existing.lastActivity = Date.now();
      return existing;
    }

    if (this.creating.has(key)) {
      return this.creating.get(key)!;
    }

    const promise = this.createProcess(userId, sessionId, provider)
      .finally(() => this.creating.delete(key));

    this.creating.set(key, promise);
    return promise;
  }

  /**
   * 在 Bun 侧车中打开 Chat 流（Node 直连 Bun gRPC 会触发 HTTP/2 Protocol error）。
   */
  async openChatBridge(userId: string, sessionId: string): Promise<BunGrpcChatBridge> {
    const key = `${userId}:${sessionId}`;
    const agent = this.processes.get(key);
    if (!agent) {
      throw new Error(`No agent process for ${key}`);
    }
    return BunGrpcChatBridge.connect(GRPC_LOOPBACK, agent.port, PROTO_PATH);
  }

  async destroyProcess(userId: string, sessionId: string): Promise<void> {
    const key = `${userId}:${sessionId}`;
    const agentProcess = this.processes.get(key);

    if (agentProcess) {
      if (agentProcess.proc) {
        agentProcess.proc.kill();
      }
      this.processes.delete(key);
      if (agentProcess.port !== 50051) {
        this.releasePort(agentProcess.port);
      }
    }
  }

  cleanup(): void {
    const TIMEOUT_MS = 30 * 60 * 1000;
    const now = Date.now();

    for (const [key, agentProcess] of this.processes) {
      if (now - agentProcess.lastActivity > TIMEOUT_MS) {
        if (agentProcess.proc) {
          agentProcess.proc.kill();
        }
        this.processes.delete(key);
        if (agentProcess.port !== 50051) {
          this.releasePort(agentProcess.port);
        }
      }
    }
  }
}