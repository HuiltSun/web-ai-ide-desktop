import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface ResizeHandleProps {
  onDrag: (delta: number) => void;
  direction: 'horizontal' | 'vertical';
}

function ResizeHandle({ onDrag, direction }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    },
    [direction]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      startPosRef.current = currentPos;
      onDrag(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDrag, direction]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`resize-handle ${isDragging ? 'active' : ''} ${
        direction === 'horizontal' ? 'vertical' : 'horizontal'
      }`}
    />
  );
}

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  terminal?: ReactNode;
  sidebarWidth?: number;
  terminalHeight?: number;
  onSidebarWidthChange?: (width: number) => void;
  onTerminalHeightChange?: (height: number) => void;
}

export function Layout({
  header,
  sidebar,
  children,
  terminal,
  sidebarWidth = 256,
  terminalHeight = 320,
  onSidebarWidthChange,
  onTerminalHeightChange,
}: LayoutProps) {
  const handleSidebarResize = useCallback(
    (delta: number) => {
      if (!onSidebarWidthChange) return;
      const newWidth = sidebarWidth + delta;
      if (newWidth >= 180 && newWidth <= 480) {
        onSidebarWidthChange(newWidth);
      }
    },
    [sidebarWidth, onSidebarWidthChange]
  );

  const handleTerminalResize = useCallback(
    (delta: number) => {
      if (!onTerminalHeightChange) return;
      const newHeight = terminalHeight - delta;
      if (newHeight >= 120 && newHeight <= 600) {
        onTerminalHeightChange(newHeight);
      }
    },
    [terminalHeight, onTerminalHeightChange]
  );

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      <header className="h-14 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex items-center px-4">
        {header}
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <aside
            className="bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] overflow-hidden flex-shrink-0"
            style={{ width: sidebarWidth }}
          >
            {sidebar}
          </aside>
          {onSidebarWidthChange && (
            <ResizeHandle onDrag={handleSidebarResize} direction="horizontal" />
          )}
          <main className="flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
            {children}
          </main>
        </div>
        {terminal && (
          <div className="border-t border-[var(--color-border)] flex-shrink-0" style={{ height: terminalHeight }}>
            {terminal}
            {onTerminalHeightChange && (
              <ResizeHandle onDrag={handleTerminalResize} direction="vertical" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
