import { ReactNode } from 'react';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#8b5cf6]/5 rounded-full blur-3xl" />
      </div>

      <header className="h-14 glass-panel border-b border-[var(--color-border)] flex items-center px-4 relative z-10">
        {header}
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <aside className="w-64 glass-panel border-r border-[var(--color-border)] overflow-y-auto">
          {sidebar}
        </aside>

        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />
          <div className="relative h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
