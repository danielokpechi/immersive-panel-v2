'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sends the root and any unknown path to the Studio (the old SPA's catch-all).
// A static export has no server redirects, so this runs in the browser.
export function RedirectHome() {
  const router = useRouter();
  // Unknown Voltford paths stay in the Voltford Studio rather than landing on City.
  useEffect(() => { const path = window.location.pathname;
    router.replace(path.includes('/pogon/') ? '/pogon/studio/' : path.includes('/voltford/') ? '/voltford/studio/' : '/studio/'); }, [router]);
  return null;
}
