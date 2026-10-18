import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Dashboard from "./pages/Dashboard"
import NewActivity from "./pages/NewActivity"
import ActivityDetail from "./pages/ActivityDetail"
import Library from "./pages/Library"
import Credits from "./pages/Credits"
import Formats from "./pages/Formats"
import Play from "./pages/Play"
import AuthLayout from "./components/AuthLayout"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/jugar/:code" element={<Play />} />
      <Route
        path="/dashboard"
        element={
          <AuthLayout>
            <Dashboard />
          </AuthLayout>
        }
      />
      <Route
        path="/nueva"
        element={
          <AuthLayout>
            <NewActivity />
          </AuthLayout>
        }
      />
      <Route
        path="/actividad/:id"
        element={
          <AuthLayout>
            <ActivityDetail />
          </AuthLayout>
        }
      />
      <Route
        path="/biblioteca"
        element={
          <AuthLayout>
            <Library />
          </AuthLayout>
        }
      />
      <Route
        path="/creditos"
        element={
          <AuthLayout>
            <Credits />
          </AuthLayout>
        }
      />
      <Route
        path="/formatos"
        element={
          <AuthLayout>
            <Formats />
          </AuthLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
