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
  const [isResizing, setIsResizing] = useState<'width' | 'height' | false>(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use logoConfig directly as source of truth
  const width = logoConfig?.width || 40;
  const height = logoConfig?.maxHeight || 10;
  const position = logoConfig?.position || { x: 0, y: 0 };
  const crop = logoConfig?.crop;

  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  const handleMouseDownResize = (e: React.MouseEvent, direction: 'width' | 'height') => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    startPos.current = { 
      x: e.clientX, 
      y: e.clientY, 
      width, 
      height,
      posX: position.x,
      posY: position.y
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
      height,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing === 'width') {
        const deltaX = e.clientX - startPos.current.x;
        // Maior sensibilidade: cada pixel movido = 0.5% de largura
        const newWidth = Math.max(10, Math.min(100, startPos.current.width + (deltaX * 0.5)));
        
        const newConfig: LogoConfig = {
          maxHeight: height,
          width: newWidth,
          position,
          crop
        };
        onConfigChange?.(newConfig);
      } else if (isResizing === 'height') {
        const deltaY = e.clientY - startPos.current.y;
        // Maior sensibilidade: cada 10px = 1rem
        const newHeight = Math.max(4, Math.min(30, startPos.current.height + (deltaY / 10)));
        
        const newConfig: LogoConfig = {
          maxHeight: newHeight,
          width,
          position,
          crop
        };
        onConfigChange?.(newConfig);
      } else if (isDragging) {
        const newX = e.clientX - startPos.current.x;
        const newY = e.clientY - startPos.current.y;
        
        const newConfig: LogoConfig = {
          maxHeight: height,
          width,
          position: { x: newX, y: newY },
          crop
        };
        onConfigChange?.(newConfig);
      }
    };

    const handleMouseUp = () => {
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
  }, [isResizing, isDragging, width, height, position, crop, onConfigChange]);

  // Styles for cropped/un-cropped rendering
  const getImageStyles = (): React.CSSProperties => {
    if (!crop || !crop.width || !crop.height) {
      return {
        maxHeight: `${height}rem`,
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
      };
    }

    // When cropped: scale so the visible portion fills the container width
    // crop.width is the percentage of original image that's visible
    // To make that fill 100% of container, scale image to (100/crop.width)%
    const scalePercent = (100 / crop.width) * 100;
    
    return {
      width: `${scalePercent}%`,
      height: 'auto',
      objectFit: 'contain',
      transform: `translate(-${crop.x * (100/crop.width)}%, -${crop.y * (100/crop.height)}%)`,
      display: 'block',
      minHeight: '100%',
    };
  };

  const containerStyle: React.CSSProperties = {
    transform: position.x !== 0 || position.y !== 0 ? `translate(${position.x}px, ${position.y}px)` : undefined,
    transition: isResizing || isDragging ? 'none' : 'transform 0.2s ease',
    cursor: editable ? (isDragging ? 'grabbing' : 'grab') : 'default',
    display: 'inline-block',
    width: `${width}%`,
    maxHeight: `${height}rem`,
    height: crop ? `${height}rem` : 'auto',
    overflow: crop ? 'hidden' : 'visible',
    position: 'relative',
  };

  const imageStyle: React.CSSProperties = getImageStyles();

  if (!editable) {
    return (
      <div style={containerStyle}>
        <img src={src} alt={alt} style={imageStyle} className="select-none" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative inline-block group"
      style={containerStyle}
    >
      <img 
        src={src} 
        alt={alt} 
        style={imageStyle}
        className="select-none"
        onMouseDown={handleMouseDownDrag}
        draggable={false}
      />
      
      {editable && (
        <>
          {/* Resize handle - Width (right side) */}
          <div
            className="absolute top-1/2 right-0 w-5 h-12 bg-primary rounded-lg cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
            style={{ transform: 'translate(50%, -50%)', zIndex: 10 }}
            onMouseDown={(e) => handleMouseDownResize(e, 'width')}
          >
            <div className="flex flex-col gap-1">
              <div className="w-0.5 h-1 bg-primary-foreground" />
              <div className="w-0.5 h-1 bg-primary-foreground" />
              <div className="w-0.5 h-1 bg-primary-foreground" />
            </div>
          </div>
          
          {/* Resize handle - Height (bottom side) */}
          <div
            className="absolute bottom-0 left-1/2 w-12 h-5 bg-primary rounded-lg cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
            style={{ transform: 'translate(-50%, 50%)', zIndex: 10 }}
            onMouseDown={(e) => handleMouseDownResize(e, 'height')}
          >
            <div className="flex gap-1">
              <div className="h-0.5 w-1 bg-primary-foreground" />
              <div className="h-0.5 w-1 bg-primary-foreground" />
              <div className="h-0.5 w-1 bg-primary-foreground" />
            </div>
          </div>
          
          {/* Border on hover with size info */}
          <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-50 pointer-events-none transition-opacity rounded" />
          
          {/* Size indicator */}
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {width.toFixed(0)}% × {height.toFixed(1)}rem
          </div>
        </>
      )}
    </div>
  );
};
