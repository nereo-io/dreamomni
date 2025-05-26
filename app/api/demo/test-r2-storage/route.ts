import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { action, testUrl, testFileName } = await req.json();

    if (!action) {
      return respErr("action parameter is required");
    }

    const storage = newStorage();

    switch (action) {
      case "test-connection": {
        // 测试存储连接配置
        try {
          // 创建一个简单的测试文件来验证连接
          const testContent = Buffer.from(
            "Test R2 Storage Connection",
            "utf-8"
          );
          const testKey = `test/${randomUUID()}.txt`;

          const result = await storage.uploadFile({
            body: testContent,
            key: testKey,
            contentType: "text/plain",
            disposition: "inline",
          });

          return respData({
            status: "success",
            message: "R2 storage connection test successful",
            uploadResult: result,
          });
        } catch (error) {
          console.error("R2 connection test failed:", error);
          return respErr(
            "R2 storage connection test failed: " + (error as Error).message
          );
        }
      }

      case "upload-video-from-url": {
        if (!testUrl) {
          return respErr("testUrl parameter is required for video upload test");
        }

        try {
          // 从远程 URL 下载并上传到 R2 (模拟 fal.ai 视频上传流程)
          const videoKey = `videos/test_${Date.now()}_${randomUUID()}.mp4`;

          const result = await storage.downloadAndUpload({
            url: testUrl,
            key: videoKey,
            contentType: "video/mp4",
            disposition: "inline",
          });

          return respData({
            status: "success",
            message: "Video upload from URL successful",
            uploadResult: result,
            videoKey: videoKey,
          });
        } catch (error) {
          console.error("Video upload from URL failed:", error);
          return respErr(
            "Video upload from URL failed: " + (error as Error).message
          );
        }
      }

      case "create-test-video": {
        try {
          // 创建一个小的测试视频文件 (这里我们创建一个假的视频 Buffer)
          // 在实际环境中，这将是从 fal.ai 下载的真实视频
          const testVideoContent = Buffer.from(
            "This is a test video file content placeholder",
            "utf-8"
          );

          const fileName = testFileName || `test_video_${Date.now()}.mp4`;
          const videoKey = `videos/${fileName}`;

          const result = await storage.uploadFile({
            body: testVideoContent,
            key: videoKey,
            contentType: "video/mp4",
            disposition: "inline",
          });

          return respData({
            status: "success",
            message: "Test video file created and uploaded successfully",
            uploadResult: result,
            videoKey: videoKey,
          });
        } catch (error) {
          console.error("Test video creation failed:", error);
          return respErr(
            "Test video creation failed: " + (error as Error).message
          );
        }
      }

      case "get-storage-info": {
        // 返回当前存储配置信息 (用于调试)
        const storageInfo = {
          hasEndpoint: !!process.env.STORAGE_ENDPOINT,
          hasRegion: !!process.env.STORAGE_REGION,
          hasAccessKey: !!process.env.STORAGE_ACCESS_KEY,
          hasSecretKey: !!process.env.STORAGE_SECRET_KEY,
          hasBucket: !!process.env.STORAGE_BUCKET,
          hasDomain: !!process.env.STORAGE_DOMAIN,
          endpoint: process.env.STORAGE_ENDPOINT ? "configured" : "missing",
          region: process.env.STORAGE_REGION || "auto",
          bucket: process.env.STORAGE_BUCKET ? "configured" : "missing",
          domain: process.env.STORAGE_DOMAIN ? "configured" : "missing",
        };

        return respData({
          status: "info",
          message: "Storage configuration info",
          storageInfo,
        });
      }

      default:
        return respErr(
          "Invalid action. Supported actions: test-connection, upload-video-from-url, create-test-video, get-storage-info"
        );
    }
  } catch (err) {
    console.error("R2 storage test failed:", err);
    return respErr("R2 storage test failed: " + (err as Error).message);
  }
}

export async function GET(req: Request) {
  try {
    // GET 请求用于快速检查存储配置状态
    const storageInfo = {
      hasEndpoint: !!process.env.STORAGE_ENDPOINT,
      hasRegion: !!process.env.STORAGE_REGION,
      hasAccessKey: !!process.env.STORAGE_ACCESS_KEY,
      hasSecretKey: !!process.env.STORAGE_SECRET_KEY,
      hasBucket: !!process.env.STORAGE_BUCKET,
      hasDomain: !!process.env.STORAGE_DOMAIN,
      configurationComplete: !!(
        process.env.STORAGE_ENDPOINT &&
        process.env.STORAGE_ACCESS_KEY &&
        process.env.STORAGE_SECRET_KEY &&
        process.env.STORAGE_BUCKET
      ),
    };

    return respData({
      status: "ready",
      message: "R2 storage test endpoint is ready",
      storageInfo,
      availableActions: [
        "test-connection",
        "upload-video-from-url",
        "create-test-video",
        "get-storage-info",
      ],
    });
  } catch (err) {
    console.error("R2 storage status check failed:", err);
    return respErr("R2 storage status check failed");
  }
}
