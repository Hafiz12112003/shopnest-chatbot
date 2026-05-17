import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import Admin from './pages/Admin'
import Landing from './pages/Landing'

// Protected route - only logged in users can access
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="text-blue-400 text-lg">Loading...</div>
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

// Admin route - only admins can access
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="text-blue-400 text-lg">Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'admin') return <Navigate to="/chat" />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      {/* Landing page for non-logged in users */}
      <Route path="/" element={
        user ? <Navigate to="/chat" /> : <Landing />
      } />
      <Route path="/login" element={
        user ? <Navigate to="/chat" /> : <Login />
      } />
      <Route path="/register" element={
        user ? <Navigate to="/chat" /> : <Register />
      } />
      <Route path="/chat" element={
        <ProtectedRoute><Chat /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><Admin /></AdminRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#fff',
              border: '1px solid #374151',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}