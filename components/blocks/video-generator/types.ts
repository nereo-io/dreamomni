/**
 * Image uploader types - unified data structures
 */

export interface ImageSlot {
  url: string | null;
  isUploading: boolean;
}

export interface ImageUploaderBaseProps {
  selectedModel: string;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
  onImagesChange: (imageUrls: string[]) => void;
}

export interface PixverseEffectProps {
  effect?: { effect_type: string } | null;
  onPixverseImgIdChange?: (imgId: number | null) => void;
}
