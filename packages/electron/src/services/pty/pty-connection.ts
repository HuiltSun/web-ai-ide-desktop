/**
 * PTY 连接管理器
 * 提供 PTY 会话的高层管理接口
 */

import { WebSocketClient } from './websocket-client';
import {
  parseMessage,
  createCreateMessage,
  createInputMessage,
  createResizeMessage,
  createKillMessage,
  isOutputMessage,
  isErrorMessage,
  isExitMessage,
  MessageType,
} from './message-parser';

export type PTYConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface PTYConnectionOptions {
  url: string;
  onOutput?: (id: string, data: string) => void;
  onError?: (error: string) => void;
  onExit?: (id: string, code?: number, signal?: number) => void;
  onStateChange?: (state: PTYConnectionState) => void;
}

export class PTYConnection {
  private client: WebSocketClient;
  private state: PTYConnectionState = 'disconnected';
  private options: PTYConnectionOptions;

  constructor(options: PTYConnectionOptions) {
    this.options = options;
    this.client = new WebSocketClient(options.url);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on('open', () => {
      this.setState('connected');
    });

    this.client.on('message', (raw) => {
      this.handleMessage(raw);
    });

    this.client.on('error', () => {
      this.setState('error');
    });

    this.client.on('close', () => {
      this.setState('disconnected');
    });
  }

  private handleMessage(raw: string): void {
    const message = parseMessage(raw);

    if (isOutputMessage(message)) {
      this.options.onOutput?.(message.id, message.data);
    } else if (isExitMessage(message)) {
      this.options.onExit?.(message.id, message.code, message.signal);
    } else if (isErrorMessage(message)) {
      this.options.onError?.(message.message);
    }
  }

  private setState(state: PTYConnectionState): void {
    this.state = state;
    this.options.onStateChange?.(state);
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    
    return new Promise<void>((resolve, reject) => {
      const openHandler = () => {
        this.client.off('open', openHandler);
        this.client.off('error', errorHandler);
        this.setState('connected');
        resolve();
      };

      const errorHandler = (error: Event) => {
        this.client.off('open', openHandler);
        this.client.off('error', errorHandler);
        this.setState('error');
        reject(error);
      };

      this.client.on('open', openHandler);
      this.client.on('error', errorHandler);
      
      // 触发 WebSocket 连接
      this.client.connect().catch(reject);
    });
  }

  disconnect(): void {
    this.client.cleanup();
    this.setState('disconnected');
  }

  create(id: string, cols: number, rows: number, options?: { cwd?: string; command?: string; args?: string[]; env?: Record<string, string> }): void {
    if (this.state !== 'connected') {
      throw new Error('PTY 未连接');
    }
    const message = JSON.stringify(createCreateMessage(id, cols, rows, options));
    this.client.send(message);
  }

  write(id: string, data: string): void {
    if (this.state !== 'connected') {
      throw new Error('PTY 未连接');
    }
    const message = JSON.stringify(createInputMessage(id, data));
    this.client.send(message);
  }

  resize(cols: number, rows: number): void {
    if (this.state !== 'connected') {
      throw new Error('PTY 未连接');
    }
    const message = JSON.stringify(createResizeMessage(cols, rows));
    this.client.send(message);
  }

  kill(signal?: number): void {
    if (this.state !== 'connected') {
      throw new Error('PTY 未连接');
    }
    const message = JSON.stringify(createKillMessage(signal));
    this.client.send(message);
  }

  list(): void {
    if (this.state !== 'connected') {
      throw new Error('PTY 未连接');
    }
    const message = JSON.stringify({ type: MessageType.LIST });
    this.client.send(message);
  }

  getState(): PTYConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }
}
