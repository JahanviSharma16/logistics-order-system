import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getProducts } from '../api/products.api'
import useDebounce from '../hooks/useDebounce'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import StockBadge from '../components/StockBadge'
import { formatCurrency } from '../utils/format'
import getErrorMessage from '../utils/getErrorMessage'

const LIMIT = 10

export default function Products() {
  const { canCreate } = useAuth()
  const { addItem, getQty } = useCart()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [reloadCount, setReloadCount] = useState(0)
  const debouncedSearch = useDebounce(search.trim(), 400)

  // Every unique combination of inputs is one "query".
  // We're loading whenever the last finished query isn't the current one.
  const queryKey = `${debouncedSearch}|${page}|${reloadCount}`
  const [result, setResult] = useState({ key: null, products: [], pagination: null, error: null })
  const loading = result.key !== queryKey

  useEffect(() => {
    const controller = new AbortController()

    getProducts({ search: debouncedSearch, page, limit: LIMIT, signal: controller.signal })
      .then(({ data, pagination }) =>
        setResult({ key: queryKey, products: data, pagination, error: null })
      )
      .catch((err) => {
        if (controller.signal.aborted) return // replaced by a newer request
        setResult((prev) => ({
          ...prev,
          key: queryKey,
          error: getErrorMessage(err, 'Failed to load products'),
        }))
      })

    // A newer search/page cancels this request -> old results never overwrite new ones
    return () => controller.abort()
  }, [debouncedSearch, page, queryKey])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1) // new search always starts on page 1
  }

  const handleAdd = (product) => {
    if (addItem(product)) toast.success(`${product.name} added to cart`)
    else toast.error('No more stock available for this product')
  }

  const { products, pagination, error } = result
  const firstLoad = loading && result.key === null

  const ActionButton = ({ product }) => {
    if (!canCreate) return null
    const inCart = getQty(product.sku)
    const soldOut = product.stock_qty === 0
    const maxed = inCart >= product.stock_qty
    return (
      <button
        onClick={() => handleAdd(product)}
        disabled={soldOut || maxed}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {soldOut ? 'Unavailable' : inCart ? `Add more (${inCart} in cart)` : 'Add to cart'}
      </button>
    )
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">Browse available stock{canCreate && ' and add items to your cart'}</p>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or SKU…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {loading && !firstLoad && <Spinner size="sm" className="absolute right-3 top-2.5" />}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setReloadCount((c) => c + 1)} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      {firstLoad ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !error && products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          {debouncedSearch ? `No products match "${debouncedSearch}"` : 'No products available'}
        </div>
      ) : (
        <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  {canCreate && <th className="px-4 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{p.sku}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-center"><StockBadge qty={p.stock_qty} /></td>
                    {canCreate && (
                      <td className="px-4 py-3 text-right"><ActionButton product={p} /></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="grid gap-3 md:hidden">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-gray-500">{p.sku}</p>
                  </div>
                  <StockBadge qty={p.stock_qty} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">{formatCurrency(p.price)}</span>
                  <ActionButton product={p} />
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} disabled={loading} />
        </div>
      )}
    </section>
  )
}