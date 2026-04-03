import { useState, useCallback, useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';
import { ChatMessage, ChatStreamEvent, ToolCall } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/chat/${sessionId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const streamingContentRef = useRef('');
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    setIsLoading(true);
    setMessages([]);
    streamingContentRef.current = '';
    setStreamingContent('');
    setPendingToolCall(null);

    fetchMessages(sessionId)
      .then((history) => {
        if (!cancelled && sessionIdRef.current === sessionId) {
          setMessages(history);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled && sessionIdRef.current === sessionId) {
          console.error('Failed to load message history:', err);
          setIsLoading(false);
        }
      });

    wsService.connect(sessionId);
    setIsConnected(true);

    const unsubscribe = wsService.onMessage((event: ChatStreamEvent) => {
      if (sessionIdRef.current !== sessionId) return;

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
      cancelled = true;
      unsubscribe();
      wsService.disconnect();
      setIsConnected(false);
      setIsLoading(false);
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
    isLoading,
    sendMessage,
    approveTool,
    rejectTool,
  };
}