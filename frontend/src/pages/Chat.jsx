import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Send, Plus, Trash2, ShoppingBag, LogOut, Bot, User, Menu, X,
  Copy, Check, FileText, ChevronDown, Package, Truck, CreditCard, Search, Gift,
  LayoutDashboard
} from 'lucide-react'
import { createNewChat, getChatHistory, getMyChats, deleteChat, streamMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  { icon: Package, text: 'What is your return policy?' },
  { icon: Truck, text: 'How long does shipping take?' },
  { icon: CreditCard, text: 'What payment methods do you accept?' },
  { icon: Search, text: 'How do I track my order?' },
  { icon: Gift, text: 'Is free shipping available?' }
]

const mdComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline">{children}</a>
  ),
  code: ({ children }) => (
    <code className="bg-black/40 px-1.5 py-0.5 rounded text-xs text-blue-300">{children}</code>
  )
}

function SourceList({ sources }) {
  const [open, setOpen] = useState(null)
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-2">
      <p className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1">
        <FileText className="w-3 h-3" /> Answered using {sources.length} knowledge base {sources.length === 1 ? 'entry' : 'entries'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <button
            key={s.id || i}
            onClick={() => setOpen(open === i ? null : i)}
            className="flex items-center gap-1 text-[11px] bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-300 px-2 py-1 rounded-lg transition max-w-[260px]"
          >
            <span className="text-blue-400/70">[{i + 1}]</span>
            <span className="truncate">{s.question}</span>
            <ChevronDown className={`w-3 h-3 flex-shrink-0 transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>
      {open !== null && sources[open] && (
        <div className="mt-2 text-xs text-gray-400 bg-black/30 border border-gray-800 rounded-lg p-3">
          <p className="text-gray-300 font-medium mb-1">{sources[open].question}</p>
          <p>{sources[open].answer}</p>
          <p className="mt-2 text-[10px] text-gray-600">
            {sources[open].category} &bull; relevance {sources[open].score}
          </p>
        </div>
      )}
    </div>
  )
}

function Message({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-purple-600/30'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-purple-400" />}
      </div>

      <div className={`max-w-[85%] md:max-w-xl ${isUser ? '' : 'min-w-0'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-[#1e1e2e] text-gray-200 border border-gray-800 rounded-tl-sm'
        }`}>
          {isUser ? msg.content : (
            msg.streaming && !msg.content ? (
              <div className="flex gap-1 items-center h-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
              </div>
            ) : (
              <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
            )
          )}
        </div>

        {!isUser && !msg.streaming && msg.content && (
          <div className="mt-1.5 flex items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-300 transition"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {!isUser && !msg.streaming && <SourceList sources={msg.sources} />}
      </div>
    </motion.div>
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
        content: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm **Nesta**, your ShopNest support assistant. How can I help you today?`,
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
      { role: 'assistant', content: '', sources: [], streaming: true }
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
      onToken: (t) => updateLast(m => ({ ...m, content: m.content + t })),
      onDone: () => updateLast(m => ({ ...m, streaming: false })),
      onError: (msg) => {
        toast.error(msg)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant' && !last.content) return prev.slice(0, -1)
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
    toast.success('Logged out successfully')
  }

  return (
    <div className="flex h-screen bg-[#0f0f1a]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#1e1e2e] border-r border-gray-800 flex flex-col transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">ShopNest</span>
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 && (
            <p className="text-gray-600 text-sm text-center mt-8 px-4">
              No conversations yet. Start a new chat!
            </p>
          )}
          {chats.map(chat => (
            <div
              key={chat._id}
              onClick={() => loadChatHistory(chat._id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                currentChatId === chat._id
                  ? 'bg-blue-600/20 border border-blue-600/30'
                  : 'hover:bg-[#11111b]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{chat.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{chat.message_count || 0} messages</p>
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat._id, e)}
                className="md:opacity-0 md:group-hover:opacity-100 p-1 hover:text-red-400 text-gray-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {user?.role === 'admin' && (
          <div className="px-3 pb-3">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-2 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-600/30 text-purple-300 px-4 py-2.5 rounded-xl transition text-sm font-medium"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Dashboard
            </button>
          </div>
        )}

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:text-red-400 text-gray-600 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white text-sm">ShopNest Support</span>
        </div>

        {!currentChatId ? (
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center px-6 py-8"
            >
              <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Hi {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                I'm Nesta, your ShopNest AI support assistant. Ask me about orders, returns, shipping, and more.
              </p>
              <button
                onClick={startNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition mb-8"
              >
                Start a Conversation
              </button>

              <div className="mt-2">
                <p className="text-gray-600 text-xs mb-3">Or try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {SUGGESTIONS.map(({ icon: Icon, text }, i) => (
                    <motion.button
                      key={text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleSend(text)}
                      className="flex items-center gap-1.5 text-xs bg-[#1e1e2e] hover:bg-[#2a2a3e] border border-gray-700 hover:border-blue-600/50 text-gray-400 hover:text-white px-3 py-2 rounded-xl transition"
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                      {text}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              {messages.map((msg, idx) => (
                <Message key={idx} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-800">
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUGGESTIONS.slice(0, 3).map(({ text }) => (
                    <button
                      key={text}
                      onClick={() => handleSend(text)}
                      className="text-xs bg-[#1e1e2e] hover:bg-[#2a2a3e] border border-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-full transition"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3 items-end">
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
                  placeholder="Type your message... (Enter to send)"
                  rows={1}
                  maxLength={2000}
                  className="flex-1 bg-[#1e1e2e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition resize-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center transition flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Nesta v2.0 &bull; Answers are grounded in the ShopNest knowledge base
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
