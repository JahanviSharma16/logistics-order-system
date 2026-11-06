import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useCart from '../hooks/useCart'
import { createOrder } from '../api/orders.api'
import Spinner from '../components/Spinner'
import { formatCurrency } from '../utils/format'
import getErrorMessage from '../utils/getErrorMessage'

export default function Cart() {
  const { items, updateQty, removeItem, clearCart, totalItems, totalAmount } = useCart()
  const navigate = useNavigate()

  const [placing, setPlacing] = useState(false)
  const [itemErrors, setItemErrors] = useState({})

  const clearItemError = (sku) =>
    setItemErrors((prev) => {
      const next = { ...prev }
      delete next[sku]
      return next
    })

  const handleQtyChange = (sku, qty) => {
    updateQty(sku, qty)
    clearItemError(sku)
  }

  const handleRemove = (item) => {
    removeItem(item.sku)
    clearItemError(item.sku)
    toast.success(`${item.name} removed`)
  }

  const handlePlaceOrder = async () => {
    setPlacing(true)
    setItemErrors({})
    try {
      const order = await createOrder(items.map(({ sku, qty }) => ({ sku, qty })))
      clearCart()
      toast.success(`Order ${order.order_number} placed!`)
      navigate('/orders')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (Array.isArray(errors)) {
        setItemErrors(Object.fromEntries(errors.map((e) => [e.field, e.message])))
      }
      toast.error(getErrorMessage(err, 'Could not place order'))
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-gray-500">Add some products to place an order.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse products
        </Link>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cart</h1>
          <p className="text-sm text-gray-500">
            {totalItems} item{totalItems !== 1 && 's'} in your cart
          </p>
        </div>
        <button
          onClick={() => {
            clearCart()
            setItemErrors({})
          }}
          disabled={placing}
          className="text-sm text-red-600 hover:underline disabled:opacity-50"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const error = itemErrors[item.sku]
            return (
              <li
                key={item.sku}
                className={`rounded-xl border bg-white p-4 ${
                  error ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="font-mono text-xs text-gray-500">{item.sku}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatCurrency(item.price)} each · {item.stock} in stock
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => handleQtyChange(item.sku, item.qty - 1)}
                        disabled={placing || item.qty <= 1}
                        className="px-3 py-1.5 text-lg leading-none hover:bg-gray-100 disabled:opacity-30"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={item.stock}
                        value={item.qty}
                        disabled={placing}
                        onChange={(e) => handleQtyChange(item.sku, e.target.value)}
                        className="w-14 border-x border-gray-300 py-1.5 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        aria-label="Increase quantity"
                        onClick={() => handleQtyChange(item.sku, item.qty + 1)}
                        disabled={placing || item.qty >= item.stock}
                        className="px-3 py-1.5 text-lg leading-none hover:bg-gray-100 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <p className="w-28 text-right font-semibold">
                      {formatCurrency(item.price * item.qty)}
                    </p>

                    <button
                      onClick={() => handleRemove(item)}
                      disabled={placing}
                      aria-label={`Remove ${item.name}`}
                      className="rounded-md px-2 py-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </li>
            )
          })}
        </ul>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">Order summary</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Products</dt>
              <dd>{items.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Total items</dt>
              <dd>{totalItems}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
              <dt>Total amount</dt>
              <dd>{formatCurrency(totalAmount)}</dd>
            </div>
          </dl>

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {placing && <Spinner size="sm" className="border-white border-t-transparent" />}
            {placing ? 'Placing order…' : 'Place order'}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            Final prices and stock are confirmed by the server.
          </p>

          <Link
            to="/products"
            className="mt-3 block text-center text-sm text-blue-600 hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  )
}
