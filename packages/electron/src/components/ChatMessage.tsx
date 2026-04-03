import { BotIcon, UserIcon } from './Icons';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-500' 
            : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50'
        }`}>
          {isUser ? (
            <UserIcon className="text-white" size={14} />
          ) : (
            <BotIcon className="text-indigo-400" size={14} />
          )}
        </div>
        <div className={`rounded-2xl px-4 py-3 shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-tr-md'
            : 'bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/50 text-slate-100 rounded-tl-md'
        }`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
          {isUser && (
            <div className="mt-1 text-[10px] text-white/50 text-right">You</div>
          )}
        </div>
      </div>
    </div>
  );
}