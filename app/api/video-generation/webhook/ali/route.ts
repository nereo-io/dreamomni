import { respData, respErr } from "@/lib/resp";
import {
  getVideoGenerationByAliRequestId,
  updateVideoGenerationByAliRequestId,
} from "@/models/videoGeneration";
import { newStorage } from "@/lib/storage";
import { getVideoModel, VideoModelProvider, calculateCredits } from "@/config/video-models";
import { increaseCredits, CreditsTransType } from "@/services/credit";

export async function POST(req: Request) {
  try {
    const webhookData = await req.json();
    
    console.log("收到阿里云 webhook 回调:", JSON.stringify(webhookData, null, 2));
    
    // 从webhook数据中提取关键信息
    const data = webhookData.data;
    if (!data || !data.task_id) {
      return respErr("无效的 webhook 数据格式: 缺少 task_id");
    }
    
    const request_id = data.task_id;
    const task_status = data.task_status;
    
    // 查找对应的数据库记录
    const videoGeneration = await getVideoGenerationByAliRequestId(request_id);
    
    if (!videoGeneration) {
      console.warn(`未找到对应的视频生成记录: ${request_id}`);
      return respData({
        message: "记录未找到，但webhook已处理",
        request_id,
      });
    }
    
    // 处理不同的状态
    switch (task_status) {
      case "SUCCEEDED":
        console.log(`视频生成完成，请求ID: ${request_id}`);
        
        try {
          // 1. 通过status接口获取视频URL
          const AliProvider = (await import("@/services/providers/AliProvider")).AliProvider;
          const provider = new AliProvider(process.env.ALI_API_KEY!);
          const result = await provider.result(videoGeneration.model_id, request_id);
          
          if (!result.video_url) {
            throw new Error("无法获取视频URL");
          }
          
          // 2. 上传到R2（带重试机制）
          let r2VideoUrl = null;
          const maxRetries = 3;
          const retryDelay = 10000; // 10秒
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const storage = newStorage();
              const fileName = `videos/${videoGeneration.id}-${Date.now()}.mp4`;
              
              const uploadResult = await storage.downloadAndUpload({
                url: result.video_url,
                key: fileName,
                contentType: "video/mp4",
              });
              
              r2VideoUrl = uploadResult.url;
              console.log(`视频已上传到R2: ${r2VideoUrl} (第${attempt}次尝试)`);
              break; // 成功后跳出重试循环
            } catch (uploadError) {
              console.error(
                `R2上传失败 (第${attempt}/${maxRetries}次尝试):`,
                uploadError
              );
              
              if (attempt === maxRetries) {
                console.error("R2上传达到最大重试次数，使用原始URL");
              } else {
                // 等待后重试
                console.log(`${retryDelay}ms后进行第${attempt + 1}次重试...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
              }
            }
          }
          
          // 3. 更新数据库
          const updateParams: any = {
            status: r2VideoUrl ? "SAVED_TO_R2" : "COMPLETED",
            video_url_r2: r2VideoUrl || undefined,
            video_url_ali: result.video_url,
            logs: [],
            metrics: {
              start_time: data.start_time,
              end_time: data.end_time,
            },
          };
          
          await updateVideoGenerationByAliRequestId(request_id, updateParams);
          
          return respData({
            message: "视频生成完成并已保存",
            request_id,
            video_url: r2VideoUrl || result.video_url,
            r2_uploaded: !!r2VideoUrl,
          });
        } catch (processError) {
          console.error("处理完成状态失败:", processError);
          
          // 更新为失败状态
          const failureParams = {
            status: "FAILED" as const,
            error_message: `处理失败: ${
              processError instanceof Error
                ? processError.message
                : String(processError)
            }`,
            logs: [],
          };
          
          await updateVideoGenerationByAliRequestId(request_id, failureParams);
          
          return respErr(
            `处理完成状态失败: ${
              processError instanceof Error
                ? processError.message
                : String(processError)
            }`
          );
        }
        
      case "FAILED":
        console.error(`Video generation failed, request ID: ${request_id}`);
        
        const errorParams = {
          status: "FAILED" as const,
          error_message: "Video generation failed",
          logs: [],
        };
        
        await updateVideoGenerationByAliRequestId(request_id, errorParams);
        
        // // 处理积分返还
        // try {
        //   // 计算需要返还的积分
        //   const requiredCredits = calculateCredits(
        //     videoGeneration.model_id,
        //     videoGeneration.duration_seconds || 5,
        //     videoGeneration.has_audio || false,
        //     "1080p" // 默认分辨率，因为数据库中可能没有存储分辨率信息
        //   );
          
        //   // 为退还的积分设置一个合理的过期时间（1个月后）
        //   const oneMonthFromNow = new Date();
        //   oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        //   const expiredAt = oneMonthFromNow.toISOString();
          
        //   // 返还积分
        //   await increaseCredits({
        //     user_uuid: videoGeneration.user_id,
        //     trans_type: CreditsTransType.RefundVideoGenerationFailed,
        //     credits: requiredCredits,
        //     expired_at: expiredAt,
        //   });
          
        //   console.log(
        //     `已返还用户 ${videoGeneration.user_id} 的 ${requiredCredits} 积分（阿里云生成失败）`
        //   );
        // } catch (refundError) {
        //   console.error("返还积分失败:", refundError);
        //   // 不抛出错误，继续处理
        // }
        
        return respData({
          message: "Video generation failed",
          request_id,
          error: "Video generation failed",
        });
              
      default:
        console.log(`未知状态，请求ID: ${request_id}，状态: ${task_status}`);
        
        return respData({
          message: "收到状态更新",
          request_id,
          status: task_status,
        });
    }
  } catch (error) {
    console.error("处理阿里云 webhook 失败:", error);
    
    let errorMessage = "处理 webhook 失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return respErr(errorMessage);
  }
}
