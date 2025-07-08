/**
 * 火山引擎API客户端 - 通过代理服务器调用
 */
export class VolcengineClient {
  private proxyUrl: string;
  private proxySecret: string;
  private apiKey: string;

  constructor() {
    this.proxyUrl = process.env.PROXY_URL || "";
    this.proxySecret = process.env.PROXY_SECRET || "";
    this.apiKey = process.env.ARK_API_KEY || "";

    if (!this.proxyUrl || !this.proxySecret || !this.apiKey) {
      throw new Error(
        "Missing required environment variables: PROXY_URL, PROXY_SECRET, or ARK_API_KEY"
      );
    }
  }

  /**
   * 调用火山引擎API
   * @param {string} endpoint - API端点路径
   * @param {object} data - 请求数据
   * @param {string} method - HTTP方法
   * @param {object} headers - 自定义头部
   */
  async call(
    endpoint: string,
    data: any = {},
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
    headers: Record<string, string> = {}
  ): Promise<any> {
    try {
      const response = await fetch(`${this.proxyUrl}/api/volcengine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Proxy-Auth": this.proxySecret,
        },
        body: JSON.stringify({
          endpoint,
          apiKey: this.apiKey,
          data,
          method,
          headers,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }
        
        const errorMessage = errorData.error || errorData.proxyError || errorData.message || response.statusText;
        const errorString = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
        throw new Error(
          `Proxy API call failed: ${errorString}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Volcengine API call failed:", error);
      throw error;
    }
  }

  // 便捷方法
  async get(endpoint: string, headers: Record<string, string> = {}) {
    return this.call(endpoint, {}, "GET", headers);
  }

  async post(
    endpoint: string,
    data: any,
    headers: Record<string, string> = {}
  ) {
    return this.call(endpoint, data, "POST", headers);
  }

  async put(
    endpoint: string,
    data: any,
    headers: Record<string, string> = {}
  ) {
    return this.call(endpoint, data, "PUT", headers);
  }

  async delete(endpoint: string, headers: Record<string, string> = {}) {
    return this.call(endpoint, {}, "DELETE", headers);
  }
}

// 创建全局实例
export const volcengineClient = new VolcengineClient();