import { NextResponse } from 'next/server'

import {
  isValidEmailAddress,
  normalizeTurkishPhone,
  sendEmailViaResend,
  sendSmsViaTwilio,
} from '@/lib/outbound-messages'

type MessagePayload = {
  channel?: 'email' | 'sms'
  customerName?: string
  email?: string | null
  phone?: string | null
  subject?: string
  text?: string
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

    if (!email || !isValidEmailAddress(email)) {
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
