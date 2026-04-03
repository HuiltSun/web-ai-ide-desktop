import { ReactNode } from 'react';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="h-14 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center px-4">
        {header}
      </header>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/5 overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-hidden bg-gradient-to-b from-transparent to-black/20">
          {children}
        </main>
      </div>
    </div>
  );
}
