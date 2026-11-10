import { EventStudio } from '../../../screens';
import { STATIC_IDS } from '../../../../events/config';

// Connect Events organiser Studio for one event: /events/<event-id>/studio/.
export const metadata = { title: 'Studio · Connect Events' };
export function generateStaticParams() {
  return STATIC_IDS.map((id) => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventStudio id={id} />;
}
