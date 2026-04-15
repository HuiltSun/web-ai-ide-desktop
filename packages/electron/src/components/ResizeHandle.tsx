import { useState, useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

export function ResizeHandle({
  direction,
  onResize,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const delta = direction === 'horizontal' ? e.movementX : e.movementY;
      onResizeRef.current(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, direction]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      className={`
        ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${isDragging ? 'bg-[var(--color-accent)]' : 'bg-transparent hover:bg-[var(--color-accent)]/50'}
        transition-colors duration-150 flex-shrink-0
        ${isHorizontal ? 'border-l border-[var(--color-border)] hover:border-[var(--color-accent)]' : 'border-t border-[var(--color-border)] hover:border-[var(--color-accent)]'}
      `}
    />
  );
}
