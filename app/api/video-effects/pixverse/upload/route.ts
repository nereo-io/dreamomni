import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";

// PixVerse API 配置
const PIXVERSE_API_BASE = "https://app-api.pixverse.ai/openapi/v2";
const PIXVERSE_API_KEY = process.env.PIXVERSE_API_KEY;

interface PixVerseUploadResponse {
  ErrCode: number;
  ErrMsg: string;
  Resp?: {
    img_id: number;
    img_url: string;
  };
}

/**
 * 图片上传端点 - 只负责上传图片到 PixVerse
 * 支持两种方式：
 * 1. FormData 上传本地文件
 * 2. JSON 上传图片 URL
 */
export async function POST(req: Request) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 2. 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("Failed to get user information");
    }

    const contentType = req.headers.get("content-type") || "";
    let imageBuffer: Buffer;
    let filename: string = "image.jpg";

    // 3. 根据 Content-Type 处理不同的请求格式
    if (contentType.includes("multipart/form-data")) {
      // 处理文件上传
      const formData = await req.formData();
      const imageFile = formData.get("image") as File;
      
      if (!imageFile) {
        return respErr("No image file provided");
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      filename = imageFile.name || "upload.jpg";
      
    } else if (contentType.includes("application/json")) {
      // 处理 URL 下载
      const body = await req.json();
      const { imageUrl } = body;
      
      if (!imageUrl) {
        return respErr("No image URL provided");
      }

      console.log("Downloading image from:", imageUrl);
      
      // 下载图片
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return respErr(`Failed to download image: ${imageResponse.status}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      
      // 从 URL 获取文件名
      const urlParts = imageUrl.split("/");
      filename = urlParts[urlParts.length - 1] || "download.jpg";
      
    } else {
      return respErr("Invalid content type. Use multipart/form-data or application/json");
    }

    console.log(`Uploading image: ${filename}, size: ${imageBuffer.length} bytes`);

    // 4. 构建 multipart/form-data 用于上传到 PixVerse
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    const body = Buffer.concat([
      Buffer.from(`------${boundary}\r\n`, 'utf-8'),
      Buffer.from(`Content-Disposition: form-data; name="image"; filename="${filename}"\r\n`, 'utf-8'),
      Buffer.from(`Content-Type: image/jpeg\r\n\r\n`, 'utf-8'),
      imageBuffer,
      Buffer.from(`\r\n------${boundary}--\r\n`, 'utf-8')
    ]);

    // 5. 上传到 PixVerse
    const uploadUrl = `${PIXVERSE_API_BASE}/image/upload`;
    console.log("Uploading to PixVerse:", uploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "API-KEY": PIXVERSE_API_KEY!,
        "Ai-trace-id": `veo3-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        "Content-Type": `multipart/form-data; boundary=----${boundary}`
      },
      body: body,
    });

    const responseText = await uploadResponse.text();
    console.log("PixVerse upload response:", responseText);

    if (!uploadResponse.ok) {
      throw new Error(`Image upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. Response: ${responseText}`);
    }

    let uploadResult: PixVerseUploadResponse;
    try {
      uploadResult = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse PixVerse response: ${responseText}`);
    }

    if (uploadResult.ErrCode !== 0 || !uploadResult.Resp?.img_id) {
      throw new Error(`Image upload failed: ${uploadResult.ErrMsg || "Unknown error"}`);
    }

    // 6. 返回成功结果
    return respData({
      imgId: uploadResult.Resp.img_id,
      imgUrl: uploadResult.Resp.img_url,
      message: "Image uploaded successfully",
      metadata: {
        filename,
        size: imageBuffer.length,
        pixverseImgId: uploadResult.Resp.img_id,
      }
    });

  } catch (error) {
    console.error("Image upload failed:", error);
    let errorMessage = "Image upload failed";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return respErr(errorMessage);
  }
}
