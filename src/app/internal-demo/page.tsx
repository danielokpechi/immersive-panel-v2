import type { Metadata } from 'next';
import { InternalDemo } from './screens';

export const metadata: Metadata = { title: 'BoltOS Connect · Internal demo' };

// Internal demo — the standalone, full-window Connect demo for sales calls and
// walkthroughs (stoppable autoplay, manual stepping, ends on analytics).
export default function Page() {
  return <InternalDemo />;
}
