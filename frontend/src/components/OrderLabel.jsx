export function BrandMark({ className = 'w-6 h-6', tone = 'ink' }) {
  const base = tone === 'signal' ? 'bg-signal' : 'bg-ink'
  const band = tone === 'signal' ? 'bg-ink' : 'bg-signal'
  return (
    <span className={`relative inline-block flex-shrink-0 ${base} ${className}`} aria-hidden="true">
      <span className={`absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 ${band}`} />
    </span>
  )
}

// Deterministic barcode drawn from the tracking number
function Barcode({ value }) {
  const bars = []
  let x = 0
  for (let i = 0; i < 48; i++) {
    const c = value.charCodeAt(i % value.length)
    const w = ((c * (i + 3)) % 3) + 1
    if (i % 2 === 0) {
      bars.push(<rect key={i} x={x} y="0" width={w} height="34" fill="#16181D" />)
    }
    x += w
  }
  return (
    <svg viewBox={`0 0 ${x} 34`} className="h-9 w-full" preserveAspectRatio="none" aria-hidden="true">
      {bars}
    </svg>
  )
}

export default function OrderLabel({ order, sample = false, compact = false, notchClass = 'bg-signal', className = '' }) {
  const stops = order.stops
  const doneCount = stops.filter(s => s.done).length
  const progress = stops.length > 1 ? Math.max(0, (doneCount - 1) / (stops.length - 1)) : 0
  const currentIndex = doneCount - 1
  const edge = `${50 / stops.length}%`
  const delivered = order.tone === 'delivered'

  const routeDelay = compact ? '0.15s' : '0.5s'
  const stampDelay = compact ? '0.85s' : '2.2s'

  return (
    <div className={`relative slip w-full max-w-[380px] ${className}`}>
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandMark className="w-5 h-5" />
            <span className="font-display font-extrabold text-[15px]">ShopNest Parcel</span>
          </div>
          {sample && <span className="text-xs text-graphite">Example</span>}
        </div>

        <p className="font-mono text-[13px] text-graphite mt-4 tabular">{order.id}</p>
        <p className="font-display font-extrabold text-2xl leading-tight mt-1 max-w-[15ch]">{order.eta}</p>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-xs text-graphite">From</p>
            <p className="font-semibold">{order.from}</p>
          </div>
          <div>
            <p className="text-xs text-graphite">To</p>
            <p className="font-semibold">{order.to}</p>
          </div>
        </div>
      </div>

      {/* Perforation */}
      <div className="relative">
        <hr className="dash-divider" />
        <span className={`absolute -left-[10px] -top-[10px] w-5 h-5 rounded-full ${notchClass}`} />
        <span className={`absolute -right-[10px] -top-[10px] w-5 h-5 rounded-full ${notchClass}`} />
      </div>

      <div className="px-5 pt-5 pb-4">
        <div className="relative">
          <div className="absolute top-[6px] h-[2px] bg-line" style={{ left: edge, right: edge }} />
          <div className="absolute top-[6px] h-[2px]" style={{ left: edge, right: edge }}>
            <div
              className="route-fill h-full bg-ink"
              style={{ '--p': progress, animationDelay: routeDelay }}
            />
          </div>

          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}>
            {stops.map((s, i) => (
              <div key={s.name} className="flex flex-col items-center text-center">
                <span
                  className={`w-[14px] h-[14px] border-2 border-ink ${
                    i === currentIndex && !delivered
                      ? 'bg-signal node-pulse'
                      : s.done ? 'bg-ink' : 'bg-slip border-line'
                  }`}
                />
                <p className={`text-[11px] font-semibold mt-2 leading-tight ${s.done ? '' : 'text-graphite'}`}>{s.name}</p>
                <p className="text-[10px] text-graphite mt-0.5 tabular min-h-[12px]">{s.time}</p>
              </div>
            ))}
          </div>
        </div>

        {order.items && (
          <div className="flex items-baseline justify-between gap-3 mt-4 text-xs">
            <span className="text-graphite truncate">{order.items}</span>
            {order.total != null && (
              <span className="font-mono tabular font-medium flex-shrink-0">
                Rs. {Number(order.total).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        )}

        <div className="mt-4">
          <Barcode value={order.id} />
        </div>
      </div>

      <div
        className={`absolute top-14 right-4 stamp-in border-2 font-display font-extrabold text-[11px] px-2 py-0.5 uppercase leading-none bg-slip/80 ${
          delivered ? 'border-route text-route' : 'border-alert text-alert'
        }`}
        style={{ animationDelay: stampDelay }}
      >
        {order.status}
      </div>
    </div>
  )
}
