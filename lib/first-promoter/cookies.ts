interface FirstPromoterCookieStore {
  get(name: string): { value?: string } | undefined;
}

export function getFirstPromoterCookies(cookieStore: FirstPromoterCookieStore) {
  return {
    trackingId: cookieStore.get('_fprom_tid')?.value || null,
    refId: cookieStore.get('_fprom_ref')?.value || null,
  };
}
