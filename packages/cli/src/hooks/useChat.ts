import { useState, useCallback, useEffect } from 'react';
import { wsService } from '../services/websocket';
import { ChatMessage, ChatStreamEvent, ToolCall } from '../types';

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    wsService.connect(sessionId);
    setIsConnected(true);

    const unsubscribe = wsService.onMessage((event: ChatStreamEvent) => {
      switch (event.type) {
        case 'text':
          if (event.content) {
            setStreamingContent((prev) => prev + event.content);
          }
          break;
        case 'tool_call':
          if (event.toolCall) {
            setPendingToolCall(event.toolCall);
            setStreamingContent('');
          }
          break;
        case 'done': {
          const fromServer = (typeof event.fullText === 'string' ? event.fullText : '').trim();
          const fromChunks = streamingContent.trim();
          const assistantContent = fromChunks || fromServer;
          if (assistantContent) {
            setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
          }
          setStreamingContent('');
          setPendingToolCall(null);
          break;
        }
        case 'error':
          console.error('Chat error:', event.content);
          setStreamingContent('');
          break;
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
      setIsConnected(false);
    };
  }, [sessionId]);

  const sendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    wsService.sendMessage(content);
  }, []);

  const approveTool = useCallback((toolCallId: string) => {
    wsService.approveTool(toolCallId);
  }, []);

  const rejectTool = useCallback((toolCallId: string) => {
    wsService.rejectTool(toolCallId);
  }, []);

  return {
    messages,
    streamingContent,
    pendingToolCall,
    isConnected,
    sendMessage,
    approveTool,
    rejectTool,
  };
}
