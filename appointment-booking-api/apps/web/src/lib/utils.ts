import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats date into a human-readable string like "Tue, Aug 25, 2026" or "Aug 25, 2026"
 * Safely handles ISO strings (e.g. "2026-08-24T23:00:00.000Z") or raw date strings ("2026-08-25")
 */
export function formatDate(
  dateInput?: string | Date | null,
  options: { short?: boolean } = {},
): string {
  if (!dateInput) return ''
  try {
    let date: Date

    if (typeof dateInput === 'string') {
      // Check if it's pure YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else if (dateInput.includes('T')) {
        const [datePart] = dateInput.split('T')
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          const [year, month, day] = datePart.split('-').map(Number)
          date = new Date(year, month - 1, day)
        } else {
          date = new Date(dateInput)
        }
      } else {
        date = new Date(dateInput)
      }
    } else {
      date = dateInput
    }

    if (isNaN(date.getTime())) return String(dateInput)

    if (options.short) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return String(dateInput)
  }
}

/**
 * Formats time string (e.g. "09:00:00" or "14:30") into 12h format like "9:00 AM" or "2:30 PM"
 */
export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return ''
  try {
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10)
      const mins = parts[1]
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${displayHours}:${mins} ${period}`
    }
    return timeStr
  } catch {
    return timeStr
  }
}

/**
 * Formats time slot range (e.g. "09:00:00", "10:00:00") into "9:00 AM – 10:00 AM"
 */
export function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (!startTime) return ''
  const start = formatTime(startTime)
  if (!endTime) return start
  const end = formatTime(endTime)
  return `${start} – ${end}`
}
