import { NextResponse } from 'next/server'

import {
  ApiError,
  createServiceRoleClient,
  getInviteStatus,
  requireOwner,
} from '@/lib/supabase-server'

export async function DELETE(
  request: Request,
  context: RouteContext<'/api/owner/access/[inviteId]'>
) {
  try {
    const owner = await requireOwner(request)

    const { inviteId } = await context.params
    const parsedInviteId = Number(inviteId)

    if (!Number.isInteger(parsedInviteId) || parsedInviteId <= 0) {
      throw new ApiError(400, 'Gecerli bir davet sec.')
    }

    const adminClient = createServiceRoleClient()
    const { data: invite, error: inviteError } = await adminClient
      .from('invite_codes')
      .select('id, email, code_last4, created_by, expires_at, used_at, revoked_at, used_by_user_id, created_at')
      .eq('id', parsedInviteId)
      .maybeSingle()

    if (inviteError) {
      throw new ApiError(500, 'Davet kodu bulunamadi.')
    }

    if (!invite) {
      throw new ApiError(404, 'Davet kodu bulunamadi.')
    }

    if (invite.used_at) {
      throw new ApiError(409, 'Kullanilmis davet kodu iptal edilemez.')
    }

    if (invite.revoked_at) {
      return NextResponse.json({
        invite: {
          codeHint: `****-${invite.code_last4}`,
          createdAt: invite.created_at,
          createdByEmail: owner.profile.email,
          email: invite.email,
          expiresAt: invite.expires_at,
          id: parsedInviteId,
          status: getInviteStatus(invite),
          usedAt: invite.used_at,
          usedByEmail: null,
        },
        ok: true,
      })
    }

    const { data: revokedInvite, error: revokeError } = await adminClient
      .from('invite_codes')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('id', parsedInviteId)
      .select('id, email, code_last4, created_by, expires_at, used_at, revoked_at, used_by_user_id, created_at')
      .single()

    if (revokeError || !revokedInvite) {
      throw new ApiError(500, 'Davet kodu iptal edilemedi.')
    }

    return NextResponse.json({
      invite: {
        codeHint: `****-${revokedInvite.code_last4}`,
        createdAt: revokedInvite.created_at,
        createdByEmail: owner.profile.email,
        email: revokedInvite.email,
        expiresAt: revokedInvite.expires_at,
        id: revokedInvite.id,
        status: getInviteStatus(revokedInvite),
        usedAt: revokedInvite.used_at,
        usedByEmail: null,
      },
      ok: true,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Davet kodu iptal edilemedi.' }, { status: 500 })
  }
}
