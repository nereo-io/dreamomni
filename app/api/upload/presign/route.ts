import { IMAGE_CACHE_CONTROL } from "@/lib/cache-control";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 创建 S3 客户端
function getS3Client() {
  return new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT || "",
    region: process.env.STORAGE_REGION || "auto",
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
      secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
    },
  });
}

export async function POST(req: Request) {
  try {
    // 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    const body = await req.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType) {
      return respErr("Missing filename or contentType");
    }

    // 验证文件类型
    if (!contentType.startsWith("image/")) {
      return respErr("Only image files are supported");
    }

    // 验证文件大小 (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (fileSize && fileSize > maxSize) {
      return respErr("File size cannot exceed 20MB");
    }

    // 生成文件路径
    const timestamp = Date.now();
    const extension = filename.split(".").pop() || "jpg";
    const key = `uploads/images/${session.user.uuid}/${timestamp}.${extension}`;

    const bucket = process.env.STORAGE_BUCKET || "";
    if (!bucket) {
      return respErr("Storage bucket not configured");
    }

    // 生成 presigned URL
    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: IMAGE_CACHE_CONTROL,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 分钟有效期
    });

    // 构建最终的公开访问 URL
    const publicUrl = process.env.STORAGE_DOMAIN
      ? `${process.env.STORAGE_DOMAIN}/${key}`
      : `${process.env.STORAGE_ENDPOINT}/${bucket}/${key}`;

    return respData({
      presignedUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("生成 presigned URL 失败:", error);

    let errorMessage = "Failed to generate upload URL";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
