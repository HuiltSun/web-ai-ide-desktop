import { useState, useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function ResizeHandle({
  direction,
  onResize,
  onDragStateChange,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;
  const startPosRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
      setIsDragging(true);
    },
    [direction]
  );

  useEffect(() => {
    if (!isDragging) return;

    onDragStateChangeRef.current?.(true);
    document.body.style.userSelect = 'none';

    let lastPos = startPosRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - lastPos;
      lastPos = currentPos;
      if (delta !== 0) {
        onResizeRef.current(delta);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      onDragStateChangeRef.current?.(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      onDragStateChangeRef.current?.(false);
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
        flex-shrink-0
        ${isHorizontal ? 'border-l border-[var(--color-border)] hover:border-[var(--color-accent)]' : 'border-t border-[var(--color-border)] hover:border-[var(--color-accent)]'}
      `}
    />
  );
}
