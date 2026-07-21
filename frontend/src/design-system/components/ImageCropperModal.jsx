import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Dialog } from './Overlays';
import { Button } from './Button';
import { getSmartCropBox } from '../../utils/smartCrop';
import { Loader2 } from 'lucide-react';

export function ImageCropperModal({ open, onClose, imageSrc, onCropComplete }) {
  const [isCropping, setIsCropping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const cropperRef = useRef(null);

  // Run Smart Crop when modal opens or image changes
  useEffect(() => {
    if (open && imageSrc) {
      setIsAnalyzing(true);
      getSmartCropBox(imageSrc).then((box) => {
        setIsAnalyzing(false);
        const cropper = cropperRef.current?.cropper;
        if (cropper && box) {
          cropper.setData(box);
        }
      }).catch((err) => {
        console.error("Smart crop failed:", err);
        setIsAnalyzing(false);
      });
    }
  }, [open, imageSrc]);

  const handleApplyCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsCropping(true);
    
    // getCroppedCanvas handles the actual image extraction beautifully
    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    if (!canvas) {
      setIsCropping(false);
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        setIsCropping(false);
        return;
      }
      
      const file = new File([blob], "cropped-image.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      
      onCropComplete(file, URL.createObjectURL(blob));
      setIsCropping(false);
    }, 'image/jpeg', 0.95);
  };

  const handleReset = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.reset();
    }
  };

  const handleMaximize = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      // Clear crop box to maximize
      const containerData = cropper.getContainerData();
      cropper.setCropBoxData({
        left: 0,
        top: 0,
        width: containerData.width,
        height: containerData.height
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Crop Image"
      description="Scroll to zoom. Drag outside the box to pan. Drag corners to resize."
      size="lg" // Make it larger for a better experience
      footer={
        <>
          <Button variant="outline" onClick={handleReset} className="mr-2">Reset</Button>
          <Button variant="outline" onClick={handleMaximize} className="mr-auto">Maximize</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleApplyCrop} 
            loading={isCropping} 
            disabled={isAnalyzing}
          >
            Apply Crop
          </Button>
        </>
      }
    >
      <div className="relative w-full h-[500px] bg-stone-900 rounded-md overflow-hidden mt-4">
        {isAnalyzing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-900/80 text-white">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm font-medium">AI Smart Crop analyzing...</p>
          </div>
        )}
        {imageSrc && (
          <Cropper
            ref={cropperRef}
            src={imageSrc}
            style={{ height: '100%', width: '100%' }}
            // Freeform aspect ratio
            aspectRatio={NaN} 
            guides={true}
            // Allow moving the image itself
            dragMode="crop"
            // Shows a dark overlay outside crop box
            modal={true}
            // Add a crosshair
            center={true}
            // Allow zooming
            zoomable={true}
            // Minimal crop box size
            minCropBoxHeight={50}
            minCropBoxWidth={50}
            background={false}
            responsive={true}
            autoCropArea={0.8} // Default if smart crop fails
            checkOrientation={false}
          />
        )}
      </div>
    </Dialog>
  );
}
