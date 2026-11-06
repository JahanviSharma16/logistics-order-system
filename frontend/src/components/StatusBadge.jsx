const STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-200 text-gray-600',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status] || 'bg-gray-100'}`}
    >
      {status}
    </span>
  )
}
