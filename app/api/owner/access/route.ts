import { NextResponse } from 'next/server'

import {
  ApiError,
  createInviteCode,
  createServiceRoleClient,
  getInviteStatus,
  hashInviteCode,
  normalizeEmail,
  requireOwner,
  validateEmail,
} from '@/lib/supabase-server'

type CreateInvitePayload = {
  email?: string
}

type InviteRow = {
  code_last4: string
  created_at: string
  created_by: string
  email: string
  expires_at: string
  id: number
  revoked_at: string | null
  used_at: string | null
  used_by_user_id: string | null
}

type ProfileRow = {
  created_at: string
  email: string
  id: string
  invited_by: string | null
  role: 'member' | 'owner'
  status: 'active' | 'inactive'
}

const hasMissingStatusColumnError = (message: string) =>
  message.toLowerCase().includes('status') && message.toLowerCase().includes('profiles')

const mapInvite = (invite: InviteRow, emailLookup: Map<string, string>) => ({
  codeHint: `****-${invite.code_last4}`,
  createdAt: invite.created_at,
  createdByEmail: emailLookup.get(invite.created_by) || null,
  email: invite.email,
  expiresAt: invite.expires_at,
  id: invite.id,
  status: getInviteStatus(invite),
  usedAt: invite.used_at,
  usedByEmail: invite.used_by_user_id ? emailLookup.get(invite.used_by_user_id) || null : null,
})

export async function GET(request: Request) {
  try {
    await requireOwner(request)

    const adminClient = createServiceRoleClient()
    const [{ data: profiles, error: profilesError }, { data: invites, error: invitesError }] =
      await Promise.all([
        adminClient
          .from('profiles')
          .select('id, email, role, status, invited_by, created_at')
          .order('created_at', { ascending: false }),
        adminClient
          .from('invite_codes')
          .select('id, email, code_last4, created_by, expires_at, used_at, revoked_at, used_by_user_id, created_at')
          .order('created_at', { ascending: false }),
      ])

    let resolvedProfiles = profiles

    if (profilesError && hasMissingStatusColumnError(profilesError.message)) {
      const fallbackProfilesResult = await adminClient
        .from('profiles')
        .select('id, email, role, invited_by, created_at')
        .order('created_at', { ascending: false })

      if (fallbackProfilesResult.error) {
        throw new ApiError(500, 'Kullanici listesi yuklenemedi.')
      }

      resolvedProfiles = (fallbackProfilesResult.data || []).map((profile) => ({
        ...profile,
        status: 'active' as const,
      }))
    } else if (profilesError) {
      throw new ApiError(500, 'Kullanici listesi yuklenemedi.')
    }

    if (invitesError) {
      throw new ApiError(500, 'Davet kodlari yuklenemedi.')
    }

    const typedProfiles = (resolvedProfiles || []) as ProfileRow[]
    const typedInvites = (invites || []) as InviteRow[]
    const emailLookup = new Map<string, string>(
      typedProfiles.map((profile) => [profile.id, profile.email] as const)
    )

    return NextResponse.json({
      invites: typedInvites.map((invite) => mapInvite(invite, emailLookup)),
      users: typedProfiles.map((profile) => ({
        createdAt: profile.created_at,
        email: profile.email,
        id: profile.id,
        invitedByEmail: profile.invited_by ? emailLookup.get(profile.invited_by) || null : null,
        role: profile.role,
        status: profile.status,
      })),
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Erisim verileri yuklenemedi.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request)
    const payload = (await request.json()) as CreateInvitePayload
    const email = normalizeEmail(payload.email || '')

    if (!validateEmail(email)) {
      throw new ApiError(400, 'Gecerli bir email adresi gir.')
    }

    const adminClient = createServiceRoleClient()
    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfileError) {
      throw new ApiError(500, 'Kullanici kontrolu yapilamadi.')
    }

    if (existingProfile) {
      throw new ApiError(409, 'Bu email zaten sistemde kayitli.')
    }

    const { error: revokeExistingError } = await adminClient
      .from('invite_codes')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('email', email)
      .is('used_at', null)
      .is('revoked_at', null)

    if (revokeExistingError) {
      throw new ApiError(500, 'Eski davet kodlari kapatilamadi.')
    }

    const inviteCode = createInviteCode()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: invite, error: inviteInsertError } = await adminClient
      .from('invite_codes')
      .insert({
        code_hash: hashInviteCode(inviteCode),
        code_last4: inviteCode.slice(-4),
        created_by: owner.user.id,
        email,
        expires_at: expiresAt,
      })
      .select('id, email, code_last4, created_by, expires_at, used_at, revoked_at, used_by_user_id, created_at')
      .single()

    if (inviteInsertError || !invite) {
      throw new ApiError(500, 'Davet kodu olusturulamadi.')
    }

    return NextResponse.json({
      code: inviteCode,
      invite: {
        codeHint: `****-${invite.code_last4}`,
        createdAt: invite.created_at,
        createdByEmail: owner.profile.email,
        email: invite.email,
        expiresAt: invite.expires_at,
        id: invite.id,
        status: getInviteStatus(invite),
        usedAt: invite.used_at,
        usedByEmail: null,
      },
      ok: true,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Davet kodu olusturulamadi.' }, { status: 500 })
  }
}
