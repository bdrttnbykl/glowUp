import { NextResponse } from 'next/server'

import { ApiError, createServiceRoleClient, requireOwner } from '@/lib/supabase-server'

export async function DELETE(
  request: Request,
  context: RouteContext<'/api/owner/access/users/[userId]'>
) {
  try {
    const owner = await requireOwner(request)
    const { userId } = await context.params

    if (!userId) {
      throw new ApiError(400, 'Silinecek kullanici bulunamadi.')
    }

    if (userId === owner.user.id) {
      throw new ApiError(409, 'Aktif owner hesabi silinemez.')
    }

    const adminClient = createServiceRoleClient()
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, email')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      throw new ApiError(500, 'Kullanici profili okunamadi.')
    }

    if (!profile) {
      throw new ApiError(404, 'Kullanici bulunamadi.')
    }

    if (profile.role !== 'member') {
      throw new ApiError(409, 'Owner hesaplari panelden silinemez.')
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw new ApiError(500, deleteError.message || 'Kullanici silinemedi.')
    }

    return NextResponse.json({
      email: profile.email,
      ok: true,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Kullanici silinemedi.' }, { status: 500 })
  }
}
