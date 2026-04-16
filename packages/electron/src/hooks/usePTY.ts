import { useState, useEffect, useCallback, useRef } from 'react';
import { PTYClient } from '../services/pty-client';

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
  const clientRef = useRef<PTYClient | null>(null);
  const onOutputRef = useRef<((data: string) => void) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (clientRef.current?.isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const client = new PTYClient({
        onConnect: () => {
          setIsConnected(true);
          setIsConnecting(false);
        },
        onOutput: (data) => {
          onOutputRef.current?.(data);
        },
        onExit: (code) => {
          setExitCode(code);
          setIsConnected(false);
        },
        onError: (err) => {
          setError(err);
          setIsConnecting(false);
          setIsConnected(false);
        },
      });

      clientRef.current = client;

      client.connect({
        cols: optionsRef.current.cols,
        rows: optionsRef.current.rows,
        shellType: optionsRef.current.shellType,
        shell: optionsRef.current.shell,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to terminal';
      console.error('PTY connection failed:', err);
      setError(errorMessage);
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setIsConnected(false);
    setExitCode(null);
  }, []);

  const write = useCallback((data: string) => {
    clientRef.current?.write(data);
  }, []);

  const resize = useCallback((cols: number, rows: number) => {
    clientRef.current?.resize(cols, rows);
  }, []);

  const onOutput = useCallback((callback: (data: string) => void) => {
    onOutputRef.current = callback;
    return () => {
      onOutputRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    exitCode,
    connect,
    disconnect,
    write,
    resize,
    onOutput,
  };
}
