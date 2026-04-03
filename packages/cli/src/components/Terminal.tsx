import { useState, useEffect, useRef, useCallback } from 'react';

export interface TerminalLine {
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  onCommand: (command: string) => void;
  lines: TerminalLine[];
}

export function Terminal({ onCommand, lines }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        onCommand(input.trim());
        setInput('');
      }
    },
    [input, onCommand]
  );

  return (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono text-sm">
      <div className="flex-1 overflow-y-auto p-2" ref={scrollRef}>
        {lines.map((line, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap ${
              line.type === 'error' ? 'text-red-400' : ''
            }`}
          >
            {line.type === 'command' && (
              <span className="text-blue-400">$ </span>
            )}
            {line.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-2 flex items-center">
        <span className="text-blue-400 mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent outline-none text-green-400"
          autoFocus
        />
      </form>
    </div>
  );
}
