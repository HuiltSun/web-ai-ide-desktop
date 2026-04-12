import { useState } from 'react';
import { BotIcon, SettingsIcon, RefreshIcon, UserIcon, CloseIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

interface HeaderProps {
  projectId: string | null;
  onSettingsClick: () => void;
  onRefreshClick?: () => void;
  onLoginClick?: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

export function Header({ projectId, onSettingsClick, onRefreshClick, onLoginClick, userEmail, onLogout }: HeaderProps) {
  const { t } = useSettings();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          <h1 className="text-sm font-semibold text-white tracking-tight">{t.header.appName}</h1>
          <span className="text-[10px] text-slate-400 font-medium">
            {projectId ? t.header.projectActive : t.header.noProject}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 relative">
        {onRefreshClick && (
          <button
            onClick={onRefreshClick}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            title={t.header.refresh}
          >
            <RefreshIcon size={18} />
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => {
              if (userEmail) {
                setShowUserMenu(!showUserMenu);
              } else if (onLoginClick) {
                onLoginClick();
              }
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
            title={userEmail || t.header.login}
          >
            <UserIcon size={18} />
            {userEmail && <span className="text-xs text-slate-400 max-w-[120px] truncate">{userEmail}</span>}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl z-50">
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-xs text-slate-400">{t.header.signedInAs}</p>
                <p className="text-sm text-white truncate">{userEmail}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowUserMenu(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer select-none"
                style={{ pointerEvents: 'auto' }}
              >
                <CloseIcon size={14} />
                <span>{t.header.logout}</span>
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          title={t.header.settings}
        >
          <SettingsIcon size={18} />
        </button>
      </div>
    </div>
  );
}
