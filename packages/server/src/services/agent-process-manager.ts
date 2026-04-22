import { ChildProcess } from 'child_process';
import crossSpawn from 'cross-spawn';
import * as net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { BunGrpcChatBridge, resolveBunExecutable } from './bun-grpc-chat-bridge.js';

// 请求缓存接口
interface RequestCacheItem {
  response: any;
  timestamp: number;
}

// 缓存配置
const CACHE_TTL = 5 * 60 * 1000; // 5分钟
const MAX_CACHE_SIZE = 100; // 最大缓存项数量

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
const GRPC_POST_TCP_SETTLE_MS = 300; // 减少等待时间到300ms

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
  private processPool: AgentProcess[] = [];
  private poolSize = 3; // 预创建的进程数量
  private requestCache: Map<string, RequestCacheItem> = new Map(); // 请求缓存

  constructor() {
    for (let i = 0; i < PORT_POOL_SIZE; i++) {
      this.portPool.push(PORT_POOL_START + i);
    }
    // 延迟预创建进程池，确保环境变量已经加载
    setTimeout(() => {
      this.preCreateProcesses();
    }, 1000);
  }

  private async preCreateProcesses() {
    console.log(`Pre-creating ${this.poolSize} agent processes...`);
    // 检查环境变量，决定使用哪个提供商
    let providerConfig: ProviderConfig | null = null;
    
    if (process.env.QWEN_API_KEY) {
      providerConfig = {
        type: 'qwen',
        apiKey: process.env.QWEN_API_KEY,
        model: process.env.QWEN_MODEL || 'qwen-turbo'
      };
      console.log('Using Qwen provider for process pool');
    } else if (process.env.OPENAI_API_KEY) {
      providerConfig = {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o'
      };
      console.log('Using OpenAI provider for process pool');
    } else if (process.env.ANTHROPIC_API_KEY) {
      providerConfig = {
        type: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620'
      };
      console.log('Using Anthropic provider for process pool');
    } else if (process.env.GEMINI_API_KEY) {
      providerConfig = {
        type: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
      };
      console.log('Using Gemini provider for process pool');
    }
    
    if (!providerConfig) {
      console.log('No API keys found, skipping process pre-creation');
      return;
    }
    
    for (let i = 0; i < this.poolSize; i++) {
      try {
        console.log(`Creating process ${i+1}/${this.poolSize}...`);
        const agentProcess = await this.createProcess(`pool-${i}`, `pool-${i}`, providerConfig!);
        this.processPool.push(agentProcess);
        console.log(`✅ Pre-created process ${i+1}/${this.poolSize} for ${providerConfig!.type} provider, PID: ${agentProcess.pid}, Port: ${agentProcess.port}`);
      } catch (error) {
        console.error(`❌ Failed to pre-create process ${i+1}:`, error);
        // 等待一段时间再尝试下一个进程
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    
    console.log(`Process pool creation complete. Created ${this.processPool.length}/${this.poolSize} processes`);
  }

  private allocatePort(): number {
    if (this.portPool.length === 0) {
      throw new Error('Port pool exhausted');
    }
    const port = this.portPool.pop()!;
    this.usedPorts.add(port);
    console.log(`Allocated port: ${port}, remaining ports: ${this.portPool.length}`);
    return port;
  }

  private releasePort(port: number): void {
    this.usedPorts.delete(port);
    this.portPool.push(port);
    console.log(`Released port: ${port}, available ports: ${this.portPool.length}`);
  }

  private async waitForPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = 10000; // 恢复超时时间到10秒
      const interval = 100; // 恢复检查间隔到100ms

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
            setTimeout(check, interval);
          } else {
            reject(new Error(`Port ${port} did not become available within ${timeout}ms`));
          }
        });
        socket.on('error', () => {
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Port ${port} did not become available within ${timeout}ms`));
          } else {
            setTimeout(check, interval);
          }
        });

        socket.connect(port, GRPC_LOOPBACK);
      };

      setTimeout(check, interval);
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
        env.CLAUDE_CODE_USE_OPENAI = '1';
        env.OPENAI_API_KEY = provider.apiKey || process.env.QWEN_API_KEY || '';
        env.OPENAI_BASE_URL = provider.baseUrl || process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        if (provider.model) {
          env.OPENAI_MODEL = provider.model;
        } else if (process.env.OPENAI_MODEL) {
          env.OPENAI_MODEL = process.env.OPENAI_MODEL;
        } else {
          env.OPENAI_MODEL = 'qwen-turbo';
        }
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
        // 确保端口被释放
        this.releasePort(port);
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

      this.processes.set(`${userId}:${sessionId}`, agentProcess);
      return agentProcess;
    } catch (err) {
      console.error(`Error creating agent process:`, err);
      if (agentProc) {
        try {
          agentProc.kill();
        } catch (killErr) {
          console.error(`Error killing agent process:`, killErr);
        }
      }
      // 确保端口被释放
      this.releasePort(port);
      throw err;
    }
  }

  async getOrCreateProcess(userId: string, sessionId: string, provider: ProviderConfig): Promise<AgentProcess> {
    const key = `${userId}:${sessionId}`;

    // 优先使用现有进程
    if (this.processes.has(key)) {
      const existing = this.processes.get(key)!;
      existing.lastActivity = Date.now();
      console.log(`Using existing process: ${existing.pid}`);
      return existing;
    }

    // 其次使用进程池中的进程
    if (this.processPool.length > 0) {
      const process = this.processPool.pop()!;
      // 更新进程信息
      process.userId = userId;
      process.sessionId = sessionId;
      process.lastActivity = Date.now();
      this.processes.set(key, process);
      console.log(`Using process from pool: ${process.pid}`);
      return process;
    }

    // 最后创建新进程
    if (this.creating.has(key)) {
      console.log(`Process already being created, waiting...`);
      return this.creating.get(key)!;
    }

    console.log(`Creating new process for ${userId}:${sessionId}`);
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

  // 生成缓存键
  private generateCacheKey(userId: string, sessionId: string, message: string): string {
    return `${userId}:${sessionId}:${message}`;
  }

  // 检查缓存
  checkCache(userId: string, sessionId: string, message: string): any | null {
    const key = this.generateCacheKey(userId, sessionId, message);
    const cachedItem = this.requestCache.get(key);
    
    if (cachedItem) {
      const now = Date.now();
      if (now - cachedItem.timestamp < CACHE_TTL) {
        console.log(`Cache hit for message: ${message.substring(0, 20)}...`);
        return cachedItem.response;
      } else {
        // 缓存已过期，删除
        this.requestCache.delete(key);
        console.log(`Cache expired for message: ${message.substring(0, 20)}...`);
      }
    }
    console.log(`Cache miss for message: ${message.substring(0, 20)}...`);
    return null;
  }

  // 设置缓存
  setCache(userId: string, sessionId: string, message: string, response: any): void {
    const key = this.generateCacheKey(userId, sessionId, message);
    
    // 检查缓存大小
    if (this.requestCache.size >= MAX_CACHE_SIZE) {
      // 删除最旧的缓存项
      const oldestKey = this.requestCache.keys().next().value;
      this.requestCache.delete(oldestKey);
      console.log('Cache size limit reached, removed oldest item');
    }
    
    this.requestCache.set(key, {
      response,
      timestamp: Date.now()
    });
    console.log(`Cached response for message: ${message.substring(0, 20)}...`);
  }

  // 清理过期缓存
  cleanupCache(): void {
    const now = Date.now();
    let deleted = 0;
    
    for (const [key, item] of this.requestCache) {
      if (now - item.timestamp > CACHE_TTL) {
        this.requestCache.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired cache items`);
    }
  }

  cleanup(): void {
    const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2小时
    const now = Date.now();

    for (const [key, agentProcess] of this.processes) {
      if (now - agentProcess.lastActivity > TIMEOUT_MS) {
        // 将进程返回到进程池，而不是直接销毁
        if (agentProcess.proc && !agentProcess.proc.killed) {
          // 重置进程信息
          agentProcess.userId = 'pool';
          agentProcess.sessionId = `pool-${Date.now()}`;
          agentProcess.lastActivity = Date.now();
          this.processPool.push(agentProcess);
          console.log(`Returned process ${agentProcess.pid} to pool`);
        } else {
          // 如果进程已经被杀死，清理资源
          if (agentProcess.proc) {
            agentProcess.proc.kill();
          }
          if (agentProcess.port !== 50051) {
            this.releasePort(agentProcess.port);
          }
          console.log(`Cleaned up dead process: ${agentProcess.pid}`);
        }
        this.processes.delete(key);
      }
    }
    
    // 清理过期缓存
    this.cleanupCache();
  }
}