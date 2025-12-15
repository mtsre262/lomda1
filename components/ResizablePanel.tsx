import React, { useState, useEffect, useRef } from 'react';

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface ResizablePanelProps {
  initialSize: number;
  minSize?: number;
  maxSize?: number;
  direction: Direction;
  className?: string;
  children: React.ReactNode;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  initialSize,
  minSize = 50,
  maxSize = 800,
  direction,
  className = '',
  children
}) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    // Store initial mouse position based on direction
    startPos.current = (direction === 'left' || direction === 'right') ? e.clientX : e.clientY;
    startSize.current = size;
    
    // Set global cursor to prevent flickering
    document.body.style.cursor = (direction === 'left' || direction === 'right') ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      let delta = 0;
      const currentPos = (direction === 'left' || direction === 'right') ? e.clientX : e.clientY;
      
      if (direction === 'right') {
          // Handle on right: dragging right increases width
          delta = currentPos - startPos.current;
      } else if (direction === 'left') {
          // Handle on left: dragging left increases width
          delta = startPos.current - currentPos;
      } else if (direction === 'bottom') {
          // Handle on bottom: dragging down increases height
          delta = currentPos - startPos.current;
      } else if (direction === 'top') {
          // Handle on top: dragging up increases height
          delta = startPos.current - currentPos;
      }

      setSize(Math.min(Math.max(startSize.current + delta, minSize), maxSize));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, minSize, maxSize]);

  // Handle Styles
  const handleStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 60,
    backgroundColor: isResizing ? '#60a5fa' : 'transparent', 
    transition: 'background-color 0.2s',
  };

  if (direction === 'right') {
      Object.assign(handleStyles, { top: 0, bottom: 0, right: -4, width: '8px', cursor: 'col-resize' });
  } else if (direction === 'left') {
      Object.assign(handleStyles, { top: 0, bottom: 0, left: -4, width: '8px', cursor: 'col-resize' });
  } else if (direction === 'top') {
      Object.assign(handleStyles, { left: 0, right: 0, top: -4, height: '8px', cursor: 'row-resize' });
  } else if (direction === 'bottom') {
      Object.assign(handleStyles, { left: 0, right: 0, bottom: -4, height: '8px', cursor: 'row-resize' });
  }

  return (
    <div 
        className={`${className} relative flex flex-col group/resize`} 
        style={{ 
            [direction === 'top' || direction === 'bottom' ? 'height' : 'width']: size,
            flexShrink: 0 
        }}
    >
        <div 
            style={handleStyles} 
            onMouseDown={handleMouseDown}
            className="hover:bg-electro-glow/50 active:bg-electro-glow"
        />
        <div className="flex-1 w-full h-full overflow-hidden">
            {children}
        </div>
    </div>
  );
};
