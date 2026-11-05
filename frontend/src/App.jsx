import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Only for logged-out users */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ADMIN or USER with CREATE access */}
          <Route element={<ProtectedRoute requireCreate />}>
            <Route path="/cart" element={<Cart />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}