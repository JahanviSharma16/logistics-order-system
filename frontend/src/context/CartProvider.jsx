import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './cart-context'
import useAuth from '../hooks/useAuth'

const loadCart = (key) => {
  if (!key) return []
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}


export default function CartProvider({ children }) {
  const { user } = useAuth()
  const storageKey = user ? `cart_${user.id}` : null

  const [cart, setCart] = useState(() => ({ key: storageKey, items: loadCart(storageKey) }))

  if (cart.key !== storageKey) {
    setCart({ key: storageKey, items: loadCart(storageKey) })
  }

  useEffect(() => {
    if (cart.key) localStorage.setItem(cart.key, JSON.stringify(cart.items))
  }, [cart])

  const setItems = useCallback(
    (updater) => setCart((prev) => ({ ...prev, items: updater(prev.items) })),
    []
  )

  const addItem = useCallback(
    (product, qty = 1) => {
      const existing = cart.items.find((i) => i.sku === product.sku)
      const canAdd = Math.min(qty, product.stock_qty - (existing?.qty || 0))
      if (canAdd <= 0) return false

      setItems((items) =>
        existing
          ? items.map((i) =>
              i.sku === product.sku
                ? { ...i, qty: i.qty + canAdd, stock: product.stock_qty, price: product.price }
                : i
            )
          : [
              ...items,
              {
                product_id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.price,
                stock: product.stock_qty,
                qty: canAdd,
              },
            ]
      )
      return true
    },
    [cart.items, setItems]
  )

  const updateQty = useCallback(
    (sku, qty) =>
      setItems((items) =>
        items.map((i) =>
          i.sku === sku ? { ...i, qty: Math.max(1, Math.min(Number(qty) || 1, i.stock)) } : i
        )
      ),
    [setItems]
  )

  const removeItem = useCallback(
    (sku) => setItems((items) => items.filter((i) => i.sku !== sku)),
    [setItems]
  )

  const clearCart = useCallback(() => setItems(() => []), [setItems])

  const value = useMemo(() => {
    const items = cart.items
    return {
      items,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      getQty: (sku) => items.find((i) => i.sku === sku)?.qty || 0,
      totalItems: items.reduce((sum, i) => sum + i.qty, 0),
      totalAmount: items.reduce((sum, i) => sum + Math.round(i.price * 100) * i.qty, 0) / 100,
    }
  }, [cart.items, addItem, updateQty, removeItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}