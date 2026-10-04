// New-panel wizard: Type -> Template -> Fan view -> Details. Fully interactive —
// selections persist, toggles and colour pickers update the live preview.
import { useState } from 'react';
import { T, TYPES, TEMPLATES, SECTIONS, type Draft, type Colors } from './studioData';
import { Ico } from './Ico';
import { FanPreview, contrast, readable } from './FanPreview';
import { btn } from './ConnectStudio';

const STEPS = ['Type', 'Template', 'Fan view', 'Details'];
const PRESETS: { key: string; label: string; colors: Colors }[] = [
  { key: 'home', label: 'Home colours', colors: { primary: '#DB0007', accent: '#B4A174', bg: '#EFEDEA' } },
  { key: 'away', label: 'Away colours', colors: { primary: '#15284B', accent: '#F5D130', bg: '#EDEFF2' } },
  { key: 'event', label: 'Event colours', colors: { primary: '#2E2A4F', accent: '#B4A174', bg: '#EFEDEA' } },
  { key: 'bolt', label: 'Bolt OS', colors: { primary: '#1C1A22', accent: '#8B3DF5', bg: '#FFFFFF' } },
];

export function NewPanel({ draft, setDraft, editing, onCancel, onSave, onDraft }: {
  draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; editing: boolean; onCancel: () => void; onSave: (d: Draft) => void; onDraft: () => void;
}) {
  const [step, setStep] = useState(editing ? 3 : 0); // editing opens straight on Details
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const sectionsOn = Object.values(draft.sections).filter(Boolean).length;
  const canNext = step === 3 ? draft.name.trim().length > 0 : true;
  const back = () => (step === 0 ? onCancel() : setStep(step - 1));
  const next = () => (step === 3 ? onSave(draft) : setStep(step + 1));
  const split = step >= 2; // steps 3 & 4 show the preview

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 68px)' }}>
      {/* header + stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onCancel} aria-label="Close" style={{ fontFamily: 'inherit', cursor: 'pointer', width: 44, height: 44, borderRadius: '50%', border: `1px solid ${T.line2}`, background: 'transparent', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico name="x" size={18} /></button>
          <b style={{ fontSize: 17 }}>{editing ? 'Edit panel' : 'New panel'}</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, color: i === step ? T.ink : i < step ? T.ink : T.muted, fontWeight: 600 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: i <= step ? T.purple : 'transparent', color: i <= step ? '#fff' : T.muted, border: `1px solid ${i <= step ? T.purple : T.line2}` }}>{i < step ? <Ico name="check" size={14} w={2.4} /> : i + 1}</span>
                {s}
              </span>
              {i < 3 && <span style={{ width: 54, height: 1, background: i < step ? T.purple : T.line, margin: '0 4px' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 40px' }}>
          {step === 0 && (
            <StepScaffold title="What kind of panel is this?" sub="A panel runs all season. You start a session in it each time it's on.">
              <CardGrid>
                {TYPES.map((t) => (
                  <SelectCard key={t.key} on={draft.type === t.key} onClick={() => set({ type: t.key })} icon={t.icon} label={t.label} sub={t.sub} />
                ))}
              </CardGrid>
            </StepScaffold>
          )}
          {step === 1 && (
            <StepScaffold title="Pick a template" sub="Templates set the colours and the starting sections. You can change everything next.">
              <CardGrid>
                {TEMPLATES.map((t) => (
                  <SelectCard key={t.key} on={draft.template === t.key} onClick={() => set({ template: t.key, colors: { ...t.colors } })} swatch={t.colors} label={t.label} sub={t.sub} />
                ))}
              </CardGrid>
            </StepScaffold>
          )}
          {step === 2 && (
            <StepScaffold title="Choose what fans see" sub="Toggle sections on or off. The preview builds the real fan view as you go.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, maxWidth: 740 }}>
                {SECTIONS.map((s) => {
                  const on = draft.sections[s.key];
                  return (
                    <button key={s.key} onClick={() => set({ sections: { ...draft.sections, [s.key]: !on } })}
                      style={{ fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, background: on ? T.purpleSoft : T.surface, border: `1px solid ${on ? T.purple : T.line}` }}>
                      <span style={{ width: 38, height: 38, borderRadius: '50%', flex: 'none', background: on ? T.purple : T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: on ? '#fff' : T.muted }}><Ico name={s.icon} size={18} /></span>
                      <span style={{ flex: 1 }}>
                        <b style={{ display: 'block', fontSize: 14, color: T.ink }}>{s.label}</b>
                        <span style={{ fontSize: 12, color: T.muted }}>{s.sub}</span>
                      </span>
                      <Toggle on={on} />
                    </button>
                  );
                })}
              </div>
              <div style={{ color: T.muted, marginTop: 18, fontSize: 13 }}>{sectionsOn} of 8 sections on. Each one you add appears in the preview as fans will see it.</div>
            </StepScaffold>
          )}
          {step === 3 && <Details draft={draft} set={set} />}
        </div>

        {split && (
          <aside style={{ width: 340, flex: 'none', borderLeft: `1px solid ${T.line}`, padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.muted, fontSize: 12, alignSelf: 'flex-end' }}><Ico name="eye" size={14} color={T.muted} />Fan view preview · {sectionsOn} sections</div>
            <FanPreview title={draft.name || 'Arsenal at Home'} colors={draft.colors} sections={draft.sections} />
          </aside>
        )}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', borderTop: `1px solid ${T.line}` }}>
        <button onClick={back} style={btn('ghost')}><Ico name="arrowL" size={16} />{step === 0 ? 'Cancel' : 'Back'}</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDraft} style={btn('ghost')}>Save as draft</button>
          <button onClick={next} style={{ ...btn('primary'), opacity: canNext ? 1 : 0.45, pointerEvents: canNext ? 'auto' : 'none' }}>{step === 3 ? (editing ? 'Save changes' : 'Create panel') : 'Continue'}</button>
        </div>
      </div>
    </div>
  );
}

function StepScaffold({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>{title}</h1>
      <div style={{ color: T.muted, marginBottom: 24 }}>{sub}</div>
      {children}
    </>
  );
}
function CardGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, maxWidth: 940 }}>{children}</div>;
}
function SelectCard({ on, onClick, icon, swatch, label, sub }: { on: boolean; onClick: () => void; icon?: string; swatch?: Colors; label: string; sub: string }) {
  return (
    <button onClick={onClick} style={{ fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', position: 'relative', padding: 22, borderRadius: 16, minHeight: 150, background: on ? T.purpleSoft : T.surface, border: `1px solid ${on ? T.purple : T.line}` }}>
      {on && <span style={{ position: 'absolute', right: 16, top: 16, width: 22, height: 22, borderRadius: '50%', background: T.purple, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico name="check" size={13} w={2.6} /></span>}
      {icon && <span style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? T.purple : T.surface2, color: on ? '#fff' : T.muted }}><Ico name={icon} size={20} /></span>}
      {swatch && <span style={{ display: 'flex', gap: 5 }}>{[swatch.primary, swatch.accent, swatch.bg].map((c, i) => <span key={i} style={{ width: 22, height: 22, borderRadius: 7, background: c, border: `1px solid ${T.line2}` }} />)}</span>}
      <b style={{ display: 'block', fontSize: 15, marginTop: 14, color: T.ink }}>{label}</b>
      <span style={{ display: 'block', fontSize: 12.5, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>{sub}</span>
    </button>
  );
}
function Toggle({ on }: { on: boolean }) {
  return (
    <span style={{ width: 44, height: 25, borderRadius: 999, flex: 'none', background: on ? T.purple : T.surface2, border: `1px solid ${on ? T.purple : T.line2}`, position: 'relative', transition: 'background .15s' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 21 : 2, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
    </span>
  );
}

// ---------------- Step 4: details ----------------
function Details({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  const c = draft.colors;
  const setColor = (k: keyof Colors, v: string) => set({ colors: { ...c, [k]: v } });
  const ratio = contrast(readable(c.accent), c.accent);
  const label: React.CSSProperties = { fontSize: 13, color: T.ink, fontWeight: 600, marginBottom: 9 };
  const input: React.CSSProperties = { width: '100%', height: 44, padding: '0 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.line}`, color: T.ink, font: 'inherit', outline: 'none', boxSizing: 'border-box' };
  return (
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>Name it and set the look</h1>
      <div style={{ color: T.muted, marginBottom: 24 }}>Try your own colours — the preview updates live.</div>
      <div style={{ maxWidth: 780, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', gap: 18 }}>
          <label style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={label}>Panel name</span><span style={{ fontSize: 11, color: T.muted }}>{draft.name.length} / 60</span></div>
            <input value={draft.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} placeholder="Arsenal at Home" style={input} />
          </label>
          <label style={{ flex: 1 }}>
            <div style={label}>Runs</div>
            <input value={draft.runs} onChange={(e) => set({ runs: e.target.value })} style={input} />
          </label>
        </div>
        <label>
          <div style={label}>Description <span style={{ color: T.muted, fontWeight: 400 }}>· shown to fans under the panel title</span></div>
          <textarea value={draft.desc} onChange={(e) => set({ desc: e.target.value })} rows={2} placeholder="Every home match at the Emirates: chat, predictions, polls and the shop." style={{ ...input, height: 70, padding: '12px 14px', resize: 'vertical', lineHeight: 1.5 }} />
        </label>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={label}>Colours</span>
            <button onClick={() => set({ colors: { ...PRESETS[0].colors } })} style={{ fontFamily: 'inherit', cursor: 'pointer', background: 'none', border: 0, color: T.purple, fontSize: 12, fontWeight: 600 }}>Reset to template</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {PRESETS.map((pr) => {
              const on = pr.colors.primary === c.primary && pr.colors.accent === c.accent;
              return (
                <button key={pr.key} onClick={() => set({ colors: { ...pr.colors } })} style={{ fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 19, background: on ? T.purpleSoft : 'transparent', border: `1px solid ${on ? T.purple : T.line}`, color: T.ink, fontSize: 12.5, fontWeight: 600 }}>
                  <span style={{ display: 'flex', gap: 3 }}>{[pr.colors.primary, pr.colors.accent, pr.colors.bg].map((x, i) => <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: x, border: `1px solid ${T.line2}` }} />)}</span>
                  {pr.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {([['primary', 'Primary', 'Header and hero'], ['accent', 'Accent', 'Buttons, badges, highlights'], ['bg', 'Background', 'Page behind the cards']] as const).map(([k, title, sub]) => (
              <div key={k} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: 16 }}>
                <b style={{ display: 'block', fontSize: 13 }}>{title}</b>
                <span style={{ display: 'block', fontSize: 11, color: T.muted, marginBottom: 12 }}>{sub}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ width: 44, height: 44, borderRadius: '50%', background: c[k], border: `1px solid ${T.line2}`, cursor: 'pointer', flex: 'none', position: 'relative', overflow: 'hidden' }}>
                    <input type="color" value={c[k]} onChange={(e) => setColor(k, e.target.value.toUpperCase())} style={{ position: 'absolute', inset: -4, opacity: 0, cursor: 'pointer' }} />
                  </label>
                  <input value={c[k]} onChange={(e) => setColor(k, e.target.value.toUpperCase())} style={{ ...input, height: 40, fontFamily: "'Geist Mono',ui-monospace,monospace" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: ratio >= 4.5 ? T.green : T.amber }}>
            <Ico name={ratio >= 4.5 ? 'check' : 'spark'} size={15} w={2.2} />
            {ratio >= 4.5 ? 'Button text is easy to read on your accent' : 'Button text may be hard to read on your accent'} ( {ratio.toFixed(1)} :1 )
          </div>
        </div>
      </div>
    </>
  );
}
