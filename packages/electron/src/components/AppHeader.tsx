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
  const { t } = useSettings();

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