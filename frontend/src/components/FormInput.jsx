export default function FormInput({ label, error, id, as = 'input', children, ...props }) {
    const Field = as
    const base =
      'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2'
    const state = error
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
  
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <Field id={id} className={`${base} ${state}`} {...props}>
          {children}
        </Field>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }