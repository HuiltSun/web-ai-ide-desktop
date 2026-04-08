import { useState, useRef, useEffect } from 'react';
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

interface MenuBarProps {
  menus: Menu[];
  onMenuClick?: (event: string) => void;
}

function MinimizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 6h8" strokeLinecap="round" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
    </svg>
  );
}

export function MenuBar({ menus, onMenuClick }: MenuBarProps) {
  const { t } = useSettings();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveIndex(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMenuClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.id && onMenuClick) {
      onMenuClick(item.id);
    } else if (item.click) {
      item.click();
    }
    setActiveIndex(null);
  };

  const handleMouseEnter = (index: number) => {
    if (activeIndex !== null) {
      setActiveIndex(index);
    }
  };

  return (
    <div
      ref={menuBarRef}
      className="flex items-center h-9 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-2 select-none relative z-50"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {menus.map((menu, index) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => handleMenuClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            className={`
              px-3 h-9 flex items-center gap-2 text-[13px] font-medium
              transition-all duration-150 rounded-md
              ${activeIndex === index
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-text-primary)] shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }
            `}
          >
            <span>{menu.label}</span>
            <svg
              className={`w-3 h-3 transition-transform duration-150 ${activeIndex === index ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {activeIndex === index && (
            <div className="absolute top-full left-0 mt-1 min-w-[220px] z-50">
              <div className="glass-panel border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-lg)] overflow-hidden animate-scale-in">
                <div className="py-1">
                  {menu.items.map((item, itemIndex) => {
                    if (item.type === 'separator') {
                      return (
                        <div
                          key={itemIndex}
                          className="h-px mx-2 my-1 bg-[var(--color-border)]"
                        />
                      );
                    }

                    return (
                      <button
                        key={itemIndex}
                        onClick={() => handleItemClick(item)}
                        className="w-full px-3 py-2 flex items-center justify-between text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all duration-100"
                      >
                        <span>{item.label}</span>
                        {item.accelerator && (
                          <span className="text-[11px] text-[var(--color-text-muted)] font-mono ml-4">
                            {item.accelerator}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex-1" />

      <div className="flex items-center gap-1 mr-1">
        <button
          onClick={() => window.electronAPI?.window.minimize()}
          onMouseEnter={() => setHoveredBtn('minimize')}
          onMouseLeave={() => setHoveredBtn(null)}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          title={t.menu.minimize}
        >
          <MinimizeIcon />
        </button>
        <button
          onClick={() => window.electronAPI?.window.maximize()}
          onMouseEnter={() => setHoveredBtn('maximize')}
          onMouseLeave={() => setHoveredBtn(null)}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          title={t.menu.maximize}
        >
          <MaximizeIcon />
        </button>
        <button
          onClick={() => window.electronAPI?.window.close()}
          onMouseEnter={() => setHoveredBtn('close')}
          onMouseLeave={() => setHoveredBtn(null)}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
            hoveredBtn === 'close'
              ? 'bg-red-500/90 text-white'
              : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
          title={t.menu.close}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
