import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import AuthShell, { Field } from '../components/AuthShell'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await registerUser(form)
      login(res.data.token, res.data.user)
      toast.success('Account created')
      navigate('/chat')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a few seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-ink font-semibold underline underline-offset-2 decoration-signal decoration-2">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white hover:bg-graphite disabled:opacity-50 font-semibold py-3 rounded-sm transition-colors"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
