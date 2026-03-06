import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <Router>
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
            <Route path="/dashboard/worker" element={<WorkerDashboard />} />
            <Route path="/dashboard/restaurant" element={<RestaurantDashboard />} />
            <Route path="/jobs/:id" element={<ShiftDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
