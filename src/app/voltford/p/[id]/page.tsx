import { VoltfordFan } from '../../../screens';
import { panelParams } from '../../panel-ids';

// Voltford fan surface, the shareable link.
export function generateStaticParams() {
  return [{ id: 'demo' }, ...panelParams()];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VoltfordFan id={id} />;
}
