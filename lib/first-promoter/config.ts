export interface FirstPromoterConfig {
  accountId: string;
  apiKey: string;
}

export function getFirstPromoterConfig(): FirstPromoterConfig | null {
  const accountId =
    process.env.NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID?.trim() || '';
  const apiKey = process.env.FIRST_PROMOTER_API_KEY?.trim() || '';

  if (!accountId || !apiKey) {
    return null;
  }

  return {
    accountId,
    apiKey,
  };
}
