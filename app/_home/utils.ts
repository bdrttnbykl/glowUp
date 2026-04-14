import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { monthLabels, weekDayLongLabels } from './constants'
import type { CashReportPeriod } from './types'

export const normalizePhoneInput = (value: string) => {
  return value.replace(/\D/g, '').slice(0, 10)
}

export const normalizeWhatsAppPhone = (value: string | null) => {
  if (!value) {
    return null
  }

  const digits = value.replace(/[^\d+]/g, '').replace(/\D/g, '')

  if (digits.length === 10) {
    return `90${digits}`
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return `90${digits.slice(1)}`
  }

  if (digits.length === 12 && digits.startsWith('90')) {
    return digits
  }

  return null
}

export const createWhatsAppLink = (phone: string, text: string) => {
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
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

export const formatDateLabelForReminder = (isoDate: string | null) => {
  if (!isoDate) {
    return 'yakinda'
  }

  const today = getTodayDateInputValue()
  const tomorrow = addDays(today, 1)

  if (isoDate === today) {
    return 'bugun'
  }

  if (isoDate === tomorrow) {
    return 'yarin'
  }

  return formatDisplayDate(isoDate)
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

export const normalizeAppointmentServiceStatus = (
  attendanceStatus: string | null,
  serviceStatus: string | null
) => {
  if (attendanceStatus !== 'Geldi') {
    return 'Yapilmadi'
  }

  return serviceStatus === 'Yapilmadi' ? 'Yapilmadi' : 'Yapildi'
}

export const isCompletedAppointmentService = (
  attendanceStatus: string | null,
  serviceStatus: string | null
) => {
  return (
    attendanceStatus === 'Geldi' &&
    normalizeAppointmentServiceStatus(attendanceStatus, serviceStatus) === 'Yapildi'
  )
}

export const shouldConsumeAppointmentPackageSession = (
  attendanceStatus: string | null,
  serviceStatus: string | null
) => {
  if (attendanceStatus === 'Gelmedi') {
    return true
  }

  return isCompletedAppointmentService(attendanceStatus, serviceStatus)
}

export const formatAppointmentOutcomeLabel = (
  attendanceStatus: string | null,
  serviceStatus: string | null
) => {
  if (!attendanceStatus) {
    return '-'
  }

  if (attendanceStatus !== 'Geldi') {
    return attendanceStatus
  }

  return `${attendanceStatus} / ${normalizeAppointmentServiceStatus(attendanceStatus, serviceStatus)}`
}

export const buildWhatsAppAppointmentReminderMessage = ({
  businessName,
  customerName,
  date,
  serviceName,
  time,
}: {
  businessName: string
  customerName: string | null
  date: string | null
  serviceName: string
  time: string | null
}) => {
  const safeCustomerName = customerName?.trim() || 'Degerli musterimiz'
  const safeServiceName = serviceName.trim() || 'randevu'
  const safeDateLabel = formatDateLabelForReminder(date)
  const safeTime = time ? ` saat ${time.slice(0, 5)}` : ''

  return [
    `Merhaba ${safeCustomerName},`,
    `${businessName}'nde ${safeDateLabel}${safeTime} icin ${safeServiceName} randevunuz bulunuyor.`,
    'Bu bir hatirlatma mesajidir. Iyi gunler dileriz.',
  ].join('\n')
}

type DownloadPdfOptions = {
  filename: string
  orientation?: 'landscape' | 'portrait'
  rows: string[][]
  title: string
}

let pdfFontBase64Promise: Promise<string> | null = null

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return btoa(binary)
}

const getPdfFontBase64 = async () => {
  if (!pdfFontBase64Promise) {
    pdfFontBase64Promise = fetch('/fonts/arial.ttf').then(async (response) => {
      if (!response.ok) {
        throw new Error('PDF fontu yuklenemedi.')
      }

      return arrayBufferToBase64(await response.arrayBuffer())
    })
  }

  return pdfFontBase64Promise
}

const applyPdfFont = async (doc: jsPDF) => {
  try {
    const fontBase64 = await getPdfFontBase64()
    doc.addFileToVFS('Arial.ttf', fontBase64)
    doc.addFont('Arial.ttf', 'ArialUnicode', 'normal')
    doc.addFont('Arial.ttf', 'ArialUnicode', 'bold')
    return 'ArialUnicode'
  } catch {
    return 'helvetica'
  }
}

export const downloadPdfFile = async ({
  filename,
  orientation = 'portrait',
  rows,
  title,
}: DownloadPdfOptions) => {
  if (typeof window === 'undefined') {
    return
  }

  const [headRow, ...bodyRows] = rows
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
    compress: true,
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const fontName = await applyPdfFont(doc)

  doc.setFont(fontName, 'bold')
  doc.setFontSize(16)
  doc.text(title, 40, 40)
  doc.setFont(fontName, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(new Date().toLocaleString('tr-TR'), pageWidth - 40, 40, { align: 'right' })

  autoTable(doc, {
    head: [headRow],
    body: bodyRows,
    startY: 56,
    margin: { left: 24, right: 24, top: 56, bottom: 24 },
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [83, 123, 180],
      textColor: [255, 255, 255],
      font: fontName,
      fontStyle: 'bold',
    },
    bodyStyles: {
      font: fontName,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 251, 255],
    },
    theme: 'grid',
  })

  doc.save(filename)
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
