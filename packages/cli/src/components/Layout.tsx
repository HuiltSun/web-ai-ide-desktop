import { ReactNode } from 'react';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      <header className="h-14 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex items-center px-4">
        {header}
      </header>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
          {children}
        </main>
      </div>
    </div>
  );
}
