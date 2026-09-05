import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { formatDate, formatTime } from '../lib/utils'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, token, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const activeToken = token || localStorage.getItem('token')

    if (!isAuthenticated || !user || !activeToken) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Connect to Socket.IO backend with auth token
    const socketInstance = io('/', {
      path: '/socket.io',
      auth: {
        token: activeToken,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      console.log('⚡ Socket connected to server with user ID:', user.id)
    })

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message)
      setIsConnected(false)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      setIsConnected(false)
    })

    // Listen for appointment booked event
    socketInstance.on('appointment:booked', (data: any) => {
      console.log('📩 Received appointment:booked event:', data)
      const appt = data.appointment || {}
      const isProviderView =
        user.role === 'provider' || data.type === 'appointment_booked'
      const clientName = appt.client?.name || data.client?.name || 'A client'
      const providerName =
        appt.provider?.name || data.provider?.name || 'your provider'
      const rawDate = appt.date || appt.slot_date || data.slot?.slot_date || ''
      const rawTime =
        appt.time || appt.start_time || data.slot?.start_time || ''
      const formattedDate = formatDate(rawDate)
      const formattedTime = formatTime(rawTime)

      if (isProviderView) {
        toast.info(`📅 New Booking from ${clientName}`, {
          description: `Session on ${formattedDate} at ${formattedTime}`,
          duration: 6000,
        })
      } else {
        toast.success(`🎉 Booking Confirmed with ${providerName}`, {
          description: `Appointment set for ${formattedDate} at ${formattedTime}`,
          duration: 6000,
        })
      }

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['available-slots'] })
    })

    // Listen for appointment cancelled event
    socketInstance.on('appointment:cancelled', (data: any) => {
      console.log('📩 Received appointment:cancelled event:', data)
      const appt = data.appointment || {}
      const rawDate = appt.date || appt.slot_date || data.slot_date || ''
      const rawTime = appt.time || appt.start_time || data.start_time || ''
      const formattedDate = formatDate(rawDate)
      const formattedTime = formatTime(rawTime)
      const message =
        data.message ||
        `Appointment on ${formattedDate} at ${formattedTime} was cancelled`

      toast.error(`❌ ${message}`, {
        description:
          rawDate && rawTime
            ? `${formattedDate} at ${formattedTime}`
            : undefined,
        duration: 6000,
      })

      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['available-slots'] })
    })

    // Listen for appointment completed event
    socketInstance.on('appointment:completed', (data: any) => {
      console.log('📩 Received appointment:completed event:', data)
      const appt = data.appointment || {}
      const providerName =
        appt.provider?.name || data.provider?.name || 'Your provider'

      toast.success(`✅ Appointment Completed`, {
        description: `${providerName} marked the appointment as completed`,
        duration: 6000,
      })

      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [isAuthenticated, user?.id, token])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = (): SocketContextType => {
  return useContext(SocketContext)
}
