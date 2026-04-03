import { BotIcon, SettingsIcon } from './Icons';

interface HeaderProps {
  projectId: string | null;
}

export function Header({ projectId }: HeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <BotIcon className="text-white" size={18} />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-white tracking-tight">Web AI IDE</h1>
          <span className="text-[10px] text-slate-400 font-medium">
            {projectId ? 'Project Active' : 'No Project'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200">
          <SettingsIcon size={18} />
        </button>
      </div>
    </div>
  );
}