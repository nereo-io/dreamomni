// Payssion 支付状态查询 API

import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { getPaymentRouter } from "@/services/payment";

export async function POST(req: Request) {
  try {
    const { transaction_id, order_no } = await req.json();
    
    // 验证用户权限
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("请先登录");
    }
    
    if (!transaction_id && !order_no) {
      return respErr("需要提供 transaction_id 或 order_no");
    }
    
    // 如果提供了 order_no，先查询对应的 transaction_id
    let queryTransactionId = transaction_id;
    
    if (!queryTransactionId && order_no) {
      const { getSupabaseClient } = await import("@/models/db");
      const supabase = getSupabaseClient();
      
      const { data: transactionData, error } = await supabase
        .from('payssion_transactions')
        .select('transaction_id')
        .eq('order_no', order_no)
        .single();
      
      if (error || !transactionData) {
        return respErr("未找到对应的交易记录");
      }
      
      queryTransactionId = transactionData.transaction_id;
    }
    
    // 使用支付路由器查询状态
    const paymentRouter = getPaymentRouter();
    const status = await paymentRouter.queryPayment('payssion', queryTransactionId!);
    
    return respData({
      transaction_id: status.transactionId,
      status: status.status,
      amount: status.amount,
      currency: status.currency,
      paid_amount: status.paidAmount,
      fee: status.fee,
      provider: status.paymentProvider,
    });
    
  } catch (error: any) {
    console.error("Payssion query error:", error);
    return respErr(`查询支付状态失败: ${error.message}`);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const transaction_id = url.searchParams.get('transaction_id');
    const order_no = url.searchParams.get('order_no');
    
    // 验证用户权限
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("请先登录");
    }
    
    if (!transaction_id && !order_no) {
      return respErr("需要提供 transaction_id 或 order_no 参数");
    }
    
    // 如果提供了 order_no，先查询对应的 transaction_id
    let queryTransactionId = transaction_id;
    
    if (!queryTransactionId && order_no) {
      const { getSupabaseClient } = await import("@/models/db");
      const supabase = getSupabaseClient();
      
      const { data: transactionData, error } = await supabase
        .from('payssion_transactions')
        .select('transaction_id')
        .eq('order_no', order_no)
        .single();
      
      if (error || !transactionData) {
        return respErr("未找到对应的交易记录");
      }
      
      queryTransactionId = transactionData.transaction_id;
    }
    
    // 使用支付路由器查询状态
    const paymentRouter = getPaymentRouter();
    const status = await paymentRouter.queryPayment('payssion', queryTransactionId!);
    
    return respData({
      transaction_id: status.transactionId,
      status: status.status,
      amount: status.amount,
      currency: status.currency,
      paid_amount: status.paidAmount,
      fee: status.fee,
      provider: status.paymentProvider,
    });
    
  } catch (error: any) {
    console.error("Payssion query error:", error);
    return respErr(`查询支付状态失败: ${error.message}`);
  }
}