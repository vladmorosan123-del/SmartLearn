import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const ZoomableWrapper = ({ children, className = '' }: ZoomableWrapperProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const minScale = 0.5;
  const maxScale = 4;
  const scaleStep = 0.25;

  const zoomIn = () => setScale(s => Math.min(s + scaleStep, maxScale));
  const zoomOut = () => setScale(s => Math.max(s - scaleStep, minScale));
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };
  const fitToScreen = () => { setScale(1.5); setPosition({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
    setScale(s => Math.min(Math.max(s + delta, minScale), maxScale));
  }, []);

  // Attach wheel listener with passive: false to prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleTouchEnd = () => setIsDragging(false);

  useEffect(() => {
    if (scale <= 1) setPosition({ x: 0, y: 0 });
  }, [scale]);

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}>
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border p-1 shadow-lg">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} title="Micșorează">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-medium min-w-[3rem] text-center text-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Mărește">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitToScreen} title="Potrivește">
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetZoom} title="Resetează">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoomable container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div
          className="w-full h-full transition-transform duration-150"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {children}
        </div>
      </div>

      {/* Hint */}
      {scale === 1 && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full z-10">
          Scroll pentru zoom • Trage pentru a naviga
        </p>
      )}
    </div>
  );
};

export default ZoomableWrapper;
