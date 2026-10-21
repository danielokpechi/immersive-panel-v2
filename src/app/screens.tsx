'use client';
// The app's screens, loaded in the browser only. They are interactive demo apps
// that read window, localStorage and BroadcastChannel as they start, so they skip
// server prerendering (as they did as a Vite SPA). Each route's page.tsx renders
// one of these; Next code-splits each into its own chunk.
import dynamic from 'next/dynamic';

export const ConnectDemo = dynamic(() => import('../connect-demo/ConnectDemo'), { ssr: false });
export const ConnectStudio = dynamic(() => import('../cstudio/ConnectStudio'), { ssr: false });
export const ConnectApp = dynamic(() => import('../connect/ConnectApp'), { ssr: false });
export const PanelStudio = dynamic(() => import('../admin/PanelStudio').then((m) => m.PanelStudio), { ssr: false });
export const MatchdayFan = dynamic(() => import('../fan/MatchdayFan').then((m) => m.MatchdayFan), { ssr: false });
// Fictional-club copy of the City Studio and fan panel (src/voltford), so demos
// need not show Manchester City. The City screens above stay untouched.
export const VoltfordStudio = dynamic(() => import('../voltford/admin/PanelStudio').then((m) => m.PanelStudio), { ssr: false });
export const VoltfordFan = dynamic(() => import('../voltford/fan/MatchdayFan').then((m) => m.MatchdayFan), { ssr: false });
