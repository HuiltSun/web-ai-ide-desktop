import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { CloseIcon, SparklesIcon, DatabaseIcon, PaletteIcon } from './Icons';
import { SettingsAITab } from './settings/SettingsAITab';
import { SettingsDatabaseTab } from './settings/SettingsDatabaseTab';
import { SettingsGeneralTab } from './settings/SettingsGeneralTab';

type Tab = 'ai' | 'database' | 'general';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('ai');
  const [saved, _setSaved] = useState(false); // 保留供后续开发使用

  const tabs: { id: Tab; icon: React.ReactNode }[] = [
    { id: 'ai', icon: <SparklesIcon size={16} /> },
    { id: 'database', icon: <DatabaseIcon size={16} /> },
    { id: 'general', icon: <PaletteIcon size={16} /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[720px] max-h-[85vh] bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.settings.title}</h2>
            <p className="text-sm text-[var(--color-text-tertiary)]">{t.settings.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-[var(--color-success)] animate-fade-in">{t.settings.actions.saved}</span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-[var(--color-border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {tab.icon}
              {t.settings.tabs[tab.id]}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {activeTab === 'ai' && <SettingsAITab />}
          {activeTab === 'database' && <SettingsDatabaseTab />}
          {activeTab === 'general' && <SettingsGeneralTab />}
        </div>
      </div>
    </div>
  );
}