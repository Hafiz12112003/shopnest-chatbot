import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Bot, Shield, Zap, Star, ArrowRight, MessageSquare, Users, BarChart3 } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Responses',
      desc: 'Nesta understands natural language and gives human-like answers instantly.',
      color: 'blue'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      desc: 'Powered by Groq\'s Llama 3.3 — the fastest AI model available today.',
      color: 'yellow'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      desc: 'JWT authentication, bcrypt password hashing, and encrypted data storage.',
      color: 'green'
    },
    {
      icon: MessageSquare,
      title: 'Smart FAQ System',
      desc: 'AI searches your knowledge base before responding for accurate answers.',
      color: 'purple'
    },
    {
      icon: Users,
      title: 'Admin Dashboard',
      desc: 'Manage users, monitor conversations, and update FAQs in real time.',
      color: 'pink'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      desc: 'Track total users, conversations, and messages from one dashboard.',
      color: 'orange'
    }
  ]

  const stats = [
    { value: '< 1s', label: 'Response Time' },
    { value: '24/7', label: 'Availability' },
    { value: '100%', label: 'Free to Use' },
    { value: 'AI', label: 'Powered' },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f1a]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">ShopNest</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-400 hover:text-white transition text-sm px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-2 text-blue-400 text-sm mb-8"
          >
            <Star className="w-4 h-4" />
            AI-Powered Customer Support Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Support your customers
            <span className="text-blue-500"> 24/7</span> with
            <span className="text-blue-500"> AI</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            ShopNest's AI assistant Nesta handles customer queries instantly —
            from returns to shipping — so your team can focus on what matters.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition text-lg"
            >
              Try it Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-[#1e1e2e] hover:bg-[#2a2a3e] border border-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition text-lg"
            >
              Sign In
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-gray-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-blue-400 mb-1">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-gray-400 text-lg">Built for modern e-commerce businesses</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1e1e2e] border border-gray-800 rounded-2xl p-6 hover:border-blue-600/30 transition group"
              >
                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Preview */}
      <section className="py-20 px-6 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            <h2 className="text-3xl font-bold mb-4">See Nesta in action</h2>
            <p className="text-gray-400 mb-12">Real conversations, real answers</p>
          </motion.div>

          {/* Mock Chat */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-[#1e1e2e] border border-gray-800 rounded-2xl p-6 text-left max-w-2xl mx-auto"
          >
            {/* Chat Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
              <div className="w-10 h-10 bg-purple-600/30 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Nesta</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-green-400 text-xs">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-[#11111b] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-300 max-w-sm">
                  Hi! 👋 I'm Nesta, your ShopNest support assistant. How can I help you today?
                </div>
              </div>

              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white max-w-sm">
                  What is your return policy?
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-[#11111b] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-300 max-w-sm">
                  We offer a <span className="text-blue-400 font-medium">7-day easy return policy</span>. Products must be in original condition. Contact us to initiate a return! 😊
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-8">Join ShopNest and transform your customer support today.</p>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition text-lg mx-auto"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-400 text-sm">ShopNest © 2026</span>
          </div>
          <p className="text-gray-600 text-sm">Built with ❤️ by Muhammad Hafiz</p>
        </div>
      </footer>

    </div>
  )
}