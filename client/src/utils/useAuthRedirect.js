'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Shared login/signup redirect contract:
// - read ?redirect=/target/path
// - after success navigate to target (else /)
// - if already authenticated and user visits /login or /signup, redirect away
export const useAuthRedirect = (isAuthenticated) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTarget = useMemo(() => {
    const raw = searchParams?.get('redirect');
    if (!raw) return '/';
    // Only allow same-origin app paths.
    if (!raw.startsWith('/')) return '/';
    return raw;
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTarget || '/');
    }
  }, [isAuthenticated, redirectTarget, router]);

  return { redirectTarget };
};

