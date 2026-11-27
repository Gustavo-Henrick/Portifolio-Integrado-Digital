import { request } from './portfolio.js'

export function readSession(signal) {
  return request('/usuarios/me', { signal })
}

export function login(data) {
  return request('/usuarios/login', { method: 'POST', data })
}

export function logout() {
  return request('/usuarios/logout', { method: 'POST' })
}

