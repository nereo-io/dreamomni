import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { newStorage } from "@/lib/storage";
import { aliOSSService } from "@/services/storage/AliOSSService";

export async function POST(req: Request) {
  try {
    // 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 获取上传的文件
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return respErr("No file found");
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return respErr("Only image files are supported");
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return respErr("File size cannot exceed 10MB");
    }

    // 生成文件名
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const r2FileName = `uploads/images/${session.user.uuid}/${timestamp}.${extension}`;
    const ossFileName = `uploads/images/${session.user.uuid}/${timestamp}.${extension}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 并行上传到 R2 和 OSS
    const [r2Result, ossResult] = await Promise.allSettled([
      // 上传到 R2
      newStorage().uploadFile({
        body: buffer,
        key: r2FileName,
        contentType: file.type,
      }),
      // 上传到 OSS（如果服务可用）
      aliOSSService.isAvailable()
        ? aliOSSService.uploadBuffer(buffer, ossFileName, file.type)
        : Promise.reject(new Error('OSS service not available'))
    ]);

    // 默认使用 R2 结果
    let primaryUrl = '';
    let ossUrl = null;
    
    if (r2Result.status === 'fulfilled' && r2Result.value.url) {
      primaryUrl = r2Result.value.url;
    } else {
      console.error('R2 upload failed:', r2Result.status === 'rejected' ? r2Result.reason : 'No URL returned');
      return respErr("Failed to upload to primary storage");
    }
    
    if (ossResult.status === 'fulfilled') {
      ossUrl = ossResult.value;
    } else {
      // OSS 失败不影响主流程
    }

    return respData({
      url: primaryUrl,  // 主 URL（R2）
      oss_url: ossUrl,  // OSS URL（可选）
      filename: r2Result.status === 'fulfilled' && r2Result.value.filename ? r2Result.value.filename : 'upload',
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("文件上传失败:", error);

    let errorMessage = "文件上传失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
