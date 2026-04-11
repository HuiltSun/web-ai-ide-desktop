import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ToolCallCard } from './ToolCallCard';
import { BotIcon, SendIcon } from './Icons';

interface ChatProps {
  sessionId: string | null;
}

export function Chat({ sessionId }: ChatProps) {
  const {
    messages,
    streamingContent,
    pendingToolCall,
    isConnected,
    isGenerating,
    sendMessage,
    approveTool,
    rejectTool,
  } = useChat(sessionId);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <BotIcon className="text-white" size={16} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="text-[10px] text-slate-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <SendIcon className="text-slate-500" size={16} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-4">
              <BotIcon className="text-indigo-400" size={28} />
            </div>
            <p className="text-slate-300 text-sm font-medium mb-1">Welcome to AI Chat</p>
            <p className="text-slate-500 text-xs max-w-xs">Ask me anything about your code, and I'll help you build faster</p>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {isGenerating && !streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs">Generating response...</span>
              </div>
            </div>
          </div>
        )}

        {streamingContent && (
          <ChatMessage message={{ role: 'assistant', content: streamingContent + '...' }} isStreaming />
        )}

        {pendingToolCall && (
          <ToolCallCard
            toolCall={pendingToolCall}
            onApprove={() => approveTool(pendingToolCall.id)}
            onReject={() => rejectTool(pendingToolCall.id)}
          />
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={!isConnected} />
    </div>
  );
}
