import { EventFan } from '../../screens';
import { STATIC_IDS } from '../../../events/config';

// Connect Events fan view for one event: /events/<event-id>/.
export const metadata = { title: 'Connect Events' };
export function generateStaticParams() {
  return STATIC_IDS.map((id) => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventFan id={id} />;
}
