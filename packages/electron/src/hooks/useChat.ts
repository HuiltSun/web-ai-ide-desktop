import { useState, useCallback, useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';
import { ChatMessage, ChatStreamEvent, ToolCall } from '../types';

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const streamingContentRef = useRef('');

  useEffect(() => {
    if (!sessionId) return;

    streamingContentRef.current = '';
    setMessages([]);
    setStreamingContent('');
    setPendingToolCall(null);

    wsService.connect(sessionId);
    setIsConnected(true);

    const unsubscribe = wsService.onMessage((event: ChatStreamEvent) => {
      switch (event.type) {
        case 'text':
          if (event.content) {
            streamingContentRef.current += event.content;
            setStreamingContent(streamingContentRef.current);
          }
          break;
        case 'tool_call':
          if (event.toolCall) {
            setPendingToolCall(event.toolCall);
            streamingContentRef.current = '';
            setStreamingContent('');
          }
          break;
        case 'done':
          if (streamingContentRef.current) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: streamingContentRef.current },
            ]);
          }
          streamingContentRef.current = '';
          setStreamingContent('');
          setPendingToolCall(null);
          break;
        case 'error':
          console.error('Chat error:', event.content);
          streamingContentRef.current = '';
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