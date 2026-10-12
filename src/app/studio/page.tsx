import { PanelStudio } from '../screens';

// The admin (Panel Studio) is a self-contained 5-screen app; each route
// just sets its start screen.
export default function Page() {
  return <PanelStudio start="dash" />;
}
