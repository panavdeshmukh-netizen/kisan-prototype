export type AppointmentStatus = 'booked' | 'completed' | 'cancelled'

export interface Appointment {
  id: number
  client_id: number
  provider_id: number
  time_slot_id: number
  status: AppointmentStatus
  created_at: string
  updated_at?: string
  client_name?: string
  client_email?: string
  provider_name?: string
  provider_user_id?: number
  specialization?: string | null
  slot_date: string
  start_time: string
  end_time: string
  duration: number
}

export interface AppointmentsResponse {
  success: boolean
  count: number
  data: Appointment[]
}

export interface SingleAppointmentResponse {
  success: boolean
  data: Appointment
}
