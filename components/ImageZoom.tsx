
import React, { useState, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageZoomModalProps {
  imageUrl: string;
  altText: string;
  isOpen: boolean;
  onClose: () => void;
}

// Fullscreen zoom modal for both desktop (scroll wheel) and mobile (pinch)
export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageUrl, altText, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10000] w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border border-white/20"
      >
        <X size={22} />
      </button>

      {/* Zoom hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] bg-white/10 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-white/20 pointer-events-none animate-pulse">
        <span className="hidden md:inline">Scroll to zoom • Drag to pan</span>
        <span className="md:hidden">Pinch to zoom • Drag to pan</span>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        centerOnInit={true}
        wheel={{ step: 0.15 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: 'toggle', step: 2 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-2 border border-white/20">
              <button
                onClick={() => zoomOut()}
                className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-all"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-all"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => zoomIn()}
                className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-all"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
            </div>

            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={imageUrl}
                alt={altText}
                className="max-w-[90vw] max-h-[85vh] object-contain select-none"
                draggable={false}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

// Inline zoom component for ProductDetails gallery (hover zoom on desktop, pinch on mobile)
interface InlineImageZoomProps {
  imageUrl: string;
  altText: string;
  className?: string;
  onOpenModal?: () => void;
}

export const InlineImageZoom: React.FC<InlineImageZoomProps> = ({ imageUrl, altText, className = '', onOpenModal }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-white cursor-crosshair group ${className}`}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
      onClick={onOpenModal}
    >
      {/* Normal Image */}
      <img
        src={imageUrl}
        alt={altText}
        className={`product-gallery-main-image absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
        draggable={false}
      />

      {/* Zoomed Image */}
      <img
        src={imageUrl}
        alt={altText}
        className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-75 ease-out ${isZoomed ? 'scale-[1.5] opacity-100' : 'scale-100 opacity-0'}`}
        style={{
          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
        }}
        draggable={false}
      />

      {/* Expand to fullscreen button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenModal) onOpenModal();
        }}
        className={`absolute bottom-3 right-3 z-10 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all ${isZoomed ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
        title="Open fullscreen"
      >
        <ZoomIn size={16} />
      </button>

      {/* Zoom hint on first view */}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-opacity ${isZoomed ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
          <span className="hidden md:inline">Hover to zoom • Click to expand</span>
          <span className="md:hidden">Tap to expand</span>
        </div>
      </div>
    </div>
  );
};

export default ImageZoomModal;
