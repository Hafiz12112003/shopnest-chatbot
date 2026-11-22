import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Send, Plus, Trash2, LogOut, Menu, X, Copy, Check, ChevronDown,
  Package, Truck, CreditCard, Search, Gift, LayoutDashboard, BookOpen
} from 'lucide-react'
import { createNewChat, getChatHistory, getMyChats, deleteChat, streamMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import OrderLabel, { BrandMark } from '../components/OrderLabel'

const SUGGESTIONS = [
  { icon: Search, text: 'Where is my latest order?' },
  { icon: Package, text: 'What is your return policy?' },
  { icon: Truck, text: 'How long does shipping take?' },
  { icon: CreditCard, text: 'What payment methods do you accept?' },
  { icon: Gift, text: 'Is free shipping available?' }
]

const SAMPLE_ORDER = {
  id: 'SN-48213907',
  status: 'Out for delivery',
  tone: 'transit',
  eta: 'Arrives today by 7 PM',
  from: 'Chennai hub',
  to: 'Your door',
  stops: [
    { name: 'Packed', time: 'Mon 9:10 AM', done: true },
    { name: 'Shipped', time: 'Tue 1:40 PM', done: true },
    { name: 'Out for delivery', time: 'Today 8:30 AM', done: true },
    { name: 'Delivered', time: 'By 7 PM', done: false }
  ]
}

const mdComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc marker:text-graphite pl-5 mb-3 space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal marker:text-graphite pl-5 mb-3 space-y-1.5">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 decoration-signal decoration-2">{children}</a>
  ),
  code: ({ children }) => (
    <code className="font-mono text-[13px] bg-concrete px-1.5 py-0.5">{children}</code>
  )
}

function SourceList({ sources }) {
  const [open, setOpen] = useState(null)
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-4 max-w-[66ch]">
      <p className="text-xs text-graphite mb-2 flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5" />
        Found in {sources.length} help {sources.length === 1 ? 'article' : 'articles'}
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <button
            key={s.id || i}
            onClick={() => setOpen(open === i ? null : i)}
            className={`flex items-center gap-2 text-xs slip px-2.5 py-1.5 max-w-[280px] hover:border-ink transition-colors ${
              open === i ? 'border-ink' : ''
            }`}
          >
            <span className="font-mono bg-signal text-ink px-1">{i + 1}</span>
            <span className="truncate">{s.question}</span>
            <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>
      {open !== null && sources[open] && (
        <div className="slip mt-2 p-4 text-sm shadow-[4px_4px_0_#16181D] border-ink">
          <p className="font-semibold mb-1">{sources[open].question}</p>
          <p className="text-graphite leading-relaxed">{sources[open].answer}</p>
          <hr className="dash-divider my-3" />
          <div className="flex gap-4 text-xs text-graphite">
            <span>Category: {sources[open].category}</span>
            <span className="font-mono tabular">Match {sources[open].score}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Message({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'
  const orders = msg.orders || []

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-signal text-ink font-medium text-[15px] leading-relaxed px-4 py-2.5 rounded-[14px_14px_2px_14px] whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    )
  }

  const waiting = msg.streaming && !msg.content && orders.length === 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BrandMark className="w-[18px] h-[18px]" />
        <p className="font-display font-bold text-sm">Nesta</p>
      </div>

      <div className={`text-[15px] leading-relaxed max-w-[66ch] ${msg.streaming && msg.content ? 'stream-caret' : ''}`}>
        {waiting ? (
          <div className="flex items-center gap-2 text-graphite text-sm">
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-graphite rounded-full typing-dot"></div>
              <div className="w-1.5 h-1.5 bg-graphite rounded-full typing-dot"></div>
              <div className="w-1.5 h-1.5 bg-graphite rounded-full typing-dot"></div>
            </div>
            Checking
          </div>
        ) : (
          <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
        )}
      </div>

      {orders.length > 0 && (
        <div className="mt-4 space-y-5">
          {orders.map(order => (
            <OrderLabel
              key={order.id}
              order={order}
              compact
              notchClass="bg-concrete"
              className="shadow-[5px_5px_0_#16181D]"
            />
          ))}
        </div>
      )}

      {!msg.streaming && msg.content && (
        <button
          onClick={copy}
          className="mt-3 flex items-center gap-1 text-xs text-graphite hover:text-ink transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}

      {!msg.streaming && <SourceList sources={msg.sources} />}
    </div>
  )
}

export default function Chat() {
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'there'

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChats = async () => {
    try {
      const res = await getMyChats()
      setChats(res.data.chats)
    } catch {
      console.error('Failed to load chats')
    }
  }

  const startNewChat = async () => {
    try {
      const res = await createNewChat()
      const newChatId = res.data.chat_id
      setCurrentChatId(newChatId)
      setSidebarOpen(false)
      setMessages([{
        role: 'assistant',
        content: `Hi ${firstName}. Ask me about an order, a return, shipping or payments.`,
        sources: []
      }])
      await loadChats()
      return newChatId
    } catch {
      toast.error('Failed to create new chat')
      return null
    }
  }

  const loadChatHistory = async (chatId) => {
    setCurrentChatId(chatId)
    setSidebarOpen(false)
    try {
      const res = await getChatHistory(chatId)
      setMessages(res.data.messages)
    } catch {
      toast.error('Failed to load messages')
    }
  }

  const handleSend = async (overrideMessage) => {
    const text = (typeof overrideMessage === 'string' ? overrideMessage : input).trim()
    if (!text || loading) return

    let chatId = currentChatId
    if (!chatId) {
      chatId = await startNewChat()
      if (!chatId) return
    }

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setMessages(prev => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '', sources: [], orders: [], streaming: true }
    ])
    setLoading(true)

    const updateLast = (fn) => setMessages(prev => {
      const copy = [...prev]
      copy[copy.length - 1] = fn(copy[copy.length - 1])
      return copy
    })

    await streamMessage({
      message: text,
      chatId,
      onSources: (sources) => updateLast(m => ({ ...m, sources })),
      onOrder: (order) => updateLast(m => ({ ...m, orders: [...(m.orders || []), order] })),
      onToken: (t) => updateLast(m => ({ ...m, content: m.content + t })),
      onDone: () => updateLast(m => ({ ...m, streaming: false })),
      onError: (msg) => {
        toast.error(msg)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant' && !last.content && !(last.orders || []).length) {
            return prev.slice(0, -1)
          }
          const copy = [...prev]
          copy[copy.length - 1] = { ...last, streaming: false }
          return copy
        })
      }
    })

    setLoading(false)
    loadChats()
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    try {
      await deleteChat(chatId)
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setMessages([])
      }
      await loadChats()
      toast.success('Chat deleted')
    } catch {
      toast.error('Failed to delete chat')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  const goHome = () => {
    setCurrentChatId(null)
    setMessages([])
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-concrete text-ink">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-ink/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-ink text-white flex flex-col transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="h-16 px-4 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-2.5">
            <BrandMark className="w-7 h-7" tone="signal" />
            <span className="font-display font-extrabold text-xl tracking-tight">ShopNest</span>
          </button>
          <button className="md:hidden text-white/60" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-signal hover:bg-white text-ink px-4 py-2.5 rounded-sm transition-colors text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>

        <p className="px-4 pt-2 pb-1 text-xs text-white/50">Your chats</p>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && (
            <p className="text-white/50 text-sm px-4 mt-3">No conversations yet.</p>
          )}
          {chats.map(chat => (
            <div
              key={chat._id}
              onClick={() => loadChatHistory(chat._id)}
              className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer border-l-[3px] transition-colors ${
                currentChatId === chat._id
                  ? 'bg-white/10 border-signal'
                  : 'border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{chat.title}</p>
                <p className="text-xs text-white/50 tabular mt-0.5">{chat.message_count || 0} messages</p>
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat._id, e)}
                aria-label="Delete chat"
                className="md:opacity-0 md:group-hover:opacity-100 p-1 text-white/50 hover:text-alert transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-3 border-t border-white/10 text-sm text-white/80 hover:bg-white/5 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-signal" />
            Admin dashboard
          </button>
        )}

        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} aria-label="Log out" className="p-1.5 text-white/50 hover:text-alert transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-4 border-b border-line bg-slip flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-ink" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold">ShopNest Support</span>
          <span className="hidden sm:block ml-auto text-xs text-graphite">
            Orders come from your account. Everything else comes from the help articles.
          </span>
        </header>

        <div className="flex-1 overflow-y-auto dot-grid">
          {!currentChatId ? (
            <div className="max-w-5xl mx-auto px-6 py-10 md:py-14 grid md:grid-cols-[minmax(0,1fr)_400px] gap-10 items-center">
              <div>
                <h2 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.02] max-w-[11ch]">
                  What do you need sorted, {firstName}?
                </h2>
                <p className="text-graphite mt-5 max-w-md leading-relaxed">
                  Ask about an order, a return, shipping or payments. If the help articles don't cover it, I'll say so.
                </p>

                <div className="mt-8 grid gap-2.5 max-w-md">
                  {SUGGESTIONS.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => handleSend(text)}
                      className="flex items-center gap-3 slip px-3 py-2.5 text-left hover:border-ink hover:shadow-[3px_3px_0_#16181D] hover:-translate-y-0.5 transition"
                    >
                      <span className="w-8 h-8 bg-signal flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-ink" />
                      </span>
                      <span className="text-[15px]">{text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative bg-signal p-6 md:p-8 overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-3"
                  style={{ background: 'repeating-linear-gradient(-45deg, #16181D 0 10px, transparent 10px 20px)' }}
                />
                <div className="pt-5 pb-1 -rotate-2">
                  <OrderLabel order={SAMPLE_ORDER} sample className="shadow-[6px_6px_0_#16181D]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-6 space-y-7">
              {messages.map((msg, idx) => (
                <Message key={idx} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-line bg-slip px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {currentChatId && messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTIONS.slice(0, 3).map(({ text }) => (
                  <button
                    key={text}
                    onClick={() => handleSend(text)}
                    className="text-xs slip px-3 py-1.5 hover:border-ink transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            <div className="slip border-ink flex items-end gap-2 p-2 shadow-[4px_4px_0_#16181D]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask about an order, return, shipping or payment"
                rows={1}
                maxLength={2000}
                className="flex-1 bg-transparent resize-none px-2 py-2 text-[15px] placeholder-graphite focus:outline-none focus-visible:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="w-10 h-10 bg-signal text-ink hover:bg-ink hover:text-white disabled:bg-line disabled:text-graphite flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-graphite mt-3">
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
