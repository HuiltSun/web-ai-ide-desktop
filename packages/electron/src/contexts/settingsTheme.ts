import type { UIStyle, ThemeMode } from './settingsTypes';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function applyUIStyle(style: UIStyle): void {
  const root = document.documentElement;
  if (style === 'ios') {
    root.classList.add('ios');
  } else {
    root.classList.remove('ios');
  }
}

export function applyThemeMode(mode: ThemeMode, uiStyle: UIStyle): void {
  const root = document.documentElement;
  if (uiStyle === 'legacy') return;

  let isDark: boolean;
  if (mode === 'system') {
    isDark = getSystemTheme() === 'dark';
  } else {
    isDark = mode === 'dark';
  }

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function createThemeChangeListener(
  themeMode: ThemeMode,
  uiStyle: UIStyle,
  callback: () => void
): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (themeMode === 'system' && uiStyle === 'ios') {
      callback();
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}