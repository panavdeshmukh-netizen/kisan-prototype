export interface ServiceProvider {
  id: number
  user_id: number
  name: string
  email: string
  specialization: string | null
  bio: string | null
  hourly_rate: number | null
  created_at: string
}

export interface ProviderResponse {
  success: boolean
  data: ServiceProvider
}

export interface ProvidersListResponse {
  success: boolean
  count: number
  data: ServiceProvider[]
}
