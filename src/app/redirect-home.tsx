'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sends the root and any unknown path to the Studio (the old SPA's catch-all).
// A static export has no server redirects, so this runs in the browser.
export function RedirectHome() {
  const router = useRouter();
  // Unknown Voltford paths stay in the Voltford Studio rather than landing on City.
  useEffect(() => { router.replace(window.location.pathname.includes('/voltford/') ? '/voltford/studio/' : '/studio/'); }, [router]);
  return null;
}
