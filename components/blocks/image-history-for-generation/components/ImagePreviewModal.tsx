import React from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90" />
      <DialogContent 
        className={`
          p-0 bg-transparent border-0 shadow-none
          ${isMobile 
            ? "max-w-[98vw] max-h-[95vh]" 
            : "max-w-[90vw] max-h-[90vh]"
          }
        `}
      >
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <img
            src={imageUrl}
            alt={prompt}
            className={`
              object-contain select-none
              ${isMobile 
                ? "max-w-[calc(98vw-2rem)] max-h-[calc(95vh-4rem)]" 
                : "max-w-[calc(90vw-4rem)] max-h-[calc(90vh-4rem)]"
              }
            `}
            onClick={onClose}
            style={{ cursor: "zoom-out" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;