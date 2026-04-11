import { ReactNode } from 'react';
import { MenuBar } from './MenuBar';
import { useSettings } from '../contexts/SettingsContext';

interface MenuItem {
  id?: string;
  label?: string;
  accelerator?: string;
  type?: 'separator' | 'normal';
  click?: () => void;
}

interface Menu {
  label: string;
  items: MenuItem[];
}

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  onMenuClick?: (event: string) => void;
  terminal?: ReactNode;
}

export function Layout({ header, sidebar, children, onMenuClick, terminal }: LayoutProps) {
  const { t } = useSettings();

  const menus: Menu[] = [
    {
      label: t.menu.file,
      items: [
        {
          id: 'new-project',
          label: t.menu.newProject,
          accelerator: 'Ctrl+N',
        },
        {
          id: 'open-project',
          label: t.menu.openProject,
          accelerator: 'Ctrl+O',
        },
        { type: 'separator' },
        {
          id: 'save',
          label: t.menu.save,
          accelerator: 'Ctrl+S',
        },
        {
          id: 'save-as',
          label: t.menu.saveAs,
          accelerator: 'Ctrl+Shift+S',
        },
        { type: 'separator' },
        {
          label: t.menu.exit,
          click: () => {
            window.electronAPI?.window.close();
          },
        },
      ],
    },
    {
      label: t.menu.edit,
      items: [
        { label: t.menu.undo, accelerator: 'Ctrl+Z' },
        { label: t.menu.redo, accelerator: 'Ctrl+Y' },
        { type: 'separator' },
        { label: t.menu.cut, accelerator: 'Ctrl+X' },
        { label: t.menu.copy, accelerator: 'Ctrl+C' },
        { label: t.menu.paste, accelerator: 'Ctrl+V' },
        { type: 'separator' },
        { label: t.menu.selectAll, accelerator: 'Ctrl+A' },
      ],
    },
    {
      label: t.menu.view,
      items: [
        {
          label: t.menu.reload,
          accelerator: 'Ctrl+R',
          click: () => window.electronAPI?.window.reload(),
        },
        {
          label: t.menu.toggleDeveloperTools,
          accelerator: 'Ctrl+Shift+I',
          click: () => window.electronAPI?.window.toggleDevTools(),
        },
        { type: 'separator' },
        {
          label: t.menu.toggleFullScreen,
          accelerator: 'F11',
          click: () => window.electronAPI?.window.toggleFullScreen(),
        },
      ],
    },
    {
      label: t.menu.window,
      items: [
        {
          label: t.menu.minimize,
          accelerator: 'Ctrl+M',
          click: () => window.electronAPI?.window.minimize(),
        },
        {
          label: t.menu.maximize,
          click: () => window.electronAPI?.window.maximize(),
        },
        { type: 'separator' },
        {
          label: t.menu.close,
          accelerator: 'Ctrl+W',
          click: () => window.electronAPI?.window.close(),
        },
      ],
    },
    {
      label: t.menu.help,
      items: [
        {
          label: t.menu.documentation,
          click: () => window.electronAPI?.shell.openExternal('https://webaiide.com/docs'),
        },
        {
          id: 'about',
          label: t.menu.about,
        },
      ],
    },
  ];
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#8b5cf6]/5 rounded-full blur-3xl" />
      </div>

      <MenuBar menus={menus} onMenuClick={onMenuClick} />

      <header className="h-14 glass-panel border-b border-[var(--color-border)] flex items-center px-4 relative z-10">
        {header}
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <aside className="w-64 glass-panel border-r border-[var(--color-border)] overflow-y-auto">
          {sidebar}
        </aside>

        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />
          <div className="relative h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
            {terminal && (
              <div className="h-80 border-t border-[var(--color-border)]">
                {terminal}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
