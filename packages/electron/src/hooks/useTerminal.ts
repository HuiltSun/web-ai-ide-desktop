import { useState, useCallback, useEffect, useRef } from 'react';
import { TerminalSocket } from '../services/terminalSocket.js';
import type { TerminalSession, CreateSessionPayload, OutputPayload } from '@web-ai-ide/shared';

export interface UseTerminalReturn {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  isConnected: boolean;
  connectionError: string | null;
  createSession: (options: CreateSessionPayload) => Promise<string>;
  killSession: (sessionId: string) => Promise<void>;
  setActiveSession: (sessionId: string) => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;
  writeToTerminal: (sessionId: string, data: string) => void;
  outputBuffer: Map<string, string[]>;
  onOutput: (sessionId: string, callback: (data: string) => void) => void;
}

export function useTerminal(): UseTerminalReturn {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [outputBuffer, setOutputBuffer] = useState<Map<string, string[]>>(new Map());

  const socketRef = useRef<TerminalSocket | null>(null);
  const outputCallbacksRef = useRef<Map<string, (data: string) => void>>(new Map());

  useEffect(() => {
    const socket = new TerminalSocket();
    socketRef.current = socket;

    socket.connect().then(() => {
      setIsConnected(true);
      setConnectionError(null);
    }).catch((error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.onMessage((message) => {
      if (message.type === 'output') {
        const payload = message.payload as OutputPayload;
        const { sessionId, data } = payload;
        if (sessionId) {
          setOutputBuffer((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(sessionId) || [];
            newMap.set(sessionId, [...existing, data]);
            return newMap;
          });
          const callback = outputCallbacksRef.current.get(sessionId);
          if (callback) {
            callback(data);
          }
        }
      } else if (message.type === 'exit') {
        const payload = message.payload as { sessionId: string; exitCode?: number };
        if (payload.sessionId) {
          setSessions((prev) => prev.filter((s) => s.id !== payload.sessionId));
          if (activeSessionId === payload.sessionId) {
            setActiveSessionId(null);
          }
        }
      } else if (message.type === 'created') {
        if (message.sessionId) {
          const newSession: TerminalSession = {
            id: message.sessionId,
            name: `Terminal ${sessions.length + 1}`,
            shellType: 'local',
            createdAt: new Date(),
            lastActiveAt: new Date(),
          };
          setSessions((prev) => [...prev, newSession]);
          setActiveSessionId(message.sessionId);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createSession = useCallback(async (options: CreateSessionPayload): Promise<string> => {
    if (!socketRef.current) {
      throw new Error('Socket not connected');
    }
    const sessionId = await socketRef.current.createSession(options);
    return sessionId;
  }, []);

  const killSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!socketRef.current) {
      throw new Error('Socket not connected');
    }
    socketRef.current.kill(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const setActiveSession = useCallback((sessionId: string): void => {
    setActiveSessionId(sessionId);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, lastActiveAt: new Date() } : s
      )
    );
  }, []);

  const resizeTerminal = useCallback((sessionId: string, cols: number, rows: number): void => {
    if (socketRef.current) {
      socketRef.current.resize(sessionId, cols, rows);
    }
  }, []);

  const writeToTerminal = useCallback((sessionId: string, data: string): void => {
    if (socketRef.current) {
      socketRef.current.write(sessionId, data);
    }
  }, []);

  const onOutput = useCallback((sessionId: string, callback: (data: string) => void): void => {
    outputCallbacksRef.current.set(sessionId, callback);
  }, []);

  return {
    sessions,
    activeSessionId,
    isConnected,
    connectionError,
    createSession,
    killSession,
    setActiveSession,
    resizeTerminal,
    writeToTerminal,
    outputBuffer,
    onOutput,
  };
}
