import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data)

export const getMe = () => api.get('/auth/me').then((r) => r.data)

export const getWarehouses = () =>
  api.get('/warehouses').then((r) => r.data)

export const createWarehouse = (data) =>
  api.post('/warehouses', data).then((r) => r.data)

export const getLocations = (warehouseId) =>
  api.get('/locations', { params: { warehouse_id: warehouseId } }).then((r) => r.data)

export const createLocation = (data) =>
  api.post('/locations', data).then((r) => r.data)

export const getCategories = () =>
  api.get('/categories').then((r) => r.data)

export const createCategory = (data) =>
  api.post('/categories', data).then((r) => r.data)

export const getProducts = () =>
  api.get('/products').then((r) => r.data)

export const createProduct = (data) =>
  api.post('/products', data).then((r) => r.data)

export const getInventory = (params) =>
  api.get('/inventory', { params }).then((r) => r.data)

export const getInventorySummary = () =>
  api.get('/inventory/summary').then((r) => r.data)

export const getReceipts = () =>
  api.get('/receipts').then((r) => r.data)

export const createReceipt = (data) =>
  api.post('/receipts', data).then((r) => r.data)

export const receiveReceipt = (id) =>
  api.post(`/receipts/${id}/receive`).then((r) => r.data)

export const getOrders = (status) =>
  api.get('/orders', { params: { status } }).then((r) => r.data)

export const createOrder = (data) =>
  api.post('/orders', data).then((r) => r.data)

export const getOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data)

export const assignPicking = (orderId, userId) =>
  api.post(`/picking/assign/${orderId}`, { user_id: userId }).then((r) => r.data)

export const getPickingTasks = (status) =>
  api.get('/picking/tasks', { params: { status } }).then((r) => r.data)

export const completePicking = (taskId) =>
  api.post(`/picking/${taskId}/complete`).then((r) => r.data)

export const getShipments = () =>
  api.get('/shipments').then((r) => r.data)

export const createShipment = (orderId, tracking) =>
  api.post(`/shipments/create/${orderId}`, { tracking_number: tracking }).then((r) => r.data)

export const dispatchShipment = (id) =>
  api.post(`/shipments/${id}/dispatch`).then((r) => r.data)

export const getAlerts = (unread) =>
  api.get('/alerts', { params: { unread_only: unread } }).then((r) => r.data)

export const markAlertRead = (id) =>
  api.post(`/alerts/${id}/read`).then((r) => r.data)

export const generateAlerts = () =>
  api.post('/alerts/generate').then((r) => r.data)

export const getDashboard = () =>
  api.get('/dashboard').then((r) => r.data)

export default api
