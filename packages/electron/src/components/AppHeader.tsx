import { useSettings } from '../contexts/SettingsContext';
import { Header } from './Header';

interface AppHeaderProps {
  selectedProjectName?: string;
  onSettingsClick: () => void;
  onRefreshClick: () => void;
  onLoginClick: () => void;
  userEmail?: string;
  onLogout: () => void;
}

export function AppHeader({ selectedProjectName, onSettingsClick, onRefreshClick, onLoginClick, userEmail, onLogout }: AppHeaderProps) {
  const { t: _t } = useSettings(); // 保留供后续开发使用

  return (
    <Header
      projectId={selectedProjectName || null}
      onSettingsClick={onSettingsClick}
      onRefreshClick={onRefreshClick}
      onLoginClick={onLoginClick}
      userEmail={userEmail || null}
      onLogout={onLogout}
    />
  );
}
