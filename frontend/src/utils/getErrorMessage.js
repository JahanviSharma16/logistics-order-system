export default function getErrorMessage(error, fallback = 'Something went wrong') {
    if (!error.response) return 'Cannot reach the server. Is the backend running?'
    const { message, errors } = error.response.data || {}
    if (Array.isArray(errors) && errors.length) {
      return errors.map((e) => `${e.field}: ${e.message}`).join(', ')
    }
    return message || fallback
  }