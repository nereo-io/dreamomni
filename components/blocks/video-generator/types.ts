/**
 * Image uploader types - unified data structures
 */

export interface ImageSlot {
  url: string | null;
  isUploading: boolean;
  sourceImageId?: string;
}

export interface ImageUploaderBaseProps {
  selectedModel: string;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
  onImagesChange: (imageUrls: string[], sourceImageIds?: string[]) => void;
  imageUrls?: string[];
  sourceImageIds?: string[];
}

export interface PixverseEffectProps {
  effect?: { effect_type: string } | null;
  onPixverseImgIdChange?: (imgId: number | null) => void;
}
