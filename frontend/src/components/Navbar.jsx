import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
  }`

export default function Navbar() {
  const { user, canCreate, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="text-lg font-bold text-blue-600">📦 LogiOrders</span>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          {canCreate && <NavLink to="/cart" className={linkClass}>Cart</NavLink>}
          <NavLink to="/orders" className={linkClass}>Orders</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-gray-500">
              {user.role}
              {user.role === 'USER' && ` · ${user.access}`}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}