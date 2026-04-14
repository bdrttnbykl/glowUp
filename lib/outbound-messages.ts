const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmailAddress = (value: string) => emailPattern.test(value.trim().toLowerCase())

export const parseProviderError = async (response: Response) => {
  const responseText = await response.text()

  try {
    const payload = JSON.parse(responseText) as {
      errors?: Array<{ message?: string }>
      message?: string
    }

    return payload.errors?.[0]?.message || payload.message || responseText
  } catch {
    return responseText
  }
}

export const normalizeTurkishPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 10) {
    return `+90${digits}`
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return `+90${digits.slice(1)}`
  }

  if (digits.length === 12 && digits.startsWith('90')) {
    return `+${digits}`
  }

  if (value.startsWith('+') && digits.length >= 11) {
    return `+${digits}`
  }

  return null
}

export const normalizeWhatsAppPhone = (value: string) => {
  const normalizedPhone = normalizeTurkishPhone(value)

  if (!normalizedPhone) {
    return null
  }

  return normalizedPhone.replace(/\D/g, '')
}

export const sendSmsViaTwilio = async (phone: string, text: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken) {
    throw new Error('Twilio ayarlari eksik. TWILIO_ACCOUNT_SID ve TWILIO_AUTH_TOKEN gir.')
  }

  if (!messagingServiceSid && !fromNumber) {
    throw new Error(
      'Twilio gonderici ayari eksik. TWILIO_MESSAGING_SERVICE_SID veya TWILIO_FROM_NUMBER gir.'
    )
  }

  const body = new URLSearchParams({
    To: phone,
    Body: text,
  })

  if (messagingServiceSid) {
    body.set('MessagingServiceSid', messagingServiceSid)
  } else if (fromNumber) {
    body.set('From', fromNumber)
  }

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  )

  if (!response.ok) {
    throw new Error(await parseProviderError(response))
  }
}

export const sendEmailViaResend = async (email: string, subject: string, text: string) => {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    throw new Error('Resend ayarlari eksik. RESEND_API_KEY ve RESEND_FROM_EMAIL gir.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'glowup/1.0',
    },
    body: JSON.stringify({
      from: fromEmail,
      subject,
      text,
      to: [email],
    }),
  })

  if (!response.ok) {
    throw new Error(await parseProviderError(response))
  }
}

export const sendWhatsAppViaEvolution = async (phone: string, text: string) => {
  const baseUrl = process.env.EVOLUTION_API_BASE_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_API_INSTANCE

  if (!baseUrl || !apiKey || !instance) {
    throw new Error(
      'Evolution API ayarlari eksik. EVOLUTION_API_BASE_URL, EVOLUTION_API_KEY ve EVOLUTION_API_INSTANCE gir.'
    )
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`,
    {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        delay: 1200,
        linkPreview: false,
        number: phone,
        text,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(await parseProviderError(response))
  }
}
