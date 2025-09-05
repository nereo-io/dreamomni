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
          p-0 bg-transparent border-0 shadow-none overflow-hidden
          ${isMobile 
            ? "max-w-[100vw] max-h-[100vh]" 
            : "max-w-[80vw] max-h-[80vh]"
          }
        `}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={imageUrl}
            alt={prompt}
            className="max-w-full max-h-full object-contain select-none"
            onClick={onClose}
            style={{ cursor: "zoom-out" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;