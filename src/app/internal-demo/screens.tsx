'use client';
// The internal demo's screens, loaded in the browser only (they read window and
// drive iframes as they start), the same way src/app/screens.tsx does for the app.
import dynamic from 'next/dynamic';

export const InternalDemo = dynamic(() => import('../../internal-demo/InternalDemo'), { ssr: false });
export const InternalStudio = dynamic(() => import('../../internal-demo/studio/ConnectStudio'), { ssr: false });
