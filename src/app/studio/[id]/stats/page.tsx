import { PanelStudio } from '../../../screens';
import { panelParams } from '../../../panel-ids';

export const generateStaticParams = panelParams;

export default function Page() {
  return <PanelStudio start="stats" />;
}
