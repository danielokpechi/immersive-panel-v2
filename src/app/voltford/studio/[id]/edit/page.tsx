import { VoltfordStudio } from '../../../../screens';
import { panelParams } from '../../../panel-ids';

export const generateStaticParams = panelParams;

export default function Page() {
  return <VoltfordStudio start="builder" />;
}
