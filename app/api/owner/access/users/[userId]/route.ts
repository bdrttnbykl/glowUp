import { NextResponse } from 'next/server'

import { ApiError, createServiceRoleClient, requireOwner } from '@/lib/supabase-server'

type UpdateUserStatusPayload = {
  status?: 'active' | 'inactive'
}

const hasMissingStatusColumnError = (message: string) =>
  message.toLowerCase().includes('status') && message.toLowerCase().includes('profiles')

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

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/owner/access/users/[userId]'>
) {
  try {
    const owner = await requireOwner(request)
    const { userId } = await context.params
    const payload = (await request.json()) as UpdateUserStatusPayload
    const nextStatus = payload.status

    if (nextStatus !== 'active' && nextStatus !== 'inactive') {
      throw new ApiError(400, 'Gecerli bir durum sec.')
    }

    if (!userId) {
      throw new ApiError(400, 'Guncellenecek kullanici bulunamadi.')
    }

    if (userId === owner.user.id) {
      throw new ApiError(409, 'Aktif owner hesabi burada pasife alinemez.')
    }

    const adminClient = createServiceRoleClient()
    let statusMigrationMissing = false
    let { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, email, status')
      .eq('id', userId)
      .maybeSingle()

    if (profileError && hasMissingStatusColumnError(profileError.message)) {
      statusMigrationMissing = true
      const fallbackResult = await adminClient
        .from('profiles')
        .select('id, role, email')
        .eq('id', userId)
        .maybeSingle()

      profile = fallbackResult.data
        ? {
            ...fallbackResult.data,
            status: 'active',
          }
        : null
      profileError = fallbackResult.error
    }

    if (profileError) {
      throw new ApiError(500, 'Kullanici profili okunamadi.')
    }

    if (!profile) {
      throw new ApiError(404, 'Kullanici bulunamadi.')
    }

    if (profile.role !== 'member') {
      throw new ApiError(409, 'Owner hesaplari bu ekrandan pasife alinamaz.')
    }

    if (statusMigrationMissing) {
      throw new ApiError(409, 'Pasife alma icin status migrationini once calistir.')
    }

    if (profile.status === nextStatus) {
      return NextResponse.json({
        email: profile.email,
        ok: true,
        status: profile.status,
      })
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: nextStatus === 'inactive' ? '876000h' : 'none',
    })

    if (authUpdateError) {
      throw new ApiError(500, authUpdateError.message || 'Auth durumu guncellenemedi.')
    }

    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({
        status: nextStatus,
      })
      .eq('id', userId)

    if (profileUpdateError) {
      throw new ApiError(500, 'Kullanici durumu kaydedilemedi.')
    }

    return NextResponse.json({
      email: profile.email,
      ok: true,
      status: nextStatus,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Kullanici durumu guncellenemedi.' }, { status: 500 })
  }
}
