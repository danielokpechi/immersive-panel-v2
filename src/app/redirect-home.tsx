'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sends the root and any unknown path to the Studio (the old SPA's catch-all).
// A static export has no server redirects, so this runs in the browser.
export function RedirectHome() {
  const router = useRouter();
  useEffect(() => { router.replace('/studio/'); }, [router]);
  return null;
}
