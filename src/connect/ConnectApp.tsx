// Connect fan view (Voltford Athletic, a fictional club) — ported from the "Arsenal Fan Page 2"
// prototype and mounted at /c/:id. Self-contained: its own store, theme and
// screens. The club theme lives in theme.css (swap the :root tokens per club).
import { StoreProvider, useStore } from './store';
import { Home } from './screens/Home';
import { FanChat } from './screens/FanChat';
import { Iris } from './screens/Iris';
import { Shop } from './screens/Shop';
import { Article } from './screens/Article';
import { CrewDiscover, CrewHub, CrewSearch } from './screens/crew/Hub';
import { CrewChat } from './screens/crew/Chat';
import { EventDetail, EventForm, EventsList } from './screens/crew/Events';
import { CrewForm, CrewInfo, InviteLanding } from './screens/crew/Info';
import { SheetHost } from './screens/crew/Sheets';
import './theme.css';

function Screen() {
  const { route: r } = useStore();
  switch (r.name) {
    case 'home': return <Home />;
    case 'fanChat': return <FanChat />;
    case 'iris': return <Iris />;
    case 'shop': return <Shop />;
    case 'article': return <Article key={r.articleId} articleId={r.articleId} />;
    case 'crews': return <CrewHub />;
    case 'crewSearch': return <CrewSearch />;
    case 'crewDiscover': return <CrewDiscover />;
    case 'crewChat': return <CrewChat key={r.crewId} crewId={r.crewId} />;
    case 'crewInfo': return <CrewInfo crewId={r.crewId} />;
    case 'crewForm': return <CrewForm key={r.crewId ?? 'new'} crewId={r.crewId} />;
    case 'events': return <EventsList crewId={r.crewId} />;
    case 'event': return <EventDetail crewId={r.crewId} eventId={r.eventId} />;
    case 'eventForm': return <EventForm key={r.eventId ?? 'new'} crewId={r.crewId} eventId={r.eventId} />;
    case 'inviteLink': return <InviteLanding crewId={r.crewId} />;
  }
}

function Shell() {
  const { toastText } = useStore();
  return (
    // Desk → phone mockup on desktop; the media query in theme.css drops the
    // frame and fills the screen on real phones (like the Man City panel).
    <div className="connect-page">
      <div className="connect-phone">
        <main className="app">
          <Screen />
          <SheetHost />
          {toastText && <div className="toast" role="status">{toastText}</div>}
        </main>
      </div>
    </div>
  );
}

export default function ConnectApp() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
