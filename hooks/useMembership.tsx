"use client";

import { useState, useEffect } from 'react';
import { Membership } from '@/types/membership';

export default function () {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoadingMembership, setIsLoadingMembership] = useState<boolean>(false);

  const checkMembership = async () => {
    // 防止重复请求
    if (isLoadingMembership) {
      console.log('Membership check already in progress, skipping...');
      return null;
    }
    
    setIsLoadingMembership(true);
    try {
      const response = await fetch('/api/membership/status');
      const data = await response.json();
      
      if (data.code === 0) {
        setMembership(data.data.membership);
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch membership status:', error);
      return null;
    } finally {
      setIsLoadingMembership(false);
    }
  };
  
  return {
    membership,
    isLoadingMembership,
    refreshMembership: checkMembership
  };
}