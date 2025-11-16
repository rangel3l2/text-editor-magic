import { useState, useRef, useEffect } from 'react';
import type { LogoConfig } from '../header/LogoUpload';

interface LogoInteractiveProps {
  src: string;
  alt: string;
  logoConfig?: LogoConfig;
  onConfigChange?: (config: LogoConfig) => void;
  editable?: boolean;
}

export const LogoInteractive = ({ 
  src, 
  alt, 
  logoConfig, 
  onConfigChange,
  editable = false 
}: LogoInteractiveProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(logoConfig?.width || 40);
  const [height, setHeight] = useState(logoConfig?.maxHeight || 10);
  const [position, setPosition] = useState(logoConfig?.position || { x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDownResize = (e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startPos.current = { 
      x: e.clientX, 
      y: e.clientY, 
      width, 
      height 
    };
  };

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    if (!editable || isResizing) return;
    e.preventDefault();
    setIsDragging(true);
    startPos.current = { 
      x: e.clientX - position.x, 
      y: e.clientY - position.y,
      width,
      height
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - startPos.current.x;
        const newWidth = Math.max(20, Math.min(100, startPos.current.width + (deltaX / 5)));
        setWidth(newWidth);
      } else if (isDragging) {
        const newX = e.clientX - startPos.current.x;
        const newY = e.clientY - startPos.current.y;
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (isResizing || isDragging) {
        const newConfig: LogoConfig = {
          maxHeight: height,
          width,
          position,
          crop: logoConfig?.crop
        };
        onConfigChange?.(newConfig);
      }
      setIsResizing(false);
      setIsDragging(false);
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, isDragging, width, height, position, logoConfig, onConfigChange]);

  const style: React.CSSProperties = {
    maxHeight: `${height}rem`,
    width: `${width}%`,
    objectFit: 'contain',
    cursor: editable ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transform: position.x !== 0 || position.y !== 0 ? `translate(${position.x}px, ${position.y}px)` : undefined,
    transition: isResizing || isDragging ? 'none' : 'all 0.2s ease',
  };

  if (!editable) {
    return <img src={src} alt={alt} style={style} className="w-auto object-contain" />;
  }

  return (
    <div 
      ref={imgRef}
      className="relative inline-block group"
      style={{ width: 'fit-content' }}
    >
      <img 
        src={src} 
        alt={alt} 
        style={style}
        className="w-auto object-contain select-none"
        onMouseDown={handleMouseDownDrag}
        draggable={false}
      />
      
      {editable && (
        <>
          {/* Resize handles */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ transform: 'translate(50%, 50%)' }}
            onMouseDown={handleMouseDownResize}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ transform: 'translate(50%, -50%)' }}
            onMouseDown={handleMouseDownResize}
          />
          
          {/* Border on hover */}
          <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-50 pointer-events-none transition-opacity rounded" />
        </>
      )}
    </div>
  );
};
