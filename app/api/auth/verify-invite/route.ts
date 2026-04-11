import { NextResponse } from 'next/server'

import { ApiError, getActiveInvite, validateInviteEmailAndCode } from '@/lib/supabase-server'

type VerifyInvitePayload = {
  email?: string
  inviteCode?: string
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as VerifyInvitePayload
    const { normalizedEmail, normalizedInviteCode } = validateInviteEmailAndCode(
      payload.email || '',
      payload.inviteCode || ''
    )

    await getActiveInvite(normalizedEmail, normalizedInviteCode)

    return NextResponse.json({
      email: normalizedEmail,
      ok: true,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Davet kodu dogrulanamadi.' }, { status: 500 })
  }
}
