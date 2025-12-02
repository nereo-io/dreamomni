import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { newStorage } from "@/lib/storage";

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

    // 验证文件大小 (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return respErr("File size cannot exceed 20MB");
    }

    // 生成文件名
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `uploads/images/${session.user.uuid}/${timestamp}.${extension}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    const uploadResult = await newStorage().uploadFile({
      body: buffer,
      key: fileName,
      contentType: file.type,
    });

    if (!uploadResult.url) {
      console.error('R2 upload failed: No URL returned');
      return respErr("Failed to upload to storage");
    }

    return respData({
      url: uploadResult.url,
      filename: uploadResult.filename || 'upload',
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
