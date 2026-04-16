import { useState, useEffect, useCallback, useRef } from 'react';
import { PTYConnection } from '../services/pty';

export interface UsePTYOptions {
  cols?: number;
  rows?: number;
  shellType?: 'local' | 'openclaude';
  shell?: string;
}

export function usePTY(options: UsePTYOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  
  const connectionRef = useRef<PTYConnection | null>(null);
  const onOutputRef = useRef<((id: string, data: string) => void) | null>(null);
  const isConnectingRef = useRef(false);
  const optionsRef = useRef(options);
  const tabIdRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');
  const pendingCreateRef = useRef<{ id: string; cols: number; rows: number; opts?: { shellType?: 'local' | 'openclaude'; shell?: string } } | null>(null);
  optionsRef.current = options;

  const connect = useCallback((tabId?: string) => {
    if (connectionRef.current?.isConnected() || isConnectingRef.current) {
      return;
    }

    if (tabId) {
      tabIdRef.current = tabId;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const wsUrl = API_BASE.replace(/^http/, 'ws');
    const shellType = optionsRef.current.shellType || 'local';
    const wsPath = shellType === 'openclaude' ? '/ws/pty' : '/ws/terminal';

    const connection = new PTYConnection({
      url: `${wsUrl}${wsPath}`,
      onOutput: (id, data) => {
        onOutputRef.current?.(id, data);
      },
      onError: (err) => {
        setError(err);
        setIsConnecting(false);
        isConnectingRef.current = false;
        setIsConnected(false);
      },
      onExit: (id, code, signal) => {
        console.log(`PTY ${id} exited:`, { code, signal });
        if (code !== undefined) {
          setExitCode(code);
        }
      },
      onStateChange: (state) => {
        if (state === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          isConnectingRef.current = false;

          if (pendingCreateRef.current) {
            const pending = pendingCreateRef.current;
            pendingCreateRef.current = null;
            connectionRef.current?.create(pending.id, pending.cols, pending.rows, pending.opts);
          }
        } else if (state === 'disconnected') {
          setIsConnected(false);
          setIsConnecting(false);
          isConnectingRef.current = false;
          sessionIdRef.current = '';
        } else if (state === 'error') {
          setIsConnected(false);
          setIsConnecting(false);
          isConnectingRef.current = false;
          sessionIdRef.current = '';
        }
      },
      onCreated: (sessionId) => {
        sessionIdRef.current = sessionId;
      },
    });

    connectionRef.current = connection;

    connection.connect().catch((err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to terminal';
      console.error('PTY connection failed:', err);
      setError(errorMessage);
      setIsConnecting(false);
      isConnectingRef.current = false;
      setIsConnected(false);
    });
  }, []);

  const disconnect = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    sessionIdRef.current = '';
    setIsConnected(false);
    setExitCode(null);
  }, []);

  const create = useCallback((id: string, cols: number, rows: number, opts?: { shellType?: 'local' | 'openclaude'; shell?: string; cwd?: string; command?: string; args?: string[]; env?: Record<string, string> }) => {
    tabIdRef.current = id;
    
    if (connectionRef.current?.isConnected()) {
      connectionRef.current.create(id, cols, rows, opts);
    } else {
      pendingCreateRef.current = { id, cols, rows, opts };
    }
  }, []);

  const write = useCallback((data: string) => {
    if (!sessionIdRef.current || !connectionRef.current?.isConnected()) return;
    connectionRef.current?.write(sessionIdRef.current, data);
  }, []);

  const resize = useCallback((cols: number, rows: number) => {
    if (!sessionIdRef.current || !connectionRef.current?.isConnected()) return;
    connectionRef.current?.resize(sessionIdRef.current, cols, rows);
  }, []);

  const onOutput = useCallback((callback: (id: string, data: string) => void) => {
    onOutputRef.current = callback;
    return () => {
      onOutputRef.current = null;
    };
  }, []);

  const onCreated = useCallback((callback: (sessionId: string) => void) => {
    if (connectionRef.current) {
      connectionRef.current.onCreated(callback);
    }
  }, []);

  useEffect(() => {
    return () => {
      connectionRef.current?.disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    exitCode,
    connect,
    disconnect,
    create,
    write,
    resize,
    onOutput,
    onCreated,
  };
}
