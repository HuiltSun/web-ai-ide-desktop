import { useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useSettings } from '../contexts/SettingsContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ToolCallCard } from './ToolCallCard';
import { BotIcon, SparklesIcon } from './Icons';

interface ChatProps {
  sessionId: string | null;
}

export function Chat({ sessionId }: ChatProps) {
  const { t } = useSettings();
  const {
    messages,
    streamingContent,
    pendingToolCall,
    isConnected,
    sendMessage,
    approveTool,
    rejectTool,
  } = useChat(sessionId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900/50 to-slate-800/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-4">
              <BotIcon className="text-indigo-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t.chat.aiAssistant}</h3>
            <p className="text-slate-400 text-sm max-w-md">
              {t.chat.askMeAnything}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-400 border border-white/10">
                {t.chat.writeCode}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-400 border border-white/10">
                {t.chat.debugErrors}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-400 border border-white/10">
                {t.chat.explainLogic}
              </span>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {streamingContent?.trim() && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/50 shadow-lg">
              <div className="flex items-center gap-2 text-slate-400">
                <SparklesIcon size={14} className="text-indigo-400 animate-pulse" />
                <span className="text-xs">{t.chat.thinking}</span>
              </div>
              <div className="mt-2 text-sm text-slate-300 whitespace-pre-wrap break-words">
                {streamingContent}
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-400/50 animate-pulse rounded" />
              </div>
            </div>
          </div>
        )}

        {pendingToolCall && (
          <ToolCallCard
            toolCall={pendingToolCall}
            onApprove={() => approveTool(pendingToolCall.id)}
            onReject={() => rejectTool(pendingToolCall.id)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/20 to-transparent">
        <ChatInput onSend={sendMessage} disabled={!isConnected} />
      </div>

      {!isConnected && (
        <div className="absolute inset-x-0 bottom-20 flex items-center justify-center">
          <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {t.chat.disconnected}
          </div>
        </div>
      )}
    </div>
  );
}