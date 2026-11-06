import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { cancelOrder, confirmOrder, getOrders } from '../api/orders.api'
import useAuth from '../hooks/useAuth'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency, formatDate } from '../utils/format'
import getErrorMessage from '../utils/getErrorMessage'

const LIMIT = 10
const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED']
const CANCELLABLE = ['PENDING', 'CONFIRMED']
const EMPTY_FILTERS = { status: '', from: '', to: '' }

const toStartOfDayISO = (d) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined)
const toEndOfDayISO = (d) => (d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined)

export default function Orders() {
  const { isAdmin, canCreate } = useAuth()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [reloadCount, setReloadCount] = useState(0)

  const queryKey = JSON.stringify({ ...filters, page, reloadCount })
  const [result, setResult] = useState({ key: null, orders: [], pagination: null, error: null })
  const loading = result.key !== queryKey

  const [action, setAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const dateRangeInvalid = filters.from && filters.to && filters.from > filters.to

  useEffect(() => {
    if (dateRangeInvalid) return
    const controller = new AbortController()

    getOrders({
      status: filters.status,
      from: toStartOfDayISO(filters.from),
      to: toEndOfDayISO(filters.to),
      page,
      limit: LIMIT,
      signal: controller.signal,
    })
      .then(({ data, pagination }) => {
        if (data.length === 0 && page > 1) {
          setPage(page - 1)
          return
        }
        setResult({ key: queryKey, orders: data, pagination, error: null })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setResult((prev) => ({
          ...prev,
          key: queryKey,
          error: getErrorMessage(err, 'Failed to load orders'),
        }))
      })

    return () => controller.abort()
  }, [filters, page, queryKey, dateRangeInvalid])

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const runAction = async () => {
    const { type, order } = action
    setActionLoading(true)
    try {
      if (type === 'cancel') {
        await cancelOrder(order.id)
        toast.success(`Order ${order.order_number} cancelled. Stock restored.`)
      } else {
        await confirmOrder(order.id)
        toast.success(`Order ${order.order_number} confirmed`)
      }
      setAction(null)
      setReloadCount((c) => c + 1)
    } catch (err) {
      toast.error(getErrorMessage(err, `Could not ${type} order`))
    } finally {
      setActionLoading(false)
    }
  }

  const { orders, pagination, error } = result
  const firstLoad = loading && result.key === null && !dateRangeInvalid
  const hasFilters = filters.status || filters.from || filters.to

  const renderActions = (order) => (
    <div className="flex justify-end gap-2">
      {isAdmin && order.status === 'PENDING' && (
        <button
          onClick={() => setAction({ type: 'confirm', order })}
          className="rounded-lg border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
        >
          Confirm
        </button>
      )}
      {canCreate && CANCELLABLE.includes(order.status) && (
        <button
          onClick={() => setAction({ type: 'cancel', order })}
          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Cancel
        </button>
      )}
    </div>
  )

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">{isAdmin ? 'All Orders' : 'My Orders'}</h1>
        <p className="text-sm text-gray-500">Newest first</p>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700">Status</span>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700">From</span>
          <input
            type="date"
            name="from"
            value={filters.from}
            max={filters.to || undefined}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700">To</span>
          <input
            type="date"
            name="to"
            value={filters.to}
            min={filters.from || undefined}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <button
          onClick={resetFilters}
          disabled={!hasFilters}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>

        {dateRangeInvalid && (
          <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-4">
            "From" date must be before or equal to "To" date.
          </p>
        )}
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
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !error && orders.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          {hasFilters ? 'No orders match these filters.' : "You haven't placed any orders yet."}
        </div>
      ) : (
        <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  {isAdmin && <th className="px-4 py-3">User</th>}
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{o.order_number}</td>
                    {isAdmin && <td className="px-4 py-3 text-gray-600">{o.user?.email}</td>}
                    <td className="px-4 py-3 text-gray-600">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {o.item_count}
                      <span className="block text-xs text-gray-400">
                        {o.product_count} product{o.product_count !== 1 && 's'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="px-4 py-3">{renderActions(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-medium">{o.order_number}</p>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
                    {isAdmin && <p className="text-xs text-gray-500">{o.user?.email}</p>}
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{formatCurrency(o.total_amount)}</p>
                    <p className="text-xs text-gray-500">{o.item_count} items</p>
                  </div>
                  {renderActions(o)}
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} disabled={loading} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(action)}
        loading={actionLoading}
        danger={action?.type === 'cancel'}
        title={action?.type === 'cancel' ? 'Cancel order?' : 'Confirm order?'}
        message={
          action?.type === 'cancel'
            ? `Order ${action?.order.order_number} will be cancelled and its stock returned to inventory.`
            : `Order ${action?.order.order_number} will be marked as CONFIRMED.`
        }
        confirmText={action?.type === 'cancel' ? 'Yes, cancel order' : 'Confirm order'}
        onConfirm={runAction}
        onClose={() => setAction(null)}
      />
    </section>
  )
}
