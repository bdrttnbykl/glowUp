const reminderTimeZone = 'Europe/Istanbul'

const getDatePartsInTimeZone = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  })

  return formatter.formatToParts(date).reduce<Record<string, string>>((result, part) => {
    if (part.type !== 'literal') {
      result[part.type] = part.value
    }

    return result
  }, {})
}

export const getTargetReminderDateIso = (daysAhead = 1, now = new Date()) => {
  const baseDateParts = getDatePartsInTimeZone(now, reminderTimeZone)
  const baseDate = new Date(
    Date.UTC(
      Number(baseDateParts.year),
      Number(baseDateParts.month) - 1,
      Number(baseDateParts.day)
    )
  )

  baseDate.setUTCDate(baseDate.getUTCDate() + daysAhead)

  const year = `${baseDate.getUTCFullYear()}`
  const month = `${baseDate.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${baseDate.getUTCDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const formatAppointmentReminderTime = (value: string | null) => {
  if (!value) {
    return null
  }

  return value.slice(0, 5)
}

export const buildWhatsAppAppointmentReminderText = ({
  businessName,
  customerName,
  serviceName,
  time,
}: {
  businessName: string
  customerName: string | null
  serviceName: string
  time: string | null
}) => {
  const safeCustomerName = customerName?.trim() || 'Degerli musterimiz'
  const safeServiceName = serviceName.trim() || 'randevu'
  const safeTime = time ? `yarin saat ${time}` : 'yarin'

  return [
    `Merhaba ${safeCustomerName},`,
    `${businessName}'nde ${safeTime} icin ${safeServiceName} randevunuz bulunuyor.`,
    'Iyi gunler dileriz.',
  ].join('\n')
}
