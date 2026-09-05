export interface TimeSlot {
  id: number
  provider_id: number
  slot_date: string
  start_time: string
  end_time: string
  duration: number
  is_booked: boolean
  created_at: string
}

export interface CreateSlotInput {
  slot_date: string
  start_time: string
  end_time: string
  duration: number
}

export interface UpdateSlotInput {
  slot_date?: string
  start_time?: string
  end_time?: string
  duration?: number
}

export interface SlotsResponse {
  success: boolean
  count: number
  data: TimeSlot[]
}
