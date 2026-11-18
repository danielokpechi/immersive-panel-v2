import { PogonStudio } from '../../../../screens';
import { panelParams } from '../../../panel-ids';

export const generateStaticParams = panelParams;

export default function Page() {
  return <PogonStudio start="stats" />;
}
