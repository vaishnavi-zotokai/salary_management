import client from './client'

export const getEmployees = ({ page = 1, page_size = 20, search = '', country = '' } = {}) =>
  client.get('/employees', { params: { page, page_size, search: search || undefined, country: country || undefined } })
    .then(r => r.data)

export const getEmployee = (id) =>
  client.get(`/employees/${id}`).then(r => r.data)

export const createEmployee = (data) =>
  client.post('/employees', data).then(r => r.data)

export const updateEmployee = (id, data) =>
  client.put(`/employees/${id}`, data).then(r => r.data)

export const deleteEmployee = (id) =>
  client.delete(`/employees/${id}`)

export const getInsights = ({ country, job_title } = {}) =>
  client.get('/insights', { params: { country, job_title: job_title || undefined } })
    .then(r => r.data)