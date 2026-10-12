import { ConnectApp } from '../../screens';

// Connect fan view (fictional Voltford Athletic) — the new panel going to market.
// Static export prerenders one page per club id.
export function generateStaticParams() {
  return [{ id: 'voltford' }];
}

export default function Page() {
  return <ConnectApp />;
}
