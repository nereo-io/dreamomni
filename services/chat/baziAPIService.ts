import {
  getCustomerBaziInfo,
  saveBaziAnalysis,
  getBaziAnalysis,
} from "@/models/customer";
import { BaziRequest, BaziResponse } from "@/types/interfaces";
import { CustomerInfo } from "@/types/customer";

export class BaziFastApiService {
  private static API_URL = "http://120.26.78.132:8000/bazi/analysis";

  static async analyzeBazi(request: BaziRequest): Promise<BaziResponse> {
    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as BaziResponse;
    } catch (error) {
      console.error("Bazi analysis error:", error);
      throw error;
    }
  }

  static async getAnalysisForCustomer(
    customer_info: CustomerInfo
  ): Promise<string> {
    const customerInfo: BaziRequest = {
      year: customer_info.birthYear,
      month: customer_info.birthMonth,
      day: customer_info.birthDay,
      hour: customer_info.birthHour,
      gender: customer_info.gender as "male" | "female",
    };
    const analysisResult = await this.analyzeBazi(customerInfo);

    // 保存分析结果
    if (analysisResult.status === "success") {
      // 如果 data 是数组，将其转换为字符串
      const analysisString = Array.isArray(analysisResult.data)
        ? analysisResult.data.join("\n") // 使用换行符连接数组元素
        : analysisResult.data;

      // await saveBaziAnalysis(customerId, analysisString);
    }

    return analysisResult.data;
  }
}
