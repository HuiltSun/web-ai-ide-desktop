const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface PTYClientOptions {
  onOutput?: (data: string) => void;
  onExit?: (exitCode: number) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
}

export interface PTYClientConnectOptions {
  cols?: number;
  rows?: number;
  shellType?: 'local' | 'openclaude';
  shell?: string;
}

export class PTYClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private options: PTYClientOptions;
  private shellType: 'local' | 'openclaude';

  constructor(options: PTYClientOptions = {}) {
    this.options = options;
    this.shellType = 'local';
  }

  connect(connectOptions: PTYClientConnectOptions = {}): void {
    this.shellType = connectOptions.shellType || 'local';
    const wsUrl = API_BASE.replace(/^http/, 'ws');
    const wsPath = this.shellType === 'openclaude' ? '/ws/pty' : '/ws/terminal';

    this.ws = new WebSocket(`${wsUrl}${wsPath}`);

    this.ws.onopen = () => {
      this.ws?.send(
        JSON.stringify({
          type: 'create',
          payload: {
            cols: connectOptions.cols || 80,
            rows: connectOptions.rows || 24,
            shellType: this.shellType,
            shell: connectOptions.shell,
          },
        })
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse PTY message:', error);
      }
    };

    this.ws.onerror = () => {
      this.options.onError?.('Connection failed');
    };

    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  private handleMessage(
    message: { type: string; sessionId?: string; payload?: { data?: string; exitCode?: number; error?: string; success?: boolean } }
  ): void {
    switch (message.type) {
      case 'created':
        this.sessionId = message.sessionId || null;
        if (this.sessionId) {
          this.options.onConnect?.();
        }
        break;

      case 'output':
        if (message.payload?.data) {
          this.options.onOutput?.(message.payload.data);
        }
        break;

      case 'exit':
        if (message.payload?.exitCode !== undefined) {
          this.options.onExit?.(message.payload.exitCode);
        }
        break;

      case 'error':
        this.options.onError?.(message.payload?.error || 'Unknown error');
        break;
    }
  }

  write(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(
        JSON.stringify({
          type: 'input',
          payload: { sessionId: this.sessionId, data },
        })
      );
    }
  }

  resize(cols: number, rows: number): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(
        JSON.stringify({
          type: 'resize',
          payload: { sessionId: this.sessionId, cols, rows },
        })
      );
    }
  }

  disconnect(): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(
        JSON.stringify({
          type: 'kill',
          payload: { sessionId: this.sessionId },
        })
      );
    }
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.sessionId !== null;
  }

  get currentSession(): string | null {
    return this.sessionId;
  }
}
