import { spawn, ChildProcess } from 'child_process';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../openclaude-temp/src/proto/openclaude.proto');
const PORT_POOL_START = 50052;
const PORT_POOL_SIZE = 100;

export interface ProviderConfig {
  type: 'anthropic' | 'openai' | 'gemini' | 'github' | 'ollama';
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
  client: any;
}

export class AgentProcessManager {
  private processes: Map<string, AgentProcess> = new Map();
  private creating: Map<string, Promise<AgentProcess>> = new Map();
  private portPool: number[] = [];
  private usedPorts: Set<number> = new Set();
  private protoDescriptor: any = null;
  private initPromise: Promise<void>;

  constructor() {
    for (let i = 0; i < PORT_POOL_SIZE; i++) {
      this.portPool.push(PORT_POOL_START + i);
    }

    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    const packageDefinition = await protoLoader.load(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    this.protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  }

  private async ensureInit(): Promise<void> {
    await this.initPromise;
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

  private createGrpcClient(port: number): any {
    if (!this.protoDescriptor) {
      throw new Error('Proto descriptor not initialized');
    }
    const client = new this.protoDescriptor.openclaude.v1.Agent(
      `localhost:${port}`,
      grpc.credentials.createInsecure()
    );
    return client;
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

        socket.connect(port, 'localhost');
      };

      setTimeout(check, 100);
    });
  }

  async createProcess(userId: string, sessionId: string, provider: ProviderConfig): Promise<AgentProcess> {
    await this.ensureInit();

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
      }

      env.GRPC_PORT = String(port);

      agentProc = spawn('node', ['dist/cli.mjs', 'dev:grpc'], {
        cwd: path.join(__dirname, '../../../openclaude-temp'),
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      await this.waitForPort(port);
    } catch (err) {
      if (agentProc) {
        agentProc.kill();
      }
      this.releasePort(port);
      throw err;
    }

    const client = this.createGrpcClient(port);

    const agentProcess: AgentProcess = {
      pid: agentProc.pid!,
      port,
      userId,
      sessionId,
      lastActivity: Date.now(),
      proc: agentProc,
      client,
    };

    agentProc.on('exit', () => {
      this.releasePort(port);
    });

    this.processes.set(`${userId}:${sessionId}`, agentProcess);
    return agentProcess;
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

  async destroyProcess(userId: string, sessionId: string): Promise<void> {
    const key = `${userId}:${sessionId}`;
    const agentProcess = this.processes.get(key);

    if (agentProcess) {
      agentProcess.proc.kill();
      agentProcess.client.close?.();
      this.processes.delete(key);
      this.releasePort(agentProcess.port);
    }
  }

  cleanup(): void {
    const TIMEOUT_MS = 30 * 60 * 1000;
    const now = Date.now();

    for (const [key, agentProcess] of this.processes) {
      if (now - agentProcess.lastActivity > TIMEOUT_MS) {
        agentProcess.proc.kill();
        agentProcess.client.close?.();
        this.processes.delete(key);
        this.releasePort(agentProcess.port);
      }
    }
  }
}