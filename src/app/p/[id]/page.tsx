import { MatchdayFan } from '../../screens';
import { panelParams } from '../../panel-ids';

// Fan surface, the shareable link. The "Matchday Companion v4" design.
export function generateStaticParams() {
  return [{ id: 'demo' }, ...panelParams()];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchdayFan id={id} />;
}
