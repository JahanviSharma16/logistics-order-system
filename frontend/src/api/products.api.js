import client from './client'

export const getProducts = ({ search = '', page = 1, limit = 10 } = {}) =>
  client
    .get('/products', { params: { search: search || undefined, page, limit } })
    .then((r) => r.data) // { data, pagination }