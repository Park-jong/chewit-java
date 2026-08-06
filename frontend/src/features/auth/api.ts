import { api } from '@/lib/api'
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  UserResponse,
} from './types'

export async function signup(request: SignupRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/signup', request)
  return data
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', request)
  return data
}

export async function fetchCurrentUser(): Promise<UserResponse> {
  const { data } = await api.get<UserResponse>('/auth/me')
  return data
}
