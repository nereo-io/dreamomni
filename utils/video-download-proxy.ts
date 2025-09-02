/**
 * 视频下载代理客户端 - 通过搬瓦工代理服务器下载视频
 */
export class VideoDownloadProxy {
  private proxyUrl: string;
  private proxySecret: string;

  constructor() {
    this.proxyUrl = process.env.PROXY_URL || "";
    this.proxySecret = process.env.PROXY_SECRET || "";
  }

  /**
   * 通过代理下载视频并返回Buffer
   * @param url 视频URL
   * @returns Promise<Buffer>
   */
  async downloadVideo(url: string): Promise<Buffer> {
    if (!this.proxyUrl || !this.proxySecret) {
      throw new Error("Proxy not configured");
    }
    try {
      const response = await fetch(`${this.proxyUrl}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Proxy-Auth": this.proxySecret,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }

        const errorMessage =
          errorData.error ||
          errorData.message ||
          response.statusText;
        const errorString =
          typeof errorMessage === "object"
            ? JSON.stringify(errorMessage)
            : errorMessage;
        
        throw new Error(
          `Proxy video download failed: ${errorString}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Video download proxy failed:", error);
      throw error;
    }
  }
}

// 创建全局实例
export const videoDownloadProxy = new VideoDownloadProxy();