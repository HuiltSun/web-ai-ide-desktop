import { BotIcon, UserIcon } from './Icons';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
          <BotIcon className="text-white" size={14} />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md'
            : 'bg-[var(--color-bg-tertiary)] text-slate-200 border border-[var(--color-border)] rounded-bl-md'
        } ${isStreaming ? 'animate-pulse' : ''}`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-1 animate-pulse rounded" />
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center ml-2 mt-0.5 flex-shrink-0">
          <UserIcon className="text-slate-400" size={14} />
        </div>
      )}
    </div>
  );
}
