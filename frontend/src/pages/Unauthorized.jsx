import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold text-red-600">403</h1>
      <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
      <Link to="/products" className="mt-4 inline-block text-blue-600 hover:underline">
        Back to products
      </Link>
    </div>
  )
}
