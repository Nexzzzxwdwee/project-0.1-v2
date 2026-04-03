'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to /initialize?tab=signup, preserving any existing query params
  useEffect(() => {
    const tab = searchParams.get('tab') || 'signup';
    const next = searchParams.get('next');
    
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (next) {
      params.set('next', next);
    }
    
    router.replace(`/initialize?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <main style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        color: '#a8a29e'
      }}>
        Loading...
      </main>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
