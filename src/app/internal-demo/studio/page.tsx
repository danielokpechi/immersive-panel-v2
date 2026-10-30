import type { Metadata } from 'next';
import { InternalStudio } from '../screens';

export const metadata: Metadata = { title: 'BoltOS Studio · Internal demo' };

// The internal demo's own Studio copy (tabbed match analytics). The Book a Demo
// embed keeps using /cstudio.
export default function Page() {
  return <InternalStudio />;
}
