import axios from 'axios'

const API_BASE = 'http://127.0.0.1:5000/api'

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
}, (error) => {
  return Promise.reject(error)
})

// Log responses for debugging
api.interceptors.response.use((response) => {
  return response
}, (error) => {
  console.error('API Error:', error.response?.status, error.response?.data)
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

export default api