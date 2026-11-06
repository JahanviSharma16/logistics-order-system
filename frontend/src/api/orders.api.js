import client from './client'

export const createOrder = (items) => client.post('/orders', { items }).then((r) => r.data.data)

export const getOrders = ({ status, from, to, page = 1, limit = 10, signal } = {}) =>
  client
    .get('/orders', {
      params: {
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        limit,
      },
      signal,
    })
    .then((r) => r.data)

export const cancelOrder = (id) => client.post(`/orders/${id}/cancel`).then((r) => r.data.data)

export const confirmOrder = (id) => client.post(`/orders/${id}/confirm`).then((r) => r.data.data)
