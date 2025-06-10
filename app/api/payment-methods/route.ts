// 获取可用支付方式 API

import { respData, respErr } from "@/lib/resp";
import { getPaymentRouter } from "@/services/payment";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const countryCode = url.searchParams.get('country') || 'US';
    const userPreference = url.searchParams.get('preference') || undefined;
    
    const paymentRouter = getPaymentRouter();
    
    const location = {
      countryCode: countryCode.toUpperCase(),
      country: countryCode.toUpperCase(),
    };
    
    const availableMethods = paymentRouter.getAvailablePaymentMethods(location, userPreference);
    const availableProviders = paymentRouter.getAvailableProviders();
    
    return respData({
      methods: availableMethods,
      providers: availableProviders,
      location: location,
      recommendation: {
        provider: countryCode === 'RU' ? 'payssion' : 'stripe',
        reason: countryCode === 'RU' ? 'local_payment_methods' : 'global_coverage'
      }
    });
    
  } catch (error: any) {
    console.error("Get payment methods error:", error);
    return respErr(`获取支付方式失败: ${error.message}`);
  }
}

export async function POST(req: Request) {
  try {
    const { countryCode, userPreference } = await req.json();
    
    const paymentRouter = getPaymentRouter();
    
    const location = {
      countryCode: (countryCode || 'US').toUpperCase(),
      country: (countryCode || 'US').toUpperCase(),
    };
    
    const availableMethods = paymentRouter.getAvailablePaymentMethods(location, userPreference);
    const availableProviders = paymentRouter.getAvailableProviders();
    
    return respData({
      methods: availableMethods,
      providers: availableProviders,
      location: location,
      recommendation: {
        provider: location.countryCode === 'RU' ? 'payssion' : 'stripe',
        reason: location.countryCode === 'RU' ? 'local_payment_methods' : 'global_coverage'
      }
    });
    
  } catch (error: any) {
    console.error("Get payment methods error:", error);
    return respErr(`获取支付方式失败: ${error.message}`);
  }
}