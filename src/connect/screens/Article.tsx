// Article — the "Read more" reading view opened from a Reads card. A real,
// back-navigable screen: hero image, standfirst, byline and the full body, with
// more stories from the Reads list at the end.
import { READS } from '../data'
import { useStore } from '../store'
import { Icon } from '../components/Icon'
import { Panel, BackHead } from '../components/ui'

export function Article({ articleId }: { articleId: string }) {
  const { toast, replace } = useStore()
  const a = READS.find((r) => r.id === articleId) ?? READS[0]
  const more = READS.filter((r) => r.id !== a.id).slice(0, 2)
  const share = () => toast('Article link copied')

  return (
    <Panel head={<BackHead title={a.tag} sub={a.ago} right={
      <button className="btn round" aria-label="Share article" onClick={share}><Icon name="share" size={15} /></button>
    } />}>
      <article style={{ fontFamily: 'var(--font-ui)' }}>
        {a.img && (
          <div style={{ position: 'relative' }}>
            <img src={a.img} alt="" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
            <span style={{ position: 'absolute', left: 16, top: 14, height: 22, padding: '0 10px', borderRadius: 11, background: 'var(--gold)', border: '1px solid var(--gold-dark)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{a.tag}</span>
          </div>
        )}
        <div style={{ padding: '16px 18px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.25, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{a.title}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--muted)' }}>{a.dek}</p>
          <div className="row xs muted" style={{ gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--line)' }}>
            <span>{a.author}</span><span>·</span><span>{a.ago}</span><span>·</span>
            <span className="row" style={{ gap: 4 }}><Icon name="clock" size={12} />3 min read</span>
          </div>
          {a.body.map((para, i) => (
            <p key={i} style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65 }}>{para}</p>
          ))}

          <div className="row" style={{ gap: 10, marginTop: 6 }}>
            <button className="btn gold grow" onClick={() => toast('Saved to your reads')}><Icon name="star" size={15} />Save</button>
            <button className="btn grow" onClick={share}><Icon name="share" size={15} />Share</button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, fontFamily: 'var(--font-display)' }}>More reads</div>
            <div className="col" style={{ gap: 10 }}>
              {more.map((r) => (
                <button key={r.id} onClick={() => replace({ name: 'article', articleId: r.id })}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', background: 'var(--tile)', border: 0, borderRadius: 12, padding: 10 }}>
                  {r.img && <img src={r.img} alt="" style={{ width: 74, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                  <span className="grow">
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, lineHeight: 1.35 }}>{r.title}</span>
                    <span className="xs muted" style={{ display: 'block', marginTop: 3 }}>{r.tag} · {r.ago}</span>
                  </span>
                  <Icon name="right" size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Panel>
  )
}
