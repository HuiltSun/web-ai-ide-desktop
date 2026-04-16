const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_BASE.replace(/^http/, 'ws');
export class PTYClient {
    ws = null;
    sessionId = null;
    options;
    reconnectAttempts = 0;
    maxReconnectAttempts = 3;
    constructor(options = {}) {
        this.options = options;
    }
    connect(connectOptions = {}) {
        return new Promise((resolve, reject) => {
            const wsUrl = `${WS_URL}/ws/pty`;
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => {
                this.reconnectAttempts = 0;
                this.options.onConnect?.();
                this.ws?.send(JSON.stringify({
                    type: 'create',
                    payload: {
                        cols: connectOptions.cols || 80,
                        rows: connectOptions.rows || 24,
                    },
                }));
            };
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message, resolve, reject);
                }
                catch (error) {
                    console.error('Failed to parse PTY message:', error);
                }
            };
            this.ws.onerror = () => {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.connect(connectOptions), 1000 * this.reconnectAttempts);
                }
                else {
                    this.options.onError?.('Connection failed');
                    reject(new Error('Failed to connect to PTY server'));
                }
            };
            this.ws.onclose = () => {
                this.ws = null;
            };
        });
    }
    handleMessage(message, resolve, reject) {
        switch (message.type) {
            case 'created':
                this.sessionId = message.sessionId;
                resolve(message.sessionId);
                break;
            case 'output':
                this.options.onOutput?.(message.payload.data);
                break;
            case 'exit':
                this.options.onExit?.(message.payload.exitCode);
                break;
            case 'error':
                this.options.onError?.(message.payload.error);
                if (!this.sessionId) {
                    reject(new Error(message.payload.error));
                }
                break;
        }
    }
    write(data) {
        if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
            this.ws.send(JSON.stringify({
                type: 'input',
                payload: { sessionId: this.sessionId, data },
            }));
        }
    }
    resize(cols, rows) {
        if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
            this.ws.send(JSON.stringify({
                type: 'resize',
                payload: { sessionId: this.sessionId, cols, rows },
            }));
        }
    }
    disconnect() {
        if (this.ws?.readyState === WebSocket.OPEN && this.sessionId) {
            this.ws.send(JSON.stringify({
                type: 'kill',
                payload: { sessionId: this.sessionId },
            }));
        }
        this.ws?.close();
        this.ws = null;
        this.sessionId = null;
    }
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    get currentSession() {
        return this.sessionId;
    }
}
