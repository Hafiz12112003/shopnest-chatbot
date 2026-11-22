import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OrderLabel, { BrandMark } from '../components/OrderLabel'

const HAZARD = { background: 'repeating-linear-gradient(-45deg, #16181D 0 10px, transparent 10px 20px)' }

const DEMO_ORDER = {
  id: 'SN-48213907',
  status: 'Out for delivery',
  tone: 'transit',
  eta: 'Arrives today by 9 PM',
  from: 'Chennai hub',
  to: 'Madurai',
  items: 'Wireless earbuds x1',
  total: 2499,
  stops: [
    { name: 'Packed', time: 'Fri 5:37 PM', done: true },
    { name: 'Shipped', time: 'Sat 5:37 PM', done: true },
    { name: 'Out for delivery', time: 'Sun 2:37 PM', done: true },
    { name: 'Delivered', time: 'By Sun 9:37 PM', done: false }
  ]
}

const STEPS = [
  {
    title: 'You ask in plain words',
    body: `For example, "Where is my latest order?" or "How long does shipping take?"`
  },
  {
    title: 'Nesta checks the right place',
    body: 'Order questions go to your own orders, and only yours. Everything else is answered from the ShopNest help articles.'
  },
  {
    title: 'You get the answer with proof',
    body: 'Orders come back as a tracking label. Policy answers show which help article they came from, so you can read it yourself.'
  }
]

const GAPS = [
  'Can I pay with Bitcoin?',
  'Do you deliver to Sri Lanka?',
  'Can I change my address after ordering?'
]

function reveal(on) {
  return `transition-all duration-500 ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`
}

function HeroDemo() {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [step, setStep] = useState(reduced ? 4 : 0)

  useEffect(() => {
    if (reduced) return
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2500),
      setTimeout(() => setStep(4), 3000)
    ]
    return () => timers.forEach(clearTimeout)
  }, [reduced])

  return (
    <div className="relative bg-signal overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-3" style={HAZARD} />

      <div className="px-6 pt-10 pb-6 min-h-[640px] flex flex-col gap-5">
        <div className={`flex justify-end ${reveal(step >= 1)}`}>
          <div className="bg-ink text-white text-[15px] px-4 py-2.5 rounded-[14px_14px_2px_14px]">
            Where is my latest order?
          </div>
        </div>

        <div className={reveal(step >= 2)}>
          <div className="flex items-center gap-2 mb-2">
            <BrandMark className="w-[18px] h-[18px]" />
            <p className="font-display font-bold text-sm">Nesta</p>
          </div>
          {step === 2 ? (
            <div className="flex gap-1 items-center h-6">
              <div className="w-1.5 h-1.5 bg-ink rounded-full typing-dot"></div>
              <div className="w-1.5 h-1.5 bg-ink rounded-full typing-dot"></div>
              <div className="w-1.5 h-1.5 bg-ink rounded-full typing-dot"></div>
            </div>
          ) : (
            <p className={`text-[15px] leading-relaxed max-w-[34ch] ${reveal(step >= 3)}`}>
              Your earbuds are <strong>out for delivery</strong> and should reach you <strong>today by 9 PM</strong>.
            </p>
          )}
        </div>

        <div className="min-h-[330px] flex items-start justify-center sm:justify-start">
          {step >= 4 && (
            <OrderLabel
              order={DEMO_ORDER}
              compact
              className="shadow-[5px_5px_0_#16181D]"
            />
          )}
        </div>

        <p className="text-xs text-ink/70 mt-auto">A sample conversation with demo data.</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-concrete text-ink">
      <header className="bg-slip border-b border-line">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="w-7 h-7" />
            <span className="font-display font-extrabold text-xl">ShopNest</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold px-3 py-2 underline-offset-4 decoration-signal decoration-2 hover:underline"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-ink text-white hover:bg-graphite text-sm font-semibold px-4 py-2.5 rounded-sm transition-colors"
            >
              Create account
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="dot-grid">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-12 items-center">
          <div>
            <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.02] max-w-[14ch]">
              Support that checks your order before it answers.
            </h1>
            <p className="text-graphite text-lg mt-6 max-w-md leading-relaxed">
              Nesta looks up your real orders, reads the ShopNest help articles, and tells you when it doesn't know.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => navigate('/login', { state: { demo: true } })}
                className="bg-ink text-white hover:bg-graphite font-semibold px-6 py-3.5 rounded-sm transition-colors"
              >
                Try the demo
              </button>
              <button
                onClick={() => navigate('/register')}
                className="slip border-ink hover:bg-white font-semibold px-6 py-3.5 rounded-sm shadow-[3px_3px_0_#16181D] hover:shadow-[1px_1px_0_#16181D] hover:translate-x-[2px] hover:translate-y-[2px] transition"
              >
                Create account
              </button>
            </div>
          </div>

          <HeroDemo />
        </div>
      </section>

      {/* How it answers */}
      <section className="bg-slip border-y border-line">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-10">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-tight max-w-[12ch]">
            How Nesta answers a question
          </h2>
          <ol className="border-t border-dashed border-line">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[44px_1fr] gap-2 py-5 border-b border-dashed border-line">
                <span className="font-mono text-graphite tabular pt-0.5">{i + 1}</span>
                <div>
                  <h3 className="font-display font-bold text-lg">{s.title}</h3>
                  <p className="text-graphite mt-1 leading-relaxed max-w-[52ch]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Knowledge gaps */}
      <section className="dot-grid">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-tight max-w-[14ch]">
              When it doesn't know, it says so.
            </h2>
            <p className="text-graphite mt-4 leading-relaxed max-w-md">
              If the help articles don't cover a question, Nesta tells the customer instead of guessing. The admin dashboard collects those questions, and each one has an Add as FAQ button so the team can write the missing answer.
            </p>
          </div>

          <div className="slip border-ink p-5 shadow-[5px_5px_0_#16181D] max-w-md w-full">
            <div className="flex items-center justify-between">
              <p className="font-display font-bold">Knowledge gaps</p>
              <span className="text-xs text-graphite">Example</span>
            </div>
            <p className="text-xs text-graphite mt-1">Recent questions the bot could not answer from the help articles.</p>
            <hr className="dash-divider my-4" />
            <ul className="space-y-2">
              {GAPS.map(g => (
                <li key={g} className="flex items-center justify-between gap-3 bg-concrete px-3 py-2.5">
                  <span className="text-sm truncate">{g}</span>
                  <span className="text-xs font-semibold bg-signal px-2 py-1 flex-shrink-0">Add as FAQ</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Demo band */}
      <section className="relative bg-signal overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-3" style={HAZARD} />
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-tight max-w-[16ch]">
              See it with a demo account.
            </h2>
            <p className="mt-3 max-w-md leading-relaxed">
              The demo account has three sample orders: one out for delivery, one in transit and one delivered.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/login', { state: { demo: true } })}
              className="bg-ink text-white hover:bg-graphite font-semibold px-6 py-3.5 rounded-sm transition-colors"
            >
              Try the demo
            </button>
            <button
              onClick={() => navigate('/register')}
              className="slip border-ink hover:bg-white font-semibold px-6 py-3.5 rounded-sm transition-colors"
            >
              Create account
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <BrandMark className="w-5 h-5" tone="signal" />
            <span className="font-display font-bold">ShopNest</span>
          </div>
          <p className="text-white/60">Built by Muhammad Hafiz with React, Flask, MongoDB and Groq.</p>
          <a
            href="https://github.com/Hafiz12112003/shopnest-chatbot"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-signal decoration-2"
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
