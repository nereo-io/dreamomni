# API 设计方案 for 图片虚拟商品 (符合 BaziAI API 规范)

本文档定义了与图片虚拟商品功能相关的后端 API 接口，遵循 BaziAI API 开发指南。所有数据库操作将通过 `/models` 目录中的相应模块进行。

## 1. 获取图片商品列表

- **路由**: `app/api/products/route.ts` (处理 `GET` 请求)
- **Endpoint**: `GET /api/products`
- **描述**: 获取所有可供购买的图片商品列表，不需要支持分页、筛选和排序。
- **路径参数**:
  - locale
- **实现说明**:
  1.  Validate query parameters.
  2.  Delegate data fetching to a function in `/models/product.ts` (e.g., `getProductsList(params)`).
  3.  The model function will query `image_products` table (where `status = 'active'`), applying filters, sorting, and pagination.
  4.  Construct `preview_url` using `image_products.watermarked_image_storage_path` and the public Supabase Storage URL.
  5.  Return data using `respData`. Handle errors using `respErr`.

## 2. 获取单个图片商品详情

- **路由**: `app/api/products/[productId]/route.ts` (处理 `GET` 请求)
- **Endpoint**: `GET /api/products/[productId]`
- **描述**: 获取指定 ID 的图片商品的详细信息。
- **路径参数**:
  - productId
  - locale
- **实现说明**:
  1.  Validate `productId` from path.
  2.  Delegate data fetching to a function in `/models/product.ts` (e.g., `getProductDetailsById(productId)`).
  3.  The model function will query `image_products` for the specified `id` and `status = 'active'`.
  4.  Construct `watermarked_image_large_url`.
  5.  Return data using `respData`. Handle errors using `respErr`.

## 3. 获取图片商品下载链接

- **路由**: `app/api/products/[productId]/download/route.ts` (处理 `GET` 请求)
- **Endpoint**: `GET /api/products/[productId]/download`
- **描述**: 用户在确认已付费后，调用此接口获取特定图片商品原图的安全下载链接 (Signed URL)。
- **路径参数**:
  - `productId` (uuid, required): The unique ID of the productHamilton 下载.
- **请求头**:
  - `Authorization`: `Bearer {access_token}` (Required for user authentication).
- **响应格式**:
  - **成功 (200 OK)**: `respData(payload)`
    ```json
    // Payload for respData
    {
      "download_url": "https://{your-supabase-url}/storage/v1/object/sign/product-originals/admin/assets/serene_valley.jpg?token=...",
      "expires_in": 3600 // Link validity in seconds
    }
    ```
  - **错误**:
    - `respErr("Authentication required")` (401)
    - `respErr("Invalid product ID")` (400)
    - `respErr("Product not found")` (404)
    - `respErr("Product not purchased or download access denied")` (403)
    - `respErr("Failed to generate download link")` (500)
- **实现说明**:
  1.  Validate `productId` from path.
  2.  Authenticate user: Extract `user_uuid` from `Authorization` header (e.g., using a helper like `getUserUuid()`). If no `user_uuid`, return `respErr("Authentication required")`.
  3.  Verify purchase: Call a function in `/models/purchase.ts` (e.g., `verifyUserProductPurchase(user_uuid, productId)`). This function checks the `user_purchased_images` table.
  4.  If purchase not verified, return `respErr("Product not purchased or download access denied")`.
  5.  Fetch original image path: If verified, call a function in `/models/product.ts` (e.g., `getProductOriginalPath(productId)`) to get `image_storage_path`. If path not found (e.g. product deleted after purchase), return `respErr("Product not found")`.
  6.  Generate signed URL: Use Supabase client (e.g., from `getSupabaseClient()`) to call `supabase.storage.from('product-originals').createSignedUrl(imagePath, expiresInSeconds)`. The `imagePath` should be the value from `image_storage_path` (e.g., `admin/assets/serene_valley.jpg`).
  7.  If signed URL generation fails, return `respErr("Failed to generate download link")`.
  8.  (Optional) Update download stats: Call a function in `/models/purchase.ts` (e.g., `recordProductDownload(purchase_id_or_user_product_relation_id)`) to update `download_count` and `last_download_at` in `user_purchased_images`.
  9.  Return `download_url` and `expires_in` using `respData`.
