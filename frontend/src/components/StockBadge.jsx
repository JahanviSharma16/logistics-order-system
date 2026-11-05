export default function StockBadge({ qty }) {
    if (qty === 0)
      return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Out of stock</span>
    if (qty <= 5)
      return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Low · {qty}</span>
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{qty}</span>
  }