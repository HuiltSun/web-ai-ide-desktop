import { useState, useEffect, useCallback, useRef } from 'react';
import { PTYClient } from '../services/pty-client';

export interface UsePTYOptions {
  cols?: number;
  rows?: number;
}

export function usePTY(options: UsePTYOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const clientRef = useRef<PTYClient | null>(null);
  const onOutputRef = useRef<((data: string) => void) | null>(null);

  const connect = useCallback(async () => {
    if (clientRef.current?.isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

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

    try {
      await client.connect();
      client.write('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
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