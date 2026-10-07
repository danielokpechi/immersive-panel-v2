// Shop — the full official store, opened from the Home "Shop" section. A real
// screen (back-navigable, scrollable) rather than a card strip: a two-up grid of
// products with ratings and a Buy action that drops into the basket toast.
import { PRODUCTS, type Product } from '../data'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { Panel, BackHead } from '../components/ui'

export function Shop() {
  const { toast } = useStore()
  const add = (_p: Product) => toast('✓  Added to basket')
  return (
    <Panel head={<BackHead title="Shop" sub="Official Voltford store" />}>
      <div style={{ padding: '14px 16px 24px', fontFamily: 'var(--font-ui)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Matchday drop</div>
          <span className="xs muted">{PRODUCTS.length} items</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {PRODUCTS.map((p) => (
            <div key={p.id} style={{ background: 'var(--tile)', borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ position: 'relative' }}>
                <img src={p.img} alt="" style={{ width: '100%', height: 128, objectFit: 'cover', borderRadius: 8, background: '#fff' }} />
                {p.badge && <span style={{ position: 'absolute', left: 8, top: 8, height: 20, padding: '0 8px', borderRadius: 10, background: 'var(--gold)', border: '1px solid var(--gold-dark)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{p.badge}</span>}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.35, minHeight: 36 }}>{p.name}</div>
              <div className="xs muted">★★★★ {p.reviews}</div>
              <div><span style={{ fontSize: 12 }}>£</span><span style={{ fontSize: 20, fontWeight: 500 }}>{p.price.toFixed(2)}</span></div>
              <button className="btn gold" onClick={() => add(p)}><Icon name="upright" size={15} />Buy now</button>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
