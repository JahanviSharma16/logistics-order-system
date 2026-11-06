import client from './client'

export const loginApi = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data.data)

export const registerApi = (payload) =>
  client.post('/auth/register', payload).then((r) => r.data.data)
