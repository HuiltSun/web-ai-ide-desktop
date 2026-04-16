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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (connectionRef.current?.isConnected() || isConnecting) {
      return;
    }

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
        } else if (state === 'disconnected') {
          setIsConnected(false);
          setIsConnecting(false);
        } else if (state === 'error') {
          setIsConnected(false);
          setIsConnecting(false);
        }
      },
    });

    connectionRef.current = connection;

    connection.connect().catch((err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to terminal';
      console.error('PTY connection failed:', err);
      setError(errorMessage);
      setIsConnecting(false);
      setIsConnected(false);
    });
  }, [isConnecting]);

  const disconnect = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    setIsConnected(false);
    setExitCode(null);
  }, []);

  const write = useCallback((id: string, data: string) => {
    connectionRef.current?.write(id, data);
  }, []);

  const create = useCallback((id: string, cols: number, rows: number, opts?: { cwd?: string; command?: string; args?: string[]; env?: Record<string, string> }) => {
    connectionRef.current?.create(id, cols, rows, opts);
  }, []);

  const resize = useCallback((cols: number, rows: number) => {
    if (!connectionRef.current?.isConnected()) return;
    connectionRef.current?.resize(cols, rows);
  }, []);

  const onOutput = useCallback((callback: (id: string, data: string) => void) => {
    onOutputRef.current = callback;
    return () => {
      onOutputRef.current = null;
    };
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
  };
}
