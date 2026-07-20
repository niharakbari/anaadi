import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, Maximize } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdvancedLightbox({
  open,
  onClose,
  items = [],
  currentIndex = 0,
  onIndexChange,
  onViewDetails,
  apiBaseUrl = ''
}) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const overlayRef = useRef(null);

  // Reset scale when image changes
  useEffect(() => {
    setScale(1);
  }, [currentIndex, open]);

  // Keyboard navigation & closing
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          onIndexChange?.(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < items.length - 1) {
          onIndexChange?.(currentIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, items.length, onClose, onIndexChange]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Setup wheel listener with { passive: false } to avoid warnings
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!open || !overlay) return;

    const handleWheel = (e) => {
      e.preventDefault();
      setScale((prev) => {
        const newScale = prev - e.deltaY * 0.01;
        return Math.min(Math.max(newScale, 1), 4);
      });
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => overlay.removeEventListener('wheel', handleWheel);
  }, [open]);

  if (!open || !items || items.length === 0 || currentIndex < 0 || currentIndex >= items.length) {
    return null;
  }

  const currentItem = items[currentIndex];
  const imgUrl = currentItem.image
    ? ((currentItem.image.startsWith('http') || currentItem.image.startsWith('blob:') || currentItem.image.startsWith('data:')) ? currentItem.image : `${apiBaseUrl}${currentItem.image}`)
    : null;

  const handleDoubleClick = () => {
    setScale((prev) => (prev > 1 ? 1 : 2.5));
  };

  const handleDownload = async () => {
    if (!imgUrl) return;
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = currentItem.title ? `${currentItem.title}.jpg` : 'design.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback to old method just in case CORS fails
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = currentItem.title ? `${currentItem.title}.jpg` : 'design.jpg';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/90 backdrop-blur-sm"
          />

          {/* Top Toolbar */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 bg-gradient-to-b from-stone-900/50 to-transparent"
          >
            <div className="flex items-center gap-4 text-white">
              <span className="text-sm font-medium opacity-80 font-mono">
                {currentIndex + 1} / {items.length}
              </span>
              <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">
                {currentItem.title || currentItem.sku || 'Design Preview'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {scale > 1 && (
                <button
                  onClick={() => setScale(1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                  title="Reset Zoom"
                >
                  <Maximize size={14} />
                  Reset Zoom
                </button>
              )}
              <button
                onClick={handleDownload}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Download Design"
              >
                <Download size={18} />
              </button>
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(currentItem)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Open Details"
                >
                  <ExternalLink size={18} />
                </button>
              )}
              <div className="w-px h-6 bg-white/20 mx-2" />
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>

          {/* Navigation - Left */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange?.(currentIndex - 1); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-stone-900/50 hover:bg-stone-800/80 text-white backdrop-blur-md transition-colors"
              title="Previous Image"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Navigation - Right */}
          {currentIndex < items.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange?.(currentIndex + 1); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-stone-900/50 hover:bg-stone-800/80 text-white backdrop-blur-md transition-colors"
              title="Next Image"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Image Container */}
          <div 
            className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden"
            ref={containerRef}
            onClick={onClose}
          >
            {imgUrl ? (
              <motion.img
                key={imgUrl}
                src={imgUrl}
                alt={currentItem.title || 'Preview'}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: scale }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                drag={scale > 1}
                dragConstraints={containerRef}
                onDoubleClick={handleDoubleClick}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl",
                  scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                )}
                draggable="false"
              />
            ) : (
              <div className="w-64 h-64 bg-stone-800 rounded-xl flex items-center justify-center text-stone-500">
                No Image Available
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
