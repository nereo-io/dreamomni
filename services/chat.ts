export async function canAskFollowUpQuestion(): Promise<{
  canAsk: boolean;
  message?: string;
}> {
  try {
    const response = await fetch('/api/membership/check');
    const data = await response.json();
    
    if (data.code === 0 && data.data.isMember) {
      return {
        canAsk: true
      };
    }
    
    return {
      canAsk: false,
      message: '需要开通会员才可以追问'
    };
  } catch (error) {
    console.error('Check membership status failed:', error);
    return {
      canAsk: false,
      message: '检查会员状态失败'
    };
  }
} 