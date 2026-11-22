import { Link } from 'react-router-dom'
import OrderLabel, { BrandMark } from './OrderLabel'

const PANEL_ORDER = {
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

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        {...props}
        className="mt-1.5 w-full slip px-3.5 py-3 text-[15px] placeholder-graphite focus:outline-none focus-visible:outline-none focus:border-ink focus:shadow-[3px_3px_0_#16181D] transition"
      />
    </label>
  )
}

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-concrete text-ink grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <BrandMark className="w-7 h-7" />
          <span className="font-display font-extrabold text-xl">ShopNest</span>
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-[8%] py-10">
            <h1 className="font-display font-extrabold text-4xl leading-tight">{title}</h1>
            <p className="text-graphite mt-2">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-graphite">{footer}</div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex relative bg-signal items-center justify-center overflow-hidden p-10">
        <div
          className="absolute inset-x-0 top-0 h-4"
          style={{ background: 'repeating-linear-gradient(-45deg, #16181D 0 10px, transparent 10px 20px)' }}
        />
        <div className="w-full max-w-[380px]">
          <div className="-rotate-2">
            <OrderLabel order={PANEL_ORDER} className="shadow-[6px_6px_0_#16181D]" />
          </div>
          <p className="text-sm text-ink/70 mt-8 max-w-[34ch]">
            Ask the chat about an order and it replies with a tracking label like this one.
          </p>
        </div>
      </div>
    </div>
  )
}
