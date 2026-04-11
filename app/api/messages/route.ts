import { NextResponse } from 'next/server'

type MessagePayload = {
  channel?: 'email' | 'sms'
  customerName?: string
  email?: string | null
  phone?: string | null
  subject?: string
  text?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeTurkishPhone = (value: string) => {
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

const parseProviderError = async (response: Response) => {
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

const sendSmsViaTwilio = async (phone: string, text: string) => {
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

const sendEmailViaResend = async (email: string, subject: string, text: string) => {
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

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MessagePayload
    const channel = payload.channel
    const text = payload.text?.trim()

    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'Gecersiz mesaj kanali.' }, { status: 400 })
    }

    if (!text) {
      return NextResponse.json({ error: 'Mesaj bos olamaz.' }, { status: 400 })
    }

    if (channel === 'sms') {
      const phone = payload.phone?.trim()
      const normalizedPhone = phone ? normalizeTurkishPhone(phone) : null

      if (!normalizedPhone) {
        return NextResponse.json(
          { error: 'SMS icin gecerli bir telefon numarasi gerekli.' },
          { status: 400 }
        )
      }

      await sendSmsViaTwilio(normalizedPhone, text)
      return NextResponse.json({ ok: true })
    }

    const email = payload.email?.trim().toLowerCase()
    const subject = payload.subject?.trim() || `${payload.customerName || 'glowUp'} bildirimi`

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json(
        { error: 'Email gonderimi icin gecerli bir email adresi gerekli.' },
        { status: 400 }
      )
    }

    await sendEmailViaResend(email, subject, text)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Mesaj gonderilemedi.',
      },
      { status: 500 }
    )
  }
}
