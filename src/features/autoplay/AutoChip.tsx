import { s } from '../../admin/s';

// Small "AUTO" indicator, pinned top-right of the panel. Visible while the
// scripted timeline is running; fades out while the user is interacting.
// Non-interactive (pointer-events:none) so it never blocks a tap.
export function AutoChip({ interacting }: { interacting: boolean }) {
  return (
    <div style={{
      ...s("position:absolute;top:52px;right:10px;z-index:60;display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:100px;background:rgba(10,20,32,.6);backdrop-filter:blur(6px);box-shadow:0 2px 10px rgba(0,10,28,.35);font:800 8.5px/1 'Kippax','Archivo';letter-spacing:.14em;color:#EAF1F8;pointer-events:none;transition:opacity .45s ease"),
      opacity: interacting ? 0 : 1,
    }}>
      <span style={{ ...s('width:6px;height:6px;border-radius:50%;background:#6CABDD'), animation: 'bgDot 1.6s ease-in-out infinite' }} />
      AUTO
    </div>
  );
}
