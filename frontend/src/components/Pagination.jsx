export default function Pagination({ pagination, onPageChange, disabled = false }) {
  if (!pagination || pagination.total === 0) return null
  const { page, limit, total, totalPages } = pagination

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const btn =
    'min-w-9 rounded-md border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-gray-600">
        Showing <b>{from}</b>–<b>{to}</b> of <b>{total}</b>
      </p>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <button
            className={`${btn} border-gray-300 bg-white hover:bg-gray-100`}
            disabled={disabled || page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          {pages.map((p) => (
            <button
              key={p}
              disabled={disabled}
              onClick={() => onPageChange(p)}
              className={`${btn} ${
                p === page
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            className={`${btn} border-gray-300 bg-white hover:bg-gray-100`}
            disabled={disabled || page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
