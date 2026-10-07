import { useRef, useState } from 'react'
import { A, PRODUCTS, READS } from '../data'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { Hero } from '../components/ui'
import { ChatLine, FanComposer } from './FanChat'

export function Home() {
  const { s, push, d, toast } = useStore()
  const recent = s.fanChat.slice(-3)
  const shop = useRef<HTMLDivElement>(null)
  const reads = useRef<HTMLDivElement>(null)
  const scrollBy = (el: HTMLDivElement | null, dir: number) => el?.scrollBy({ left: dir * 200, behavior: 'smooth' })
  const [joined, setJoined] = useState(false)

  return (
    <div className="scroll" style={{ position: 'absolute', inset: 0, fontFamily: 'var(--font-display)' }}>
      <Hero />
      <section aria-label="Fan chat" style={{ margin: '-66px 13px 0', position: 'relative', background: 'var(--card)', borderRadius: 22,
        border: '1px solid #e3dfd9', boxShadow: '0 6px 20px rgba(0,0,0,.1)', overflow: 'hidden', fontFamily: 'var(--font-ui)' }}>
        <div className="row" style={{ justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          <div className="row" style={{ gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold)', border: '1px solid var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chat" /></span>
            <div><div className="p" style={{ fontWeight: 500 }}>Fan Chat</div><div className="xs muted">312 fans active</div></div>
          </div>
          <button className="btn" style={{ width: 50, height: 34, padding: 0 }} aria-label="Expand chat" onClick={() => push({ name: 'fanChat' })}><Icon name="expand" /></button>
        </div>
        <div className="col" style={{ gap: 14, padding: '16px 16px 4px', maxHeight: 300, overflow: 'hidden' }}>
          {recent.map((m) => <ChatLine key={m.id} m={m} />)}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}><FanComposer onSend={(t) => d({ type: 'fanSend', text: t })} /></div>
      </section>

      {/* Crew entry banner */}
      <section aria-label="Crews" style={{ position: 'relative', margin: '14px 13px 0', height: 150, borderRadius: 20, overflow: 'hidden', background: '#141312' }}>
        <img src={A('hero.jpg')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,19,18,.94), rgba(20,19,18,.78) 55%, rgba(20,19,18,.35))' }} />
        <div style={{ position: 'absolute', left: 18, top: 16, right: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--gold)' }}>NEW · CREWS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f3efe7', lineHeight: 1.3 }}>Find your crew</div>
          <div style={{ fontSize: 13.5, color: '#d9d2c6' }}>Small fan groups that plan matchdays together.</div>
        </div>
        <button className="btn gold" style={{ position: 'absolute', right: 16, bottom: 16, fontWeight: 700 }} onClick={() => push({ name: 'crews' })}>
          Join Crew<Icon name="right" size={15} stroke={2} />
        </button>
      </section>

      <Carousel title="Shop" refEl={shop} onTitle={() => push({ name: 'shop' })} onPrev={() => scrollBy(shop.current, -1)} onNext={() => scrollBy(shop.current, 1)}>
        {PRODUCTS.slice(0, 3).map((p) => (
          <div key={p.id} style={{ flex: '0 0 182px', background: 'var(--tile)', borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <img src={p.img} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, background: '#fff' }} />
            <div style={{ fontSize: 13, minHeight: 36 }}>{p.name}</div>
            <div className="xs muted">★★★★ {p.reviews}</div>
            <div><span style={{ fontSize: 12 }}>£</span><span style={{ fontSize: 22, fontWeight: 500 }}>{p.price.toFixed(2)}</span></div>
            <button className="btn gold" onClick={() => toast('✓  Added to basket')}><Icon name="upright" size={15} />Buy now</button>
          </div>
        ))}
      </Carousel>

      <img src={A('sponsor-banner.jpg')} alt="Strata: Move faster" style={{ margin: '20px 13px 0', width: 'calc(100% - 26px)', height: 'auto', borderRadius: 4 }} />

      <Carousel title="Reads" refEl={reads} onTitle={() => push({ name: 'article', articleId: READS[0].id })} onPrev={() => scrollBy(reads.current, -1)} onNext={() => scrollBy(reads.current, 1)}>
        {READS.map((r) => (
          <button key={r.id} onClick={() => push({ name: 'article', articleId: r.id })}
            style={{ flex: '0 0 260px', textAlign: 'left', background: 'var(--tile)', border: 0, borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-between' }}>
            {r.img && <img src={r.img} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />}
            <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.35 }}>{r.title}</div>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="xs muted"><u>{r.tag}</u> · {r.ago}</div>
              <span className="xs" style={{ color: 'var(--gold-dark)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>Read<Icon name="right" size={13} stroke={2} /></span>
            </div>
          </button>
        ))}
      </Carousel>

      <img src={A('membership.jpg')} alt="Volts 2026–27 membership now open" style={{ marginTop: 40, width: '100%', height: 'auto' }} />
      <div className="col" style={{ alignItems: 'center', gap: 14, padding: '18px 40px 26px', textAlign: 'center' }}>
        <div style={{ fontSize: 16 }}>Claim 30% off to your membership renewal!</div>
        <button className="btn gold" onClick={() => { setJoined(true); toast('Discount applied to your renewal') }} disabled={joined}>
          <Icon name={joined ? 'check' : 'upright'} size={15} />{joined ? 'Claimed' : 'Claim now'}
        </button>
      </div>
      <footer className="col" style={{ background: '#1c1b1a', alignItems: 'center', padding: '26px 0 40px', gap: 30 }}>
        <img src={A('crest.png')} alt="Voltford Athletic crest" width={84} height={84} />
        <div className="row" style={{ gap: 14 }}>
          {[['facebook', 'Facebook'], ['x', 'X'], ['youtube', 'YouTube'], ['instagram', 'Instagram']].map(([f, l]) => (
            <a key={f} href="#" aria-label={l} onClick={(e) => e.preventDefault()}><img src={A(`${f}.png`)} alt="" width={30} height={30} /></a>
          ))}
        </div>
        <div className="row" style={{ gap: 6, fontSize: 10, color: '#5e5a55' }}>Powered by <img src={A('bolt-os-logo.png')} alt="BOLT OS" width={43} height={10} /></div>
        <button className="btn sm" style={{ color: '#8a847e', borderColor: '#3a3734' }} onClick={() => { d({ type: 'reset' }); toast('Demo data reset') }}>
          <Icon name="refresh" size={13} />Reset demo data
        </button>
      </footer>
    </div>
  )
}

function Carousel({ title, children, onPrev, onNext, refEl, onTitle }: { title: string; children: React.ReactNode; onPrev: () => void; onNext: () => void; refEl: React.RefObject<HTMLDivElement | null>; onTitle?: () => void }) {
  return (
    <section aria-label={title} style={{ marginTop: 26 }}>
      <div className="row" style={{ justifyContent: 'space-between', padding: '0 22px' }}>
        {onTitle
          ? <button onClick={onTitle} style={{ border: 0, background: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'inherit' }}>{title}<Icon name="right" size={20} /></button>
          : <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{title}</h2>}
        <div className="row" style={{ gap: 14 }}>
          <button className="btn round" aria-label={`Previous ${title}`} onClick={onPrev}><Icon name="left" /></button>
          <button className="btn round" aria-label={`Next ${title}`} onClick={onNext}><Icon name="right" /></button>
        </div>
      </div>
      <div ref={refEl} className="hscroll" style={{ gap: 15, padding: '12px 22px 0', scrollPaddingLeft: 22 }}>{children}</div>
    </section>
  )
}
