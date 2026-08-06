export interface UserResponse {
  id: number
  email: string
  displayName: string
}

export interface AuthResponse {
  token: string
  user: UserResponse
}

export interface SignupRequest {
  email: string
  password: string
  displayName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ApiErrorBody {
  status: number
  message: string
  timestamp: string
}
