// 订阅管理服务 - 处理订阅升级时取消其他订阅的自动续费

import { getPaymentRouter } from "@/services/payment";
import {
  findActiveSubscriptionsByUserUuid,
  updateSubscriptionStatus,
  type Subscription,
} from "@/models/subscription";
import {
  findActiveCreemSubscriptionsByUserUuid,
  updateCreemSubscriptionStatus,
  type CreemSubscription,
} from "@/models/creem-subscription";

// 日志函数
function logInfo(message: string, data?: any) {
  console.log(
    `[SUBSCRIPTION-MGMT] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

function logError(message: string, data?: any) {
  console.error(
    `[SUBSCRIPTION-MGMT] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

export interface CancelResult {
  success: boolean;
  canceledCount: number;
  failedCount: number;
  details: {
    provider: "payssion" | "creem";
    subscriptionId: string;
    success: boolean;
    error?: string;
  }[];
}

export class SubscriptionManagementService {
  /**
   * 取消用户其他活跃订阅的自动续费
   * 新订阅成功后调用此方法，取消用户其他所有活跃订阅
   *
   * @param userUuid 用户UUID
   * @param excludeSubscriptionId 新订阅ID（排除，不取消）
   * @param excludeProvider 新订阅的提供商
   */
  static async cancelOtherSubscriptions(
    userUuid: string,
    excludeSubscriptionId: string,
    excludeProvider: "payssion" | "creem"
  ): Promise<CancelResult> {
    const result: CancelResult = {
      success: true,
      canceledCount: 0,
      failedCount: 0,
      details: [],
    };

    logInfo("🔄 开始取消用户其他订阅的自动续费", {
      userUuid,
      excludeSubscriptionId,
      excludeProvider,
    });

    try {
      // 1. 获取用户所有活跃的 Payssion 订阅
      const payssionSubscriptions = await findActiveSubscriptionsByUserUuid(userUuid);
      logInfo(`📋 找到 ${payssionSubscriptions.length} 个活跃的 Payssion 订阅`);

      // 2. 获取用户所有活跃的 Creem 订阅
      const creemSubscriptions = await findActiveCreemSubscriptionsByUserUuid(userUuid);
      logInfo(`📋 找到 ${creemSubscriptions.length} 个活跃的 Creem 订阅`);

      // 3. 取消 Payssion 订阅（排除新订阅）
      for (const subscription of payssionSubscriptions) {
        // 排除新订阅
        if (
          excludeProvider === "payssion" &&
          subscription.payssion_subscription_id === excludeSubscriptionId
        ) {
          logInfo(`⏭️ 跳过新订阅: ${subscription.payssion_subscription_id}`);
          continue;
        }

        const cancelResult = await this.cancelPayssionSubscription(subscription);
        result.details.push(cancelResult);

        if (cancelResult.success) {
          result.canceledCount++;
        } else {
          result.failedCount++;
        }
      }

      // 4. 取消 Creem 订阅（排除新订阅）
      for (const subscription of creemSubscriptions) {
        // 排除新订阅
        if (
          excludeProvider === "creem" &&
          subscription.creem_subscription_id === excludeSubscriptionId
        ) {
          logInfo(`⏭️ 跳过新订阅: ${subscription.creem_subscription_id}`);
          continue;
        }

        const cancelResult = await this.cancelCreemSubscription(subscription);
        result.details.push(cancelResult);

        if (cancelResult.success) {
          result.canceledCount++;
        } else {
          result.failedCount++;
        }
      }

      logInfo("✅ 取消其他订阅完成", {
        canceledCount: result.canceledCount,
        failedCount: result.failedCount,
      });

      return result;
    } catch (error: any) {
      logError("❌ 取消其他订阅时发生错误", error.message);
      result.success = false;
      return result;
    }
  }

  /**
   * 取消单个 Payssion 订阅
   */
  private static async cancelPayssionSubscription(
    subscription: Subscription
  ): Promise<CancelResult["details"][0]> {
    const subscriptionId = subscription.payssion_subscription_id;

    logInfo(`🚫 正在取消 Payssion 订阅: ${subscriptionId}`);

    try {
      // 调用 Payssion API 取消订阅
      const paymentRouter = getPaymentRouter();
      const apiSuccess = await paymentRouter.cancelSubscription(
        "payssion",
        subscriptionId
      );

      if (!apiSuccess) {
        logError(`⚠️ Payssion 订阅 ${subscriptionId} API 取消失败，跳过本地状态更新`);
        return {
          provider: "payssion",
          subscriptionId,
          success: false,
          error: "API cancellation failed",
        };
      }

      logInfo(`✅ Payssion 订阅 ${subscriptionId} API 取消成功`);

      // 仅在 API 成功时更新本地数据库状态为 canceled
      await updateSubscriptionStatus(subscriptionId, "canceled");
      logInfo(`✅ Payssion 订阅 ${subscriptionId} 本地状态已更新为 canceled`);

      return {
        provider: "payssion",
        subscriptionId,
        success: true,
      };
    } catch (error: any) {
      logError(`❌ 取消 Payssion 订阅 ${subscriptionId} 失败`, error.message);
      return {
        provider: "payssion",
        subscriptionId,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 取消单个 Creem 订阅
   */
  private static async cancelCreemSubscription(
    subscription: CreemSubscription
  ): Promise<CancelResult["details"][0]> {
    const subscriptionId = subscription.creem_subscription_id;

    logInfo(`🚫 正在取消 Creem 订阅: ${subscriptionId}`);

    try {
      // 调用 Creem API 取消订阅
      const paymentRouter = getPaymentRouter();
      const apiSuccess = await paymentRouter.cancelSubscription(
        "creem",
        subscriptionId
      );

      if (!apiSuccess) {
        logError(`⚠️ Creem 订阅 ${subscriptionId} API 取消失败，跳过本地状态更新`);
        return {
          provider: "creem",
          subscriptionId,
          success: false,
          error: "API cancellation failed",
        };
      }

      logInfo(`✅ Creem 订阅 ${subscriptionId} API 取消成功`);

      // 仅在 API 成功时更新本地数据库状态为 canceled
      await updateCreemSubscriptionStatus(subscriptionId, "canceled");
      logInfo(`✅ Creem 订阅 ${subscriptionId} 本地状态已更新为 canceled`);

      return {
        provider: "creem",
        subscriptionId,
        success: true,
      };
    } catch (error: any) {
      logError(`❌ 取消 Creem 订阅 ${subscriptionId} 失败`, error.message);
      return {
        provider: "creem",
        subscriptionId,
        success: false,
        error: error.message,
      };
    }
  }
}
