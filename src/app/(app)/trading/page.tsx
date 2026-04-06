'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TradingIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/trading/dashboard');
  }, [router]);
  return null;
}
