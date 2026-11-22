import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loginUser } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import AuthShell, { Field } from '../components/AuthShell'

const DEMO = { email: 'test@shopnest.com', password: 'test123' }

export default function Login() {
  const location = useLocation()
  const [form, setForm] = useState(location.state?.demo ? DEMO : { email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser(form)
      login(res.data.token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name}`)
      navigate(res.data.user.role === 'admin' ? '/admin' : '/chat')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to ask about your orders."
      footer={
        <>
          New to ShopNest?{' '}
          <Link to="/register" className="text-ink font-semibold underline underline-offset-2 decoration-signal decoration-2">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white hover:bg-graphite disabled:opacity-50 font-semibold py-3 rounded-sm transition-colors"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <button
          type="button"
          onClick={() => setForm(DEMO)}
          className="w-full slip hover:border-ink py-3 font-semibold text-sm rounded-sm transition-colors"
        >
          Fill in the demo account
        </button>
      </form>
    </AuthShell>
  )
}
