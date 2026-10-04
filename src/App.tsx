import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PanelStudio } from './admin/PanelStudio';
import { MatchdayFan } from './fan/MatchdayFan';

// Connect fan view (ported "Arsenal Fan Page 2"). Lazy-loaded so its theme CSS
// and assets only load on /c/:id, never on the operator or existing panel.
const ConnectApp = lazy(() => import('./connect/ConnectApp'));
// Connect Studio — the functional BoltOS operator (React). Assets are reused
// from public/connect-studio/assets/. Lazy-loaded.
const ConnectStudio = lazy(() => import('./cstudio/ConnectStudio'));
// Connect demo — operator + Arsenal fan view side by side with a scripted cursor.
const ConnectDemo = lazy(() => import('./connect-demo/ConnectDemo'));

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
      {/* Fan surface, the shareable link. The "Matchday Companion v4" design. */}
      <Route path="/p/:id" element={<MatchdayFan />} />
      {/* Connect fan view (simple, Arsenal) — the new panel going to market. */}
      <Route path="/c/:id" element={<Suspense fallback={null}><ConnectApp /></Suspense>} />
      {/* Connect Studio — the functional BoltOS operator. */}
      <Route path="/cstudio" element={<Suspense fallback={null}><ConnectStudio /></Suspense>} />
      {/* Connect demo — the connect.boltos.ai showcase (operator + fan, self-driving). */}
      <Route path="/connect-demo" element={<Suspense fallback={null}><ConnectDemo /></Suspense>} />
      <Route path="*" element={<Navigate to="/studio" replace />} />
    </Routes>
  );
}
