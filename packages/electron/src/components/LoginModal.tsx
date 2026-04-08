import { useState } from 'react';
import { CloseIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
}

interface PasswordRequirement {
  test: (pw: string) => boolean;
  labelKey: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { test: (pw) => pw.length >= 8, labelKey: 'length' },
  { test: (pw) => /[A-Z]/.test(pw), labelKey: 'uppercase' },
  { test: (pw) => /[a-z]/.test(pw), labelKey: 'lowercase' },
  { test: (pw) => /[0-9]/.test(pw), labelKey: 'number' },
  { test: (pw) => /[^A-Za-z0-9]/.test(pw), labelKey: 'special' },
];

function getPasswordStrength(password: string): { level: number; color: string; textKey: string } {
  const passed = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;

  if (passed === 0) return { level: 0, color: 'bg-slate-600', textKey: '' };
  if (passed <= 2) return { level: 1, color: 'bg-red-500', textKey: 'weak' };
  if (passed <= 3) return { level: 2, color: 'bg-yellow-500', textKey: 'fair' };
  if (passed <= 4) return { level: 3, color: 'bg-blue-500', textKey: 'good' };
  return { level: 4, color: 'bg-green-500', textKey: 'strong' };
}

export function LoginModal({ isOpen, onClose, onLogin, onRegister }: LoginModalProps) {
  const { t } = useSettings();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);

  if (!isOpen) return null;

  const passwordStrength = getPasswordStrength(password);
  const requirementsMet = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register' && requirementsMet < PASSWORD_REQUIREMENTS.length) {
      setError(t.login.passwordRequirementsNotMet);
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name || undefined);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'login' ? t.login.title : t.login.register}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {t.login.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.login.namePlaceholder}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t.login.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t.login.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (mode === 'register') setShowPasswordReqs(true);
              }}
              onFocus={() => {
                if (mode === 'register') setShowPasswordReqs(true);
              }}
              placeholder="••••••••"
              required
              minLength={mode === 'register' ? 8 : 1}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />

            {mode === 'register' && showPasswordReqs && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        level <= passwordStrength.level ? passwordStrength.color : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.textKey && (
                  <p className={`text-xs ${
                    passwordStrength.level <= 1 ? 'text-red-400' :
                    passwordStrength.level === 2 ? 'text-yellow-400' :
                    passwordStrength.level === 3 ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {t.login.passwordStrength[passwordStrength.textKey as keyof typeof t.login.passwordStrength]}
                  </p>
                )}
                <div className="text-xs text-slate-500">
                  {PASSWORD_REQUIREMENTS.map((req, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 ${
                        req.test(password) ? 'text-green-400' : 'text-slate-500'
                      }`}
                    >
                      {req.test(password) ? '✓' : '○'} {t.login.passwordRequirements[req.labelKey]}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (mode === 'register' && requirementsMet < PASSWORD_REQUIREMENTS.length)}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            {loading ? t.login.loading : mode === 'login' ? t.login.login : t.login.register}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setShowPasswordReqs(false);
              }}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {mode === 'login' ? (
                <>
                  {t.login.noAccount}{' '}
                  <span className="text-indigo-400">{t.login.register}</span>
                </>
              ) : (
                <>
                  {t.login.hasAccount}{' '}
                  <span className="text-indigo-400">{t.login.login}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
