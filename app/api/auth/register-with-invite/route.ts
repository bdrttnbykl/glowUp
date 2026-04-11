import { NextResponse } from 'next/server'

import {
  ApiError,
  assertStrongEnoughPassword,
  createServiceRoleClient,
  getActiveInvite,
  normalizeEmail,
  validateInviteEmailAndCode,
} from '@/lib/supabase-server'

type RegisterWithInvitePayload = {
  email?: string
  inviteCode?: string
  password?: string
}

export async function POST(request: Request) {
  let createdUserId: string | null = null

  try {
    const payload = (await request.json()) as RegisterWithInvitePayload
    const { normalizedEmail, normalizedInviteCode } = validateInviteEmailAndCode(
      payload.email || '',
      payload.inviteCode || ''
    )
    const password = assertStrongEnoughPassword(payload.password || '')
    const adminClient = createServiceRoleClient()

    await getActiveInvite(normalizedEmail, normalizedInviteCode)

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', normalizeEmail(normalizedEmail))
      .maybeSingle()

    if (existingProfileError) {
      throw new ApiError(500, 'Mevcut kullanici kontrol edilemedi.')
    }

    if (existingProfile) {
      throw new ApiError(409, 'Bu email icin zaten aktif bir kullanici var.')
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      password,
    })

    if (createUserError || !createdUser.user) {
      if (createUserError?.message?.toLowerCase().includes('already')) {
        throw new ApiError(409, 'Bu email zaten kayitli. Giris yapmayi dene.')
      }

      throw new ApiError(500, createUserError?.message || 'Kullanici olusturulamadi.')
    }

    createdUserId = createdUser.user.id

    const invite = await getActiveInvite(normalizedEmail, normalizedInviteCode)
    const { error: profileInsertError } = await adminClient.from('profiles').insert({
      email: normalizedEmail,
      id: createdUser.user.id,
      invite_code_id: invite.id,
      invited_by: invite.created_by,
      role: 'member',
    })

    if (profileInsertError) {
      throw new ApiError(500, 'Kullanici profili kaydedilemedi.')
    }

    const { error: inviteUpdateError } = await adminClient
      .from('invite_codes')
      .update({
        used_at: new Date().toISOString(),
        used_by_user_id: createdUser.user.id,
      })
      .eq('id', invite.id)
      .is('used_at', null)
      .is('revoked_at', null)

    if (inviteUpdateError) {
      throw new ApiError(500, 'Davet kodu kullanima kapatilamadi.')
    }

    return NextResponse.json({
      email: normalizedEmail,
      ok: true,
    })
  } catch (error) {
    if (createdUserId) {
      const adminClient = createServiceRoleClient()
      await adminClient.auth.admin.deleteUser(createdUserId)
    }

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Kayit tamamlanamadi.' }, { status: 500 })
  }
}
