import { Navigate, Route, Routes } from 'react-router-dom';
import { PanelStudio } from './admin/PanelStudio';
import { MatchdayFan } from './fan/MatchdayFan';

// The admin (Panel Studio) is a self-contained 5-screen app; each route
// just sets its start screen.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/studio" replace />} />
      <Route path="/studio" element={<PanelStudio start="dash" />} />
      <Route path="/studio/new" element={<PanelStudio start="wizard" />} />
      <Route path="/studio/:id/edit" element={<PanelStudio start="builder" />} />
      <Route path="/studio/:id/stats" element={<PanelStudio start="stats" />} />
      <Route path="/control/:id" element={<PanelStudio start="control" />} />
      {/* Fan surface — the shareable link. The "Matchday Companion v4" design. */}
      <Route path="/p/:id" element={<MatchdayFan />} />
      <Route path="*" element={<Navigate to="/studio" replace />} />
    </Routes>
  );
}
