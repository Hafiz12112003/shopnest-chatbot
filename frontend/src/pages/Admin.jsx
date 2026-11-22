import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, MessageSquare, HelpCircle, BarChart3, Plus, Trash2, LogOut,
  ShoppingBag, BookOpen, AlertCircle, TrendingUp
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts'
import api, { getAdminStats, getAdminUsers, getAdminChats, getFaqs, createFaq, deleteFaq } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const COLOR_STYLES = {
  blue: { bg: 'bg-blue-600/20', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-600/20', text: 'text-purple-400' },
  green: { bg: 'bg-green-600/20', text: 'text-green-400' },
  amber: { bg: 'bg-amber-600/20', text: 'text-amber-400' }
}

const tooltipStyle = {
  background: '#1e1e2e',
  border: '1px solid #374151',
  borderRadius: 12,
  color: '#e5e7eb',
  fontSize: 12
}

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-[#1e1e2e] border border-gray-800 rounded-2xl p-5 ${className}`}>
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-blue-400" />}
        {title}
      </h3>
      {children}
    </div>
  )
}

function BarList({ items, empty }) {
  if (!items || items.length === 0) {
    return <p className="text-gray-600 text-sm">{empty}</p>
  }
  const max = Math.max(...items.map(i => i.count))
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between gap-3 text-xs mb-1">
            <span className="text-gray-300 truncate">{item.question}</span>
            <span className="text-gray-500 flex-shrink-0">{item.count}</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Admin() {
  const [stats, setStats] = useState({})
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [chats, setChats] = useState([])
  const [faqs, setFaqs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'General' })
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
    loadAnalytics()
    loadFaqs()
  }, [])

  const loadStats = async () => {
    try {
      const res = await getAdminStats()
      setStats(res.data)
    } catch {
      toast.error('Failed to load stats')
    }
  }

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics')
      setAnalytics(res.data)
    } catch {
      toast.error('Failed to load analytics')
    }
  }

  const loadUsers = async () => {
    try {
      const res = await getAdminUsers()
      setUsers(res.data.users)
    } catch {
      toast.error('Failed to load users')
    }
  }

  const loadChats = async () => {
    try {
      const res = await getAdminChats()
      setChats(res.data.chats)
    } catch {
      toast.error('Failed to load chats')
    }
  }

  const loadFaqs = async () => {
    try {
      const res = await getFaqs()
      setFaqs(res.data.faqs)
    } catch {
      /* ignore */
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'overview') { loadStats(); loadAnalytics() }
    if (tab === 'users') loadUsers()
    if (tab === 'chats') loadChats()
  }

  const handleAddFaq = async (e) => {
    e.preventDefault()
    try {
      await createFaq(newFaq)
      toast.success('FAQ added!')
      setNewFaq({ question: '', answer: '', category: 'General' })
      loadFaqs()
      loadStats()
    } catch {
      toast.error('Failed to add FAQ')
    }
  }

  const handleDeleteFaq = async (id) => {
    try {
      await deleteFaq(id)
      toast.success('FAQ deleted')
      loadFaqs()
      loadStats()
    } catch {
      toast.error('Failed to delete FAQ')
    }
  }

  const addGapAsFaq = (question) => {
    setNewFaq({ question, answer: '', category: 'General' })
    setActiveTab('faqs')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast('Write the answer, then click Add FAQ')
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle }
  ]

  const statCards = [
    { label: 'Total Users', value: stats.total_users || 0, icon: Users, color: 'blue' },
    { label: 'Total Chats', value: stats.total_chats || 0, icon: MessageSquare, color: 'purple' },
    { label: 'Total Messages', value: stats.total_messages || 0, icon: BarChart3, color: 'green' },
    { label: 'FAQ Entries', value: stats.total_faqs || 0, icon: BookOpen, color: 'amber' }
  ]

  const coverage = analytics?.coverage || { answered: 0, unanswered: 0 }
  const coverageTotal = coverage.answered + coverage.unanswered
  const coverageData = [
    { name: 'Answered from knowledge base', value: coverage.answered },
    { name: 'Not covered', value: coverage.unanswered }
  ]
  const coveragePct = coverageTotal ? Math.round((coverage.answered / coverageTotal) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <div className="bg-[#1e1e2e] border-b border-gray-800 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">ShopNest Admin</h1>
              <p className="text-xs text-gray-500">Management Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1e1e2e] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#1e1e2e] border border-gray-800 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-11 h-11 ${COLOR_STYLES[stat.color].bg} rounded-xl flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${COLOR_STYLES[stat.color].text}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card title="Questions per day (last 7 days)" icon={TrendingUp} className="lg:col-span-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.daily || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="qGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="questions"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#qGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Knowledge base coverage" icon={BookOpen}>
                {coverageTotal === 0 ? (
                  <p className="text-gray-600 text-sm">No tracked answers yet. Ask the chatbot a question.</p>
                ) : (
                  <div className="relative h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={coverageData}
                          dataKey="value"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          stroke="none"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-white">{coveragePct}%</span>
                      <span className="text-[11px] text-gray-500">answered from KB</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card title="Most asked questions" icon={MessageSquare}>
                <BarList items={analytics?.top_questions} empty="No questions yet." />
              </Card>

              <Card title="Most cited FAQs" icon={HelpCircle}>
                <BarList items={analytics?.top_faqs} empty="No FAQ citations yet." />
              </Card>

              <Card title="Knowledge gaps" icon={AlertCircle}>
                {!analytics?.gaps || analytics.gaps.length === 0 ? (
                  <p className="text-gray-600 text-sm">No gaps found. The knowledge base is covering every question.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-500 mb-2">
                      Recent questions the bot could not answer from the FAQ.
                    </p>
                    {analytics.gaps.map((g, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 bg-black/20 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-300 truncate">{g.question}</span>
                        <button
                          onClick={() => addGapAsFaq(g.question)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 flex-shrink-0"
                        >
                          Add as FAQ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </motion.div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">Name</th>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">Email</th>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">Role</th>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-[#11111b]">
                      <td className="px-6 py-4 text-white text-sm">{user.name}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'admin' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Chats */}
        {activeTab === 'chats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">Title</th>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">User</th>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">Messages</th>
                    <th className="text-left text-gray-500 text-sm px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {chats.map((chat, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-[#11111b]">
                      <td className="px-6 py-4 text-white text-sm">{chat.title}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{chat.user_name}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{chat.message_count}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* FAQs */}
        {activeTab === 'faqs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New FAQ
              </h3>
              <form onSubmit={handleAddFaq} className="space-y-4">
                <input
                  type="text"
                  placeholder="Question"
                  value={newFaq.question}
                  onChange={e => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="w-full bg-[#11111b] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  required
                />
                <textarea
                  placeholder="Answer"
                  value={newFaq.answer}
                  onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows={3}
                  className="w-full bg-[#11111b] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
                <select
                  value={newFaq.category}
                  onChange={e => setNewFaq({ ...newFaq, category: e.target.value })}
                  className="w-full bg-[#11111b] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option>General</option>
                  <option>Shipping</option>
                  <option>Returns</option>
                  <option>Payments</option>
                  <option>Account</option>
                </select>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition font-medium"
                >
                  Add FAQ
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={faq._id || i} className="bg-[#1e1e2e] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium text-sm">{faq.question}</p>
                      <p className="text-gray-400 text-sm mt-1">{faq.answer}</p>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full mt-2 inline-block">
                        {faq.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteFaq(faq._id)}
                      className="text-gray-600 hover:text-red-400 transition flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {faqs.length === 0 && (
                <p className="text-gray-600 text-center py-8">No FAQs yet. Add your first one above!</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
