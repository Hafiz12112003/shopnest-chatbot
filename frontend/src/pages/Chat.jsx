import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, Trash2, ShoppingBag, LogOut, Bot, User } from 'lucide-react'
import { createNewChat, sendMessage, getChatHistory, getMyChats, deleteChat } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Chat() {
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const loadChats = async () => {
    try {
      const res = await getMyChats()
      setChats(res.data.chats)
    } catch (err) {
      console.error('Failed to load chats')
    }
  }

  const startNewChat = async () => {
    try {
      const res = await createNewChat()
      const newChatId = res.data.chat_id
      setCurrentChatId(newChatId)
      setMessages([])
      await loadChats()
      setMessages([{
        role: 'assistant',
        content: `Hi ${user?.name?.split(' ')[0]}! 👋 I'm Nesta, your ShopNest support assistant. How can I help you today?`,
        created_at: new Date().toISOString()
      }])
      return newChatId
    } catch (err) {
      toast.error('Failed to create new chat')
      return null
    }
  }

  const loadChatHistory = async (chatId) => {
    setCurrentChatId(chatId)
    try {
      const res = await getChatHistory(chatId)
      setMessages(res.data.messages)
    } catch (err) {
      toast.error('Failed to load messages')
    }
  }

  const handleSend = async (overrideMessage = null) => {
    const messageToSend = overrideMessage || input.trim()
    if (!messageToSend || loading) return

    let chatId = currentChatId

    // If no chat exists, create one first
    if (!chatId) {
      chatId = await startNewChat()
      if (!chatId) return
    }

    setInput('')

    // Show user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: messageToSend,
      created_at: new Date().toISOString()
    }])

    setTyping(true)
    setLoading(true)

    try {
      const res = await sendMessage({ message: messageToSend, chat_id: chatId })
      setTyping(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        created_at: new Date().toISOString()
      }])
      await loadChats()
    } catch (err) {
      setTyping(false)
      toast.error('Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuestion = async (question) => {
    // Strip emoji prefix (first 2 chars)
    const cleanQuestion = question.substring(2).trim()
    let chatId = currentChatId

    if (!chatId) {
      chatId = await startNewChat()
      if (!chatId) return
      // Small delay to let chat initialize
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    await handleSend(cleanQuestion)
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
    } catch (err) {
      toast.error('Failed to delete chat')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const suggestedQuestions = [
    '📦 What is your return policy?',
    '🚚 How long does shipping take?',
    '💳 What payment methods do you accept?',
    '🔍 How do I track my order?',
    '🎁 Is free shipping available?'
  ]

  return (
    <div className="flex h-screen bg-[#0f0f1a]">
      {/* Sidebar */}
      <div className="w-72 bg-[#1e1e2e] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">ShopNest</span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Chat List */}
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
                <p className="text-xs text-gray-500 mt-0.5">
                  {chat.message_count || 0} messages
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat._id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:text-red-400 text-gray-600 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {!currentChatId ? (
          // Welcome Screen
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center px-6"
            >
              <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Hi {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-gray-400 mb-8 max-w-sm">
                I'm Nesta, your ShopNest AI support assistant. I can help you with orders, returns, shipping, and more!
              </p>
              <button
                onClick={startNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition mb-8"
              >
                Start a Conversation
              </button>

              {/* Suggested Questions */}
              <div className="mt-2">
                <p className="text-gray-600 text-xs mb-3">Or try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {suggestedQuestions.map((q, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="text-xs bg-[#1e1e2e] hover:bg-[#2a2a3e] border border-gray-700 hover:border-blue-600/50 text-gray-400 hover:text-white px-3 py-2 rounded-xl transition"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600/30'
                    }`}>
                      {msg.role === 'user'
                        ? <User className="w-4 h-4 text-white" />
                        : <Bot className="w-4 h-4 text-purple-400" />
                      }
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-[#1e1e2e] text-gray-200 border border-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="bg-[#1e1e2e] border border-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-3 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Type your message... (Enter to send)"
                  rows={1}
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
                Powered by ShopNest AI • Nesta v1.0
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}