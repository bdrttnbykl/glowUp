import { NextResponse } from 'next/server'

import { ApiError, createServiceRoleClient, requireOwner } from '@/lib/supabase-server'

export async function DELETE(
  request: Request,
  context: RouteContext<'/api/owner/access/[inviteId]'>
) {
  try {
    await requireOwner(request)

    const { inviteId } = await context.params
    const parsedInviteId = Number(inviteId)

    if (!Number.isInteger(parsedInviteId) || parsedInviteId <= 0) {
      throw new ApiError(400, 'Gecerli bir davet sec.')
    }

    const adminClient = createServiceRoleClient()
    const { data: invite, error: inviteError } = await adminClient
      .from('invite_codes')
      .select('id, used_at, revoked_at')
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
      return NextResponse.json({ ok: true })
    }

    const { error: revokeError } = await adminClient
      .from('invite_codes')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('id', parsedInviteId)

    if (revokeError) {
      throw new ApiError(500, 'Davet kodu iptal edilemedi.')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Davet kodu iptal edilemedi.' }, { status: 500 })
  }
}
