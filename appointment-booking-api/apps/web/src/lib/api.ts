import axios from 'axios'
import type {
  AuthResponse,
  ProfileResponse,
  RegisterResponse,
} from '../types/auth'
import type { ProviderResponse, ProvidersListResponse } from '../types/provider'
import type {
  CreateSlotInput,
  SlotsResponse,
  TimeSlot,
  UpdateSlotInput,
} from '../types/slot'
import type {
  AppointmentsResponse,
  SingleAppointmentResponse,
} from '../types/appointment'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject JWT token into every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith('/login')
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const api = {
  auth: {
    login: async (credentials: {
      email: string
      password: string
    }): Promise<AuthResponse> => {
      const res = await apiClient.post<AuthResponse>('/auth/login', credentials)
      return res.data
    },
    register: async (data: {
      name: string
      email: string
      password: string
      role: 'client' | 'provider'
    }): Promise<RegisterResponse> => {
      const res = await apiClient.post<RegisterResponse>('/auth/register', data)
      return res.data
    },
  },
  users: {
    getProfile: async (): Promise<ProfileResponse> => {
      const res = await apiClient.get<ProfileResponse>('/users/profile')
      return res.data
    },
    updateProfile: async (data: {
      name?: string
      email?: string
    }): Promise<ProfileResponse> => {
      const res = await apiClient.put<ProfileResponse>('/users/profile', data)
      return res.data
    },
    changePassword: async (passwords: {
      oldPassword: string
      newPassword: string
      confirmPassword: string
    }): Promise<{ success: boolean; message: string }> => {
      const res = await apiClient.put('/users/password', passwords)
      return res.data
    },
  },
  providers: {
    getProviders: async (): Promise<ProvidersListResponse> => {
      const res = await apiClient.get<ProvidersListResponse>('/providers')
      return res.data
    },
    getProviderProfile: async (): Promise<ProviderResponse> => {
      const res = await apiClient.get<ProviderResponse>('/providers/profile')
      return res.data
    },
    updateProviderProfile: async (data: {
      specialization?: string
      bio?: string
      hourly_rate?: number
    }): Promise<ProviderResponse> => {
      const res = await apiClient.put<ProviderResponse>(
        '/providers/profile',
        data,
      )
      return res.data
    },
  },
  slots: {
    getAvailableSlots: async (
      providerId: number,
      date?: string,
    ): Promise<SlotsResponse> => {
      const params = date ? { date } : {}
      const res = await apiClient.get<SlotsResponse>(
        `/time-slots/available/${providerId}`,
        { params },
      )
      return res.data
    },
    getMySlots: async (date?: string): Promise<SlotsResponse> => {
      const params = date ? { date } : {}
      const res = await apiClient.get<SlotsResponse>('/time-slots/my-slots', {
        params,
      })
      return res.data
    },
    createSlot: async (
      data: CreateSlotInput,
    ): Promise<{ success: boolean; data: TimeSlot }> => {
      const res = await apiClient.post<{ success: boolean; data: TimeSlot }>(
        '/time-slots',
        data,
      )
      return res.data
    },
    updateSlot: async (
      slotId: number,
      data: UpdateSlotInput,
    ): Promise<{ success: boolean; data: TimeSlot }> => {
      const res = await apiClient.put<{ success: boolean; data: TimeSlot }>(
        `/time-slots/${slotId}`,
        data,
      )
      return res.data
    },
    deleteSlot: async (
      slotId: number,
    ): Promise<{ success: boolean; message: string }> => {
      const res = await apiClient.delete(`/time-slots/${slotId}`)
      return res.data
    },
  },
  appointments: {
    bookAppointment: async (
      timeSlotId: number,
    ): Promise<SingleAppointmentResponse> => {
      const res = await apiClient.post<SingleAppointmentResponse>(
        '/appointments',
        {
          time_slot_id: timeSlotId,
        },
      )
      return res.data
    },
    getMyAppointments: async (
      status?: string,
    ): Promise<AppointmentsResponse> => {
      const params = status ? { status } : {}
      const res = await apiClient.get<AppointmentsResponse>(
        '/appointments/my-appointments',
        { params },
      )
      return res.data
    },
    getProviderAppointments: async (
      providerId: number,
      status?: string,
    ): Promise<AppointmentsResponse> => {
      const params = status ? { status } : {}
      const res = await apiClient.get<AppointmentsResponse>(
        `/appointments/provider/${providerId}`,
        { params },
      )
      return res.data
    },
    cancelAppointment: async (
      appointmentId: number,
    ): Promise<SingleAppointmentResponse> => {
      const res = await apiClient.put<SingleAppointmentResponse>(
        `/appointments/${appointmentId}/cancel`,
      )
      return res.data
    },
    completeAppointment: async (
      appointmentId: number,
    ): Promise<SingleAppointmentResponse> => {
      const res = await apiClient.put<SingleAppointmentResponse>(
        `/appointments/${appointmentId}/complete`,
      )
      return res.data
    },
  },
}
