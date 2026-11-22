import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

// Log out cleanly when a token has expired or is invalid
api.interceptors.response.use((response) => response, (error) => {
  const status = error.response?.status
  const url = error.config?.url || ''
  const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register')

  if ((status === 401 || status === 422) && !isAuthCall && localStorage.getItem('token')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  console.error('API Error:', status, error.response?.data)
  return Promise.reject(error)
})

export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')

export const createNewChat = () => api.post('/chat/new')
export const sendMessage = (data) => api.post('/chat/message', data)
export const getChatHistory = (chatId) => api.get(`/chat/history/${chatId}`)
export const getMyChats = () => api.get('/chat/my-chats')
export const deleteChat = (chatId) => api.delete(`/chat/delete/${chatId}`)

export const getFaqs = () => api.get('/faq/')
export const createFaq = (data) => api.post('/faq/', data)
export const deleteFaq = (id) => api.delete(`/faq/${id}`)

export const getAdminStats = () => api.get('/admin/stats')
export const getAdminUsers = () => api.get('/admin/users')
export const getAdminChats = () => api.get('/admin/chats')

// Streaming chat: reads server-sent events and calls back as they arrive
export async function streamMessage({ message, chatId, onSources, onToken, onDone, onError }) {
  try {
    const res = await fetch(`${API_BASE}/chat/message/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message, chat_id: chatId })
    })

    if (!res.ok || !res.body) {
      let msg = 'Failed to get response'
      try { msg = (await res.json()).error || msg } catch { /* ignore */ }
      onError?.(msg)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split('\n\n')
      buffer = events.pop()

      for (const raw of events) {
        const line = raw.trim()
        if (!line.startsWith('data:')) continue
        const event = JSON.parse(line.slice(5).trim())
        if (event.type === 'sources') onSources?.(event.sources)
        else if (event.type === 'token') onToken?.(event.text)
        else if (event.type === 'done') onDone?.()
        else if (event.type === 'error') onError?.(event.message)
      }
    }
  } catch (err) {
    console.error('Stream error:', err)
    onError?.('Connection lost. Please try again.')
  }
}

export default api
