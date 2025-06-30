import { useState, useEffect } from 'react';

interface SubscriptionDetails {
  nextBillingDate?: string;
  status?: string;
  amount?: number;
  currency?: string;
}

export function useSubscriptionDetails(subscriptionId: string | null) {
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subscriptionId) {
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/subscription/details?subscriptionId=${subscriptionId}`);
        const result = await response.json();

        if (result.code === 0) {
          setDetails(result.data);
        } else {
          setError(result.message || 'Failed to fetch details');
        }
      } catch (err) {
        setError('Network error');
        console.error('Error fetching subscription details:', err);
      } finally {
        setLoading(false);
      }
    };

    // 延迟执行，避免影响页面初始加载
    const timer = setTimeout(fetchDetails, 500);
    return () => clearTimeout(timer);
  }, [subscriptionId]);

  return { details, loading, error };
}