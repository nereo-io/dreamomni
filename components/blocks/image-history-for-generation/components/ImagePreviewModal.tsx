import React from "react";

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
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt={prompt}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImagePreviewModal;