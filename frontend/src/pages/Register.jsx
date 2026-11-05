import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth'
import FormInput from '../components/FormInput'
import Spinner from '../components/Spinner'
import getErrorMessage from '../utils/getErrorMessage'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialForm = { email: '', password: '', confirmPassword: '', role: 'USER', access: 'CREATE' }

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Same rules as the backend validator
  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!EMAIL_REGEX.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match'
    if (!['ADMIN', 'USER'].includes(form.role)) e.role = 'Select a role'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.role === 'USER' && { access: form.access }),
      })
      toast.success('Account created. Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
      >
        <div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-gray-500">Logistics Order System</p>
        </div>

        <FormInput
          id="email" name="email" type="email" label="Email" autoComplete="email"
          value={form.email} onChange={handleChange} error={errors.email}
        />
        <FormInput
          id="password" name="password" type="password" label="Password" autoComplete="new-password"
          value={form.password} onChange={handleChange} error={errors.password}
        />
        <FormInput
          id="confirmPassword" name="confirmPassword" type="password" label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
        />
        <FormInput
          as="select" id="role" name="role" label="Role"
          value={form.role} onChange={handleChange} error={errors.role}
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </FormInput>

        {form.role === 'USER' && (
          <FormInput
            as="select" id="access" name="access" label="Access"
            value={form.access} onChange={handleChange}
          >
            <option value="CREATE">Create (can place orders)</option>
            <option value="VIEW">View only</option>
          </FormInput>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting && <Spinner size="sm" className="border-white border-t-transparent" />}
          {submitting ? 'Creating…' : 'Register'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}