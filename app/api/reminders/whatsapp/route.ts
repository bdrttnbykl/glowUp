import { NextResponse } from 'next/server'

import {
  buildWhatsAppAppointmentReminderText,
  formatAppointmentReminderTime,
  getTargetReminderDateIso,
} from '@/lib/appointment-reminders'
import { ApiError, createServiceRoleClient } from '@/lib/supabase-server'
import { normalizeWhatsAppPhone, sendWhatsAppViaEvolution } from '@/lib/outbound-messages'

export const dynamic = 'force-dynamic'

type ReminderRequestPayload = {
  date?: string
  dryRun?: boolean
}

type ReminderAppointmentRow = {
  closed_at?: string | null
  created_at: string
  customer: string | null
  date: string | null
  id: number
  phone: string | null
  service: string
  status: string | null
  time: string | null
  user_id: string
  whatsapp_reminder_sent_for_date: string | null
}

const reminderSecretHeaderNames = ['authorization', 'x-reminder-secret'] as const

const getReminderSecret = (request: Request) => {
  const configuredSecret = process.env.CRON_SECRET || process.env.REMINDER_CRON_SECRET

  if (!configuredSecret) {
    throw new ApiError(500, 'CRON_SECRET veya REMINDER_CRON_SECRET eksik.')
  }

  for (const headerName of reminderSecretHeaderNames) {
    const headerValue = request.headers.get(headerName)

    if (!headerValue) {
      continue
    }

    if (headerName === 'authorization' && headerValue === `Bearer ${configuredSecret}`) {
      return configuredSecret
    }

    if (headerName === 'x-reminder-secret' && headerValue === configuredSecret) {
      return configuredSecret
    }
  }

  throw new ApiError(401, 'Hatirlatma istegi yetkisiz.')
}

const isValidDateInput = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const executeReminderRun = async (request: Request, payload: ReminderRequestPayload) => {
  getReminderSecret(request)

  const targetDate = payload.date?.trim() || getTargetReminderDateIso(1)
  const isDryRun = payload.dryRun === true

  if (!isValidDateInput(targetDate)) {
    throw new ApiError(400, 'Reminder tarihi YYYY-MM-DD formatinda olmali.')
  }

  const adminClient = createServiceRoleClient()
  const { data: appointments, error: appointmentsError } = await adminClient
    .from('appointments')
    .select(
      'id, user_id, customer, phone, service, date, time, status, created_at, whatsapp_reminder_sent_for_date, closed_at'
    )
    .eq('date', targetDate)
    .is('closed_at', null)
    .order('time', { ascending: true })

  if (appointmentsError) {
    throw new ApiError(500, 'Hatirlatma randevulari okunamadi.')
  }

  const eligibleAppointments = ((appointments || []) as ReminderAppointmentRow[]).filter(
    (appointment) =>
      appointment.date === targetDate &&
      appointment.whatsapp_reminder_sent_for_date !== targetDate &&
      appointment.status !== 'Iptal'
  )

  const summary = {
    dryRun: isDryRun,
    failed: 0,
    skipped: 0,
    sent: 0,
    targetDate,
    total: eligibleAppointments.length,
  }

  const results: Array<{
    appointmentId: number
    customer: string | null
    message: string
    phone: string | null
    status: 'failed' | 'sent' | 'skipped'
  }> = []

  for (const appointment of eligibleAppointments) {
    const normalizedPhone = appointment.phone ? normalizeWhatsAppPhone(appointment.phone) : null
    const messageText = buildWhatsAppAppointmentReminderText({
      businessName: 'GlowUp Guzellik Merkezi',
      customerName: appointment.customer,
      serviceName: appointment.service,
      time: formatAppointmentReminderTime(appointment.time),
    })

    if (!normalizedPhone) {
      summary.skipped += 1
      results.push({
        appointmentId: appointment.id,
        customer: appointment.customer,
        message: 'Gecerli telefon numarasi yok.',
        phone: appointment.phone,
        status: 'skipped',
      })

      await adminClient
        .from('appointments')
        .update({
          whatsapp_reminder_last_attempt_at: new Date().toISOString(),
          whatsapp_reminder_last_error: 'Gecerli telefon numarasi yok.',
        })
        .eq('id', appointment.id)
        .eq('user_id', appointment.user_id)

      continue
    }

    if (isDryRun) {
      summary.sent += 1
      results.push({
        appointmentId: appointment.id,
        customer: appointment.customer,
        message: messageText,
        phone: normalizedPhone,
        status: 'sent',
      })
      continue
    }

    try {
      await sendWhatsAppViaEvolution(normalizedPhone, messageText)

      const now = new Date().toISOString()
      const { error: updateError } = await adminClient
        .from('appointments')
        .update({
          whatsapp_reminder_last_attempt_at: now,
          whatsapp_reminder_last_error: null,
          whatsapp_reminder_sent_at: now,
          whatsapp_reminder_sent_for_date: targetDate,
        })
        .eq('id', appointment.id)
        .eq('user_id', appointment.user_id)

      if (updateError) {
        throw new ApiError(500, 'Reminder sonucu kaydedilemedi.')
      }

      summary.sent += 1
      results.push({
        appointmentId: appointment.id,
        customer: appointment.customer,
        message: messageText,
        phone: normalizedPhone,
        status: 'sent',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'WhatsApp reminder gonderilemedi.'

      await adminClient
        .from('appointments')
        .update({
          whatsapp_reminder_last_attempt_at: new Date().toISOString(),
          whatsapp_reminder_last_error: errorMessage,
        })
        .eq('id', appointment.id)
        .eq('user_id', appointment.user_id)

      summary.failed += 1
      results.push({
        appointmentId: appointment.id,
        customer: appointment.customer,
        message: errorMessage,
        phone: normalizedPhone,
        status: 'failed',
      })
    }
  }

  return NextResponse.json(
    {
      results,
      summary,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const payload: ReminderRequestPayload = {
      date: searchParams.get('date') || undefined,
      dryRun: searchParams.get('dryRun') === 'true',
    }

    return await executeReminderRun(request, payload)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'WhatsApp hatirlatmalari calistirilamadi.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as ReminderRequestPayload

    return await executeReminderRun(request, payload)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'WhatsApp hatirlatmalari calistirilamadi.' }, { status: 500 })
  }
}
