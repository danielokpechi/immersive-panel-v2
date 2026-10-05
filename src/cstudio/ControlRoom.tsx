// Control room — a live session. Moderate held chat, push activities to fans
// (with confirmation + a persistent Live state), create new activities, watch
// the live preview. End session returns to the dashboard.
import { useState } from 'react';
import { T, A, ACTIVITIES, type Panel } from './studioData';
import { Ico } from './Ico';
import { FanPreview } from './FanPreview';
import { btn, iconBtn, type Toast } from './ConnectStudio';

type Msg = { id: string; who: string; initials: string; color: string; text: string };
type Act = { key: string; label: string; sub: string; icon: string };
const SEED: Msg[] = [
  { id: 'm1', who: 'Karim.L', initials: 'KL', color: '#5B8DEF', text: 'Go Arsenal! Ready for the big clash!' },
  { id: 'm2', who: 'Mohamed A.', initials: 'MA', color: '#E0A43B', text: 'Our new signing is flying in training' },
  { id: 'm3', who: 'Fatima Z.', initials: 'FZ', color: '#3AA17A', text: 'Anyone at the Emirates? Let’s meet up!' },
  { id: 'm5', who: 'Lina Smith', initials: 'LS', color: '#C98A2B', text: 'Still buzzing from last week!' },
];
const NEW_TYPES = [
  { label: 'Poll', icon: 'poll' }, { label: 'Quiz', icon: 'spark' }, { label: 'Pick & Win', icon: 'target' }, { label: 'Sponsored', icon: 'flag' },
];

export function ControlRoom({ panel, toast, onBack, onSettings }: { panel: Panel; toast: Toast; onBack: () => void; onSettings: () => void }) {
  const [chat, setChat] = useState<Msg[]>(SEED);
  const [held, setHeld] = useState<Msg | null>({ id: 'h1', who: 'John Doe', initials: 'JD', color: '#4FB286', text: 'Ref is a total ******' });
  const [activities, setActivities] = useState<Act[]>(ACTIVITIES);
  const [live, setLive] = useState<Record<string, boolean>>({});
  const [composer, setComposer] = useState(false);
  const [ctype, setCtype] = useState('Poll');
  const [cq, setCq] = useState('');

  const approve = () => { if (held) { setChat((c) => [...c.slice(0, 3), { ...held, text: 'Ref is having a shocker tbh' }, ...c.slice(3)]); setHeld(null); toast('Message approved'); } };
  const togglePush = (a: Act) => {
    setLive((l) => {
      const now = !l[a.key];
      toast(now ? `${a.label} pushed to fans · 4,812 notified` : `${a.label} pulled from fans`);
      return { ...l, [a.key]: now };
    });
  };
  const createActivity = () => {
    const t = NEW_TYPES.find((x) => x.label === ctype)!;
    const key = 'a-' + Math.random().toString(36).slice(2, 6);
    const a: Act = { key, label: t.label, sub: cq.trim() || 'New activity', icon: t.icon };
    setActivities((xs) => [a, ...xs]);
    setLive((l) => ({ ...l, [key]: true }));
    toast(`${t.label} pushed to fans · 4,812 notified`);
    setComposer(false); setCq(''); setCtype('Poll');
  };

  const stat = (label: string, value: string) => (
    <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 13, color: T.muted }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 68px)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} aria-label="Back" style={iconBtn}><Ico name="arrowL" size={18} /></button>
          <img src={A('crest.png')} alt="" style={{ width: 36, height: 36 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <b style={{ fontSize: 18 }}>{panel.title}</b>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 10px', borderRadius: 11, background: T.green + '22', color: T.green, fontSize: 12, fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />Live</span>
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Control room · Session: v Chelsea · Sat 25 Oct</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSettings} style={btn('ghost')}><Ico name="gear" size={16} />Panel settings</button>
          <button onClick={() => { toast('Session ended'); onBack(); }} style={{ ...btn('ghost'), color: '#E5484D', borderColor: '#E5484D55' }}><Ico name="stop" size={15} />End session</button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* fan chat */}
        <div style={{ width: 320, flex: 'none', borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <b style={{ fontSize: 15 }}>Fan chat</b>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: T.purple }} />AI moderation on</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {held && (
              <div style={{ border: `1px solid #E5484D55`, background: '#E5484D11', borderRadius: 14, padding: 12 }}>
                <ChatRow m={held} note="Held by AI moderation" />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={approve} style={{ ...btn('ghost'), height: 32, flex: 1 }}>Approve</button>
                  <button onClick={() => { setHeld(null); toast('Message removed'); }} style={{ ...btn('ghost'), height: 32, flex: 1, color: '#E5484D', borderColor: '#E5484D55' }}>Remove</button>
                </div>
              </div>
            )}
            {chat.map((m) => <ChatRow key={m.id} m={m} />)}
          </div>
        </div>

        {/* push to fans */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
            {stat('Fans in panel', '4,812')}{stat('Poll votes', '1,284')}{stat('Messages / min', '312')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <b style={{ fontSize: 16 }}>Push to fans</b>
            <button onClick={() => setComposer(true)} style={btn('ghost')}><Ico name="plus" size={15} />New activity</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activities.map((a) => {
              const isLive = live[a.key];
              return (
                <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 14, background: T.surface, border: `1px solid ${isLive ? 'rgba(43,212,125,0.4)' : T.line}`, borderRadius: 14, padding: '14px 16px' }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted }}><Ico name={a.icon} size={18} /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontSize: 15 }}>{a.label}</b>
                      {isLive && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: T.green }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />LIVE ON FANS</span>}
                    </div>
                    <span style={{ fontSize: 13, color: T.muted }}>{a.sub}</span>
                  </div>
                  <button className="pushbtn" onClick={() => togglePush(a)} style={isLive
                    ? { fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 999, fontSize: 14, fontWeight: 600, background: 'rgba(43,212,125,0.14)', color: T.green, border: '1px solid rgba(43,212,125,0.5)' }
                    : { fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, background: 'transparent', color: T.purpleText, border: `1px solid ${T.purple}` }}>
                    {isLive ? <><Ico name="check" size={14} w={2.4} />Pushed · pull</> : 'Push to fans'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* preview */}
        <aside style={{ width: 300, flex: 'none', borderLeft: `1px solid ${T.line}`, padding: '20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.muted, fontSize: 13, alignSelf: 'flex-end' }}><Ico name="eye" size={14} color={T.muted} />Fan view preview</div>
          <FanPreview title={panel.title} colors={panel.colors} sections={panel.sections} />
        </aside>
      </div>

      {/* new activity composer */}
      {composer && (
        <div onClick={() => setComposer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: '100%', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <b style={{ fontSize: 18 }}>New activity</b>
              <button onClick={() => setComposer(false)} aria-label="Close" style={{ ...iconBtn, width: 34, height: 34 }}><Ico name="x" size={16} /></button>
            </div>
            <div style={{ fontSize: 13, color: T.muted, fontWeight: 600, marginBottom: 9 }}>Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {NEW_TYPES.map((t) => {
                const on = ctype === t.label;
                return <button key={t.label} onClick={() => setCtype(t.label)} style={{ fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 19, background: on ? T.purpleSoft : 'transparent', border: `1px solid ${on ? T.purple : T.line}`, color: T.ink, fontSize: 14, fontWeight: 600 }}><Ico name={t.icon} size={15} />{t.label}</button>;
              })}
            </div>
            <div style={{ fontSize: 13, color: T.muted, fontWeight: 600, marginBottom: 9 }}>Question</div>
            <input autoFocus value={cq} onChange={(e) => setCq(e.target.value)} placeholder="e.g. Who scores first for Arsenal?" style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, background: T.bg, border: `1px solid ${T.line}`, color: T.ink, font: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setComposer(false)} style={btn('ghost')}>Cancel</button>
              <button onClick={createActivity} style={btn('primary')}>Push to fans</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatRow({ m, note }: { m: Msg; note?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', flex: 'none', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{m.initials}</span>
      <div>
        <div style={{ fontSize: 13, color: T.muted }}>{m.who}{note && <span style={{ color: '#E5484D' }}> · {note}</span>}</div>
        <div style={{ fontSize: 14, marginTop: 2 }}>{m.text}</div>
      </div>
    </div>
  );
}
