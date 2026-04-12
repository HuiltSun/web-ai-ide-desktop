import { useSettings } from '../contexts/SettingsContext';
import { SparklesIcon, CodeIcon } from './Icons';

interface WelcomeScreenProps {
  userEmail?: string;
}

export function WelcomeScreen({ userEmail }: WelcomeScreenProps) {
  const { t } = useSettings();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <SparklesIcon className="text-white" size={36} />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <CodeIcon className="text-white" size={12} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {t.welcome.title}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {userEmail
            ? `${t.welcome.loggedIn}, ${userEmail}. ${t.welcome.selectOrCreate}`
            : t.welcome.loggedOut}
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium">{t.welcome.connected}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-medium">{t.welcome.aiReady}</span>
          </div>
        </div>
      </div>
    </div>
  );
}