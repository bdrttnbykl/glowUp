import { monthLabels, weekDayLongLabels } from './constants'
import type { CashReportPeriod } from './types'

export const normalizePhoneInput = (value: string) => {
  return value.replace(/\D/g, '').slice(0, 10)
}

export const getTodayDateInputValue = () => new Date().toISOString().split('T')[0]

export const createDateFromIso = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export const formatDateIso = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addDays = (isoDate: string, amount: number) => {
  const date = createDateFromIso(isoDate)
  date.setDate(date.getDate() + amount)
  return formatDateIso(date)
}

export const addMonths = (isoDate: string, amount: number) => {
  const date = createDateFromIso(isoDate)
  date.setMonth(date.getMonth() + amount)
  return formatDateIso(date)
}

export const getStartOfWeek = (isoDate: string) => {
  const date = createDateFromIso(isoDate)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return formatDateIso(date)
}

export const getWeekDates = (isoDate: string) => {
  const weekStart = getStartOfWeek(isoDate)
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

export const getMonthGridDates = (isoDate: string) => {
  const monthDate = createDateFromIso(isoDate)
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const gridStart = createDateFromIso(formatDateIso(monthStart))
  const startDay = gridStart.getDay()
  gridStart.setDate(gridStart.getDate() - (startDay === 0 ? 6 : startDay - 1))
  const gridEnd = createDateFromIso(formatDateIso(monthEnd))
  const endDay = gridEnd.getDay()
  gridEnd.setDate(gridEnd.getDate() + (endDay === 0 ? 0 : 7 - endDay))

  const dates: string[] = []
  const cursor = createDateFromIso(formatDateIso(gridStart))
  while (cursor <= gridEnd) {
    dates.push(formatDateIso(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export const formatDisplayDate = (isoDate: string) => {
  const date = createDateFromIso(isoDate)
  return `${date.getDate()} ${monthLabels[date.getMonth()]} ${date.getFullYear()} ${weekDayLongLabels[(date.getDay() + 6) % 7]}`
}

export const formatWeekRangeLabel = (isoDate: string) => {
  const weekDates = getWeekDates(isoDate)
  const start = createDateFromIso(weekDates[0])
  const end = createDateFromIso(weekDates[6])

  return `${start.getDate()} ${monthLabels[start.getMonth()]} ${start.getFullYear()} ${weekDayLongLabels[(start.getDay() + 6) % 7]} - ${end.getDate()} ${monthLabels[end.getMonth()]} ${end.getFullYear()} ${weekDayLongLabels[(end.getDay() + 6) % 7]}`
}

export const formatMonthRangeLabel = (isoDate: string) => {
  const date = createDateFromIso(isoDate)
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return `${monthStart.getDate()} ${monthLabels[monthStart.getMonth()]} ${monthStart.getFullYear()} ${weekDayLongLabels[(monthStart.getDay() + 6) % 7]} - ${monthEnd.getDate()} ${monthLabels[monthEnd.getMonth()]} ${monthEnd.getFullYear()} ${weekDayLongLabels[(monthEnd.getDay() + 6) % 7]}`
}

export const getTimeSlotIndex = (timeValue: string | null) => {
  if (!timeValue) {
    return -1
  }

  const [hourText, minuteText] = timeValue.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return -1
  }

  return (hour - 13) * 2 + (minute >= 30 ? 1 : 0)
}

export const isPastAppointment = (dateValue: string | null, timeValue: string | null) => {
  if (!dateValue) {
    return false
  }

  const reference = createDateFromIso(dateValue)

  if (timeValue) {
    const [hourText, minuteText] = timeValue.split(':')
    const hour = Number(hourText)
    const minute = Number(minuteText)

    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      reference.setHours(hour, minute, 0, 0)
    } else {
      reference.setHours(23, 59, 59, 999)
    }
  } else {
    reference.setHours(23, 59, 59, 999)
  }

  return reference.getTime() < Date.now()
}

export const parseCurrencyValue = (value: string | null) => {
  if (!value) {
    return 0
  }

  const normalized = value
    .replace(/\s*TL/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '')

  const amount = Number.parseFloat(normalized)
  return Number.isFinite(amount) ? amount : 0
}

export const formatCurrencyValue = (value: number) => {
  return `${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`
}

export const isDateWithinReportPeriod = (
  dateValue: string | null,
  period: CashReportPeriod,
  referenceDate = new Date()
) => {
  if (!dateValue) {
    return false
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const periodStart = new Date(referenceDate)
  periodStart.setHours(0, 0, 0, 0)

  if (period === 'Bu hafta') {
    const day = periodStart.getDay()
    const diff = day === 0 ? -6 : 1 - day
    periodStart.setDate(periodStart.getDate() + diff)
  } else if (period === 'Bu ay') {
    periodStart.setDate(1)
  } else {
    periodStart.setMonth(0, 1)
  }

  return date.getTime() >= periodStart.getTime() && date.getTime() <= referenceDate.getTime()
}
