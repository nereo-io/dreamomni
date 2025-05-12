# 数据库设计方案 for 图片虚拟商品 (已更新)

## 1. 新建表：`image_products`

用于存储图片商品信息。

| 字段名                           | 类型                       | 默认值/约束                                                                  | 描述                                               | 备注                                                                      |
| :------------------------------- | :------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------ |
| `id`                             | `uuid`                     | `uuid_generate_v4()` (PK)                                                    | 主键, 唯一标识符                                   |                                                                           |
| `created_at`                     | `timestamp with time zone` | `now()`                                                                      | 商品创建时间                                       |                                                                           |
| `updated_at`                     | `timestamp with time zone` | `now()`                                                                      | 商品最后更新时间                                   | 自动更新触发器 (on update `now()`) 推荐                                   |
| `name`                           | `text`                     | `NOT NULL`                                                                   | 商品名称 (例如：图片标题)                          |                                                                           |
| `description`                    | `text`                     |                                                                              | 商品详细描述                                       |                                                                           |
| `price`                          | `integer`                  | `NOT NULL`, `CHECK (price >= 0)`                                             | 商品价格 (美分单位, 例如：2999 代表 $29.99)        | 与 `orders.amount` 单位一致                                               |
| `currency`                       | `varchar(3)`               | `NOT NULL`                                                                   | 货币代码 (例如：'USD', 'CNY')                      | 通常是 'usd' 因为 Stripe 金额以美分计                                     |
| `type`                           | `varchar(50)`              | `NOT NULL`, `CHECK (type = ANY (ARRAY['talisman', 'wallpaper', 'other']))`   | 商品类型 (符, 壁纸等)                              | 'talisman': 符, 'wallpaper': 壁纸, 'other': 其他                          |
| `image_storage_path`             | `text`                     | `NOT NULL`                                                                   | 原图在 Storage 中的路径/文件名                     | 例如：`products/original/image_abc.jpg`                                   |
| `watermarked_image_storage_path` | `text`                     | `NOT NULL`                                                                   | 水印图在 Storage 中的路径/文件名                   | 例如：`products/watermarked/image_abc_w.jpg`                              |
| `preview_url`                    | `text`                     |                                                                              | 公开的水印图片预览 URL (可选，可动态生成)          | 如果水印图是公开的，可以直接存储，否则动态生成 Signed URL                 |
| `tags`                           | `text[]`                   | `ARRAY[]::text[]`                                                            | 商品标签 (用于搜索和分类)                          | 例如：`{'风景', '城市', '夜晚'}`                                          |
| `status`                         | `varchar(50)`              | `'active'`, `CHECK (status = ANY (ARRAY['active', 'inactive', 'archived']))` | 商品状态                                           | 'active': 可购买, 'inactive': 不可购买, 'archived': 归档                  |
| `slug`                           | `text`                     | `NOT NULL`, `UNIQUE`                                                         | 用于生成友好的 URL (例如: beautiful-city-night)    | 自动生成或手动输入                                                        |
| `download_count`                 | `integer`                  | `0`                                                                          | 图片被下载次数 (统计用)                            |                                                                           |
| `uploader_id`                    | `uuid`                     |                                                                              | 上传该商品的管理员/用户 ID (可选, 关联 auth.users) | `REFERENCES auth.users(id) ON DELETE SET NULL` (若 auth.users.id 为 uuid) |

**索引建议：**

- `slug`
- `status`
- `type`
- `tags` (GIN index for array searching)
- `uploader_id`

## 2. 现有表：`orders`

用于记录所有订单。字段保持不变，`amount` 以美分计。通过 `orders.product_id` (varchar) 存储 `image_products.id` (uuid)。

## 3. 新建表：`user_purchased_images`

用于追踪用户购买的图片及其下载权限。

| 字段名              | 类型                       | 默认值/约束               | 描述                                     | 备注                                                           |
| :------------------ | :------------------------- | :------------------------ | :--------------------------------------- | :------------------------------------------------------------- |
| `id`                | `uuid`                     | `uuid_generate_v4()` (PK) | 主键                                     |                                                                |
| `user_uuid`         | `varchar`                  | `NOT NULL`                | 用户 UUID                                | `REFERENCES public.users(uuid)` (确保引用 `public.users.uuid`) |
| `product_id`        | `uuid`                     | `NOT NULL`                | 图片商品 ID                              | `REFERENCES public.image_products(id)`                         |
| `order_id`          | `integer`                  | `NOT NULL`                | 关联的订单 ID                            | `REFERENCES public.orders(id)`                                 |
| `purchase_time`     | `timestamp with time zone` | `now()`                   | 购买时间                                 |                                                                |
| `download_count`    | `integer`                  | `0`                       | 用户下载该图片的次数 (可选)              | 如果有下载次数限制                                             |
| `last_download_at`  | `timestamp with time zone` |                           | 最后下载时间 (可选)                      |                                                                |
| `access_expires_at` | `timestamp with time zone` |                           | 下载权限过期时间 (可选，例如购买后 1 年) |                                                                |

**关系/外键:** (请确保 schema 名称正确, 默认为 `public`)

- `user_purchased_images.user_uuid` -> `public.users(uuid)`
- `user_purchased_images.product_id` -> `public.image_products(id)`
- `user_purchased_images.order_id` -> `public.orders(id)`

## 4. Supabase Storage Configuration Summary (MVP)

This outlines the MVP configuration for Supabase Storage buckets and their Row Level Security (RLS) policies.

### 4.1. Storage Buckets

1.  **`product-originals`**

    - **Purpose**: Stores original, high-resolution images for purchased products.
    - **Settings**: **Private** (Public bucket option UNCHECKED during creation).
    - **File Path Structure**: Original images uploaded by the designated admin user (`d7bed83c-44a0-4a4f-925f-efc384ea1e50`) should be placed within an `admin/assets/` subfolder. For example: `admin/assets/{some_identifier_or_filename}.jpg`. The `image_storage_path` in the `image_products` table will store this path within the bucket (e.g., `admin/assets/image123.jpg`).

2.  **`product-watermarked`**
    - **Purpose**: Stores watermarked versions of images for public preview.
    - **Settings**: **Public** (Public bucket option CHECKED during creation).
    - **File Path Structure**: For example: `{some_identifier_or_filename_watermarked}.jpg`. The `watermarked_image_storage_path` in the `image_products` table will store this path.

### 4.2. RLS Policies

**For `product-originals` Bucket (Private):**

- **Policy 1: Admin Management Access**

  - **Name**: e.g., "Admin full access to admin/assets"
  - **Allowed Operations**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - **Target Roles**: (Policy Definition will specify the user via `auth.uid()`)
  - **Policy Definition**:
    ```sql
    (bucket_id = 'product-originals')
    AND ((storage.foldername(name))[1] = 'admin') -- Top-level folder is 'admin'
    AND ((storage.foldername(name))[2] = 'assets') -- Second-level folder is 'assets'
    AND (auth.uid()::text = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50') -- Specific Admin User ID
    ```
  - **Effect**: Only the specified admin user can manage files within the `admin/assets/` subfolder.

- **Policy 2: Authenticated User Download Access (MVP Simplification)**
  - **Name**: e.g., "Authenticated user download from admin/assets"
  - **Allowed Operations**: `SELECT` only
  - **Target Roles**: `authenticated`
  - **Policy Definition**:
    ```sql
    (bucket_id = 'product-originals')
    AND ((storage.foldername(name))[1] = 'admin')
    AND ((storage.foldername(name))[2] = 'assets')
    AND (auth.role() = 'authenticated')
    ```
  - **Effect**: All authenticated users can download files from the `admin/assets/` subfolder.
  - **Note for MVP**: This relies on the application layer to verify purchase before providing a download link. Direct links, if exposed to non-purchasers, would allow downloads.

**For `product-watermarked` Bucket (Public):**

- **Policy 1: Public Read Access**
  - **Name**: e.g., "Public read access for watermarked images"
  - **Allowed Operations**: `SELECT`
  - **Target Roles**: `anon`, `authenticated`
  - **Policy Definition**:
    ```sql
    (bucket_id = 'product-watermarked')
    ```
  - **Effect**: Anyone can view/download images from this bucket.
