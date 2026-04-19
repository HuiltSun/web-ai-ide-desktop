import { ReactNode, useState, useCallback } from 'react';
import { MenuBar } from './MenuBar';
import { useSettings } from '../contexts/SettingsContext';
import { ResizeHandle } from './ResizeHandle';
import { TerminalIcon } from './Icons';

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
  isTerminalOpen?: boolean;
  onToggleTerminal?: () => void;
  isTerminalMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export function Layout({ header, sidebar, children, onMenuClick, terminal, isTerminalOpen = true, onToggleTerminal, isTerminalMaximized = false, onToggleMaximize = () => {} }: LayoutProps) {
  const { t } = useSettings();

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [terminalHeight, setTerminalHeight] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => {
      const newWidth = prev + delta;
      if (newWidth < 120 || newWidth > 400) return prev;
      return newWidth;
    });
  }, []);

  const handleTerminalResize = useCallback((delta: number) => {
    setTerminalHeight((prev) => {
      const newHeight = prev - delta;
      if (newHeight < 100 || newHeight > 600) return prev;
      return newHeight;
    });
  }, []);

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
        <aside style={{ width: sidebarWidth }} className="glass-panel border-r border-[var(--color-border)] overflow-y-auto flex-shrink-0">
          {sidebar}
        </aside>

        <ResizeHandle
          direction="horizontal"
          onResize={handleSidebarResize}
          onDragStateChange={setIsResizing}
        />

        <main className="flex-1 overflow-hidden relative flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />
          <div className="relative flex-1 overflow-hidden flex flex-col">
            <div className={`flex-1 overflow-hidden ${!isResizing ? 'transition-all duration-200' : ''} ${isTerminalOpen && terminal ? '' : 'flex-1'}`}>
              {children}
            </div>
            {isTerminalOpen && terminal && (
              <>
                <ResizeHandle
                  direction="vertical"
                  onResize={handleTerminalResize}
                  onDragStateChange={setIsResizing}
                />
                <div 
                  style={{ height: isTerminalMaximized ? '50%' : terminalHeight }} 
                  className={`border-t border-[var(--color-border)] flex-shrink-0 ${!isResizing ? 'transition-[height] duration-200' : ''}`}
                >
                  {terminal}
                </div>
              </>
            )}
          </div>
          
          {onToggleTerminal && (
            <div className="absolute bottom-0 right-4 z-20">
              <button
                onClick={onToggleTerminal}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all duration-200 border border-b-0 ${
                  isTerminalOpen 
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)]' 
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
                title={isTerminalOpen ? t.terminal.hideTerminal : t.terminal.showTerminal}
              >
                <TerminalIcon size={14} className={isTerminalOpen ? 'text-emerald-500' : ''} />
                <span className="text-xs font-medium">{t.terminal.title}</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
