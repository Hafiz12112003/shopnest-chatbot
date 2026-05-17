import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, MessageSquare, HelpCircle, BarChart3, Plus, Trash2, LogOut, ShoppingBag } from 'lucide-react'
import { getAdminStats, getAdminUsers, getAdminChats, getFaqs, createFaq, deleteFaq } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Admin() {
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [chats, setChats] = useState([])
  const [faqs, setFaqs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'General' })
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
    loadFaqs()
  }, [])

  const loadStats = async () => {
    try {
      const res = await getAdminStats()
      setStats(res.data)
    } catch (err) {
      toast.error('Failed to load stats')
    }
  }

  const loadUsers = async () => {
    try {
      const res = await getAdminUsers()
      setUsers(res.data.users)
    } catch (err) {
      toast.error('Failed to load users')
    }
  }

  const loadChats = async () => {
    try {
      const res = await getAdminChats()
      setChats(res.data.chats)
    } catch (err) {
      toast.error('Failed to load chats')
    }
  }

  const loadFaqs = async () => {
    try {
      const res = await getFaqs()
      setFaqs(res.data.faqs)
    } catch (err) {}
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
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
    } catch (err) {
      toast.error('Failed to add FAQ')
    }
  }

  const handleDeleteFaq = async (id) => {
    try {
      await deleteFaq(id)
      toast.success('FAQ deleted')
      loadFaqs()
    } catch (err) {
      toast.error('Failed to delete FAQ')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <div className="bg-[#1e1e2e] border-b border-gray-800 px-6 py-4">
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

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Users', value: stats.total_users || 0, icon: Users, color: 'blue' },
                { label: 'Total Chats', value: stats.total_chats || 0, icon: MessageSquare, color: 'purple' },
                { label: 'Total Messages', value: stats.total_messages || 0, icon: BarChart3, color: 'green' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#1e1e2e] border border-gray-800 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-600/20 rounded-xl flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl overflow-hidden">
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
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl overflow-hidden">
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
            {/* Add FAQ Form */}
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New FAQ
              </h3>
              <form onSubmit={handleAddFaq} className="space-y-4">
                <input
                  type="text"
                  placeholder="Question"
                  value={newFaq.question}
                  onChange={e => setNewFaq({...newFaq, question: e.target.value})}
                  className="w-full bg-[#11111b] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  required
                />
                <textarea
                  placeholder="Answer"
                  value={newFaq.answer}
                  onChange={e => setNewFaq({...newFaq, answer: e.target.value})}
                  rows={3}
                  className="w-full bg-[#11111b] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
                <select
                  value={newFaq.category}
                  onChange={e => setNewFaq({...newFaq, category: e.target.value})}
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

            {/* FAQ List */}
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-[#1e1e2e] border border-gray-800 rounded-xl p-4">
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