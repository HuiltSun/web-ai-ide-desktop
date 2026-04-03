import { ReactNode } from 'react';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm">
        {header}
      </header>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-hidden bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
