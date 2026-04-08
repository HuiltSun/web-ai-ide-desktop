import { useState, useRef, useEffect } from 'react';
import { SendIcon, SparklesIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { t } = useSettings();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`
        relative flex items-end rounded-2xl border transition-all duration-200
        ${isFocused
          ? 'border-indigo-500/50 bg-slate-800/80 shadow-lg shadow-indigo-500/10'
          : 'border-slate-700/50 bg-slate-800/50'
        }
        ${disabled ? 'opacity-50' : ''}
      `}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t.chat.messagePlaceholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-3 bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none max-h-[150px]"
          style={{ minHeight: '48px' }}
        />
        <div className="flex items-center gap-2 p-2">
          {input.trim() && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <SparklesIcon size={12} className="text-white" />
            </div>
          )}
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className={`
              p-2.5 rounded-xl transition-all duration-200
              ${input.trim()
                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-purple-600'
                : 'bg-slate-700/50 text-slate-500'
              }
            `}
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="text-[10px] text-slate-500">
          {t.chat.pressEnter}
        </span>
      </div>
    </form>
  );
}
