import { VoltfordStudio } from '../../screens';

// The Voltford copy of the Panel Studio; each route just sets its start screen.
export default function Page() {
  return <VoltfordStudio start="dash" />;
}
