import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import WorkerSignup from './pages/WorkerSignup'
import RestaurantSignup from './pages/RestaurantSignup'
import Browse from './pages/Browse'
import Swipe from './pages/Swipe'
import WorkerProfile from './pages/WorkerProfile'
import RestaurantProfile from './pages/RestaurantProfile'
import WorkerDashboard from './pages/WorkerDashboard'
import RestaurantDashboard from './pages/RestaurantDashboard'
import ShiftDetail from './pages/ShiftDetail'

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-6xl font-display italic text-accent">404</h1>
      <p className="text-xl text-text-secondary">Page not found</p>
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-accent-hover transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-bg-primary text-text-primary font-body">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/worker/signup" element={<WorkerSignup />} />
              <Route path="/restaurant/signup" element={<RestaurantSignup />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/swipe" element={<Swipe />} />
              <Route path="/worker/:id" element={<WorkerProfile />} />
              <Route path="/restaurant/:id" element={<RestaurantProfile />} />
              <Route
                path="/dashboard/worker"
                element={
                  <ProtectedRoute requiredRole="worker">
                    <WorkerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/restaurant"
                element={
                  <ProtectedRoute requiredRole="restaurant">
                    <RestaurantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/jobs/:id" element={<ShiftDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
