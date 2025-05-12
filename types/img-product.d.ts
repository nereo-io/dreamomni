export interface ImageProduct {
  id: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  description?: string;
  price: number; // in cents
  currency: string;
  type: string; // 'talisman' | 'wallpaper' | 'other'
  image_storage_path?: string;
  watermarked_image_storage_path?: string;
  preview_url?: string;
  tags?: string[];
  slug: string;
  status: string; // 'active' | 'inactive' | 'archived'
  download_count: number;
}

export interface PurchasedImageProduct {
  id?: string;
  created_at?: string;
  updated_at?: string;
  product_id: string;
  order_id: string;
  user_uuid: string; // 与数据库字段名保持一致
  purchase_time: string;
  access_expires_at?: string | null;
  download_count?: number;
  last_download_time?: string | null;
  product?: ImageProduct; // 关联的产品信息，在 join 查询时使用
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface UserPurchasedImagesResponse {
  data: PurchasedImageProduct[];
  pagination: PaginationInfo;
}
