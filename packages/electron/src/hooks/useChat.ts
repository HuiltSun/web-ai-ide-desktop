import { useState, useCallback, useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';
import { api } from '../services/api';
import { ChatMessage, ChatStreamEvent, ToolCall } from '../types';

async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/chat/${sessionId}/messages`, {
    headers: api.getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingElapsed, setGeneratingElapsed] = useState(0);
  const [waitingForFirstResponse, setWaitingForFirstResponse] = useState(false);
  const streamingContentRef = useRef('');
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isGenerating) {
      setGeneratingElapsed(0);
      interval = setInterval(() => {
        setGeneratingElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setGeneratingElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

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

    setIsConnected(false);
    const unsubOpen = wsService.onOpen(() => {
      if (!cancelled && sessionIdRef.current === sessionId) {
        setIsConnected(true);
      }
    });
    wsService.connect(sessionId);

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
        case 'tool_result':
          if (event.toolCallId && event.result) {
            setPendingToolCall((prev) => {
              if (prev && prev.id === event.toolCallId) {
                return {
                  ...prev,
                  status: event.result!.success ? 'completed' : 'rejected',
                  result: event.result!.output || event.result!.error,
                };
              }
              return prev;
            });
          }
          break;
        case 'action_required':
          if (event.promptId && event.question) {
            setPendingToolCall({
              id: event.promptId,
              name: event.actionType || 'CONFIRM_COMMAND',
              arguments: { question: event.question },
              status: 'pending',
            });
          }
          break;
        case 'done': {
          const fromChunks = streamingContentRef.current.trim();
          const fromServer = (typeof event.fullText === 'string' ? event.fullText : '').trim();
          const assistantContent = fromChunks || fromServer;
          if (assistantContent) {
            setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
          }
          streamingContentRef.current = '';
          setStreamingContent('');
          setPendingToolCall(null);
          setIsGenerating(false);
          break;
        }
        case 'error':
          console.error('Chat error:', event.content);
          streamingContentRef.current = '';
          setStreamingContent('');
          setIsGenerating(false);
          break;
      }
    });

    return () => {
      cancelled = true;
      unsubOpen();
      unsubscribe();
      wsService.disconnect();
      setIsConnected(false);
      setIsLoading(false);
    };
  }, [sessionId]);

  const sendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
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
    isGenerating,
    generatingElapsed,
    sendMessage,
    approveTool,
    rejectTool,
  };
}