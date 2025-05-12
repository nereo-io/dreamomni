export interface ProductsPageTranslation {
  title: string;
  description: string;
  noProductsFound: string;
  addToCart: string;
  buyNow: string;
  price: string;
  tags: string;
  filterByTag: string;
  backToProducts: string;
  watermarkNotice: string;
  noDescription: string;
  processing: string;
  alreadyPurchased: string;
  purchaseNotice: string;
  checkingPurchase: string;
  downloading: string;
  downloadOriginal: string;
  myPurchasedImages: string;
  myPurchasedImagesDescription: string;
  noPurchasedImages: string;
  expiresOn: string;
}

export interface Product {
  id: string;
  name: string;
  watermarked_image_url: string;
  tags: string[];
  slug: string;
  price: number;
  description?: string;
}
