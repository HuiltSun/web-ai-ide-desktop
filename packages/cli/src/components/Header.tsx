import { BotIcon, SettingsIcon, RefreshIcon } from './Icons';

interface HeaderProps {
  projectId: string | null;
  onSettingsClick?: () => void;
  onRefreshClick?: () => void;
}

export function Header({ projectId, onSettingsClick, onRefreshClick }: HeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BotIcon className="text-white" size={18} />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--color-bg-secondary)] animate-pulse" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-white tracking-tight">Web AI IDE</h1>
          <span className="text-[10px] text-slate-500 font-medium">
            {projectId ? (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                {projectId}
              </span>
            ) : (
              'No Project'
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onRefreshClick && (
          <button
            onClick={onRefreshClick}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[var(--color-bg-elevated)] transition-all duration-200"
            title="Refresh"
          >
            <RefreshIcon size={18} />
          </button>
        )}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[var(--color-bg-elevated)] transition-all duration-200"
          >
            <SettingsIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
