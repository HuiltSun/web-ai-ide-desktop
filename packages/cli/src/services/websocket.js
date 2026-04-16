class WebSocketService {
    ws = null;
    handlers = new Set();
    sessionId = null;
    connect(sessionId) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.disconnect();
        }
        this.sessionId = sessionId;
        this.ws = new WebSocket(`ws://localhost:3001/api/chat/${sessionId}/stream`);
        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handlers.forEach((handler) => handler(data));
            }
            catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
        };
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    sendMessage(content) {
        this.send({ type: 'message', content });
    }
    approveTool(toolCallId) {
        this.send({ type: 'approve', toolCallId });
    }
    rejectTool(toolCallId) {
        this.send({ type: 'reject', toolCallId });
    }
    onMessage(handler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
    disconnect() {
        this.ws?.close();
        this.ws = null;
        this.sessionId = null;
        this.handlers.clear();
    }
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    get currentSession() {
        return this.sessionId;
    }
}
export const wsService = new WebSocketService();
