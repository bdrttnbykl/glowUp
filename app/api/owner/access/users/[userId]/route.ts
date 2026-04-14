import { NextResponse } from 'next/server'

import { ApiError, createServiceRoleClient, requireOwner } from '@/lib/supabase-server'

type UpdateUserStatusPayload = {
  status?: 'active' | 'inactive'
}

const hasMissingStatusColumnError = (message: string) =>
  message.toLowerCase().includes('status') && message.toLowerCase().includes('profiles')

const isMissingRelationError = (message: string) => {
  const normalized = message.toLowerCase()

  return (
    normalized.includes('relation') && normalized.includes('does not exist')
  ) || normalized.includes('could not find the table')
}

const countRowsByUserId = async (
  adminClient: ReturnType<typeof createServiceRoleClient>,
  table: 'appointments' | 'customers' | 'package_sales' | 'products',
  userId: string
) => {
  const { count, error } = await adminClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    if (isMissingRelationError(error.message)) {
      return 0
    }

    throw new ApiError(500, 'Kullanici detay kayitlari okunamadi.')
  }

  return count || 0
}

export async function GET(
  request: Request,
  context: RouteContext<'/api/owner/access/users/[userId]'>
) {
  try {
    await requireOwner(request)
    const { userId } = await context.params

    if (!userId) {
      throw new ApiError(400, 'Kullanici bulunamadi.')
    }

    const adminClient = createServiceRoleClient()
    let { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, role, status, invited_by, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError && hasMissingStatusColumnError(profileError.message)) {
      const fallbackResult = await adminClient
        .from('profiles')
        .select('id, email, role, invited_by, created_at')
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

    const [
      invitedByResult,
      authUserResult,
      appointmentCount,
      customerCount,
      productCount,
      packageSaleCount,
      inviteCount,
    ] = await Promise.all([
      profile.invited_by
        ? adminClient.from('profiles').select('email').eq('id', profile.invited_by).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      adminClient.auth.admin.getUserById(userId),
      countRowsByUserId(adminClient, 'appointments', userId),
      countRowsByUserId(adminClient, 'customers', userId),
      countRowsByUserId(adminClient, 'products', userId),
      countRowsByUserId(adminClient, 'package_sales', userId),
      adminClient
        .from('invite_codes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId),
    ])

    if (invitedByResult.error) {
      throw new ApiError(500, 'Davet eden kullanici okunamadi.')
    }

    if (authUserResult.error) {
      throw new ApiError(500, authUserResult.error.message || 'Son giris bilgisi okunamadi.')
    }

    if (inviteCount.error) {
      throw new ApiError(500, 'Kullanicinin davet kayitlari okunamadi.')
    }

    const recordCounts = {
      appointments: appointmentCount,
      customers: customerCount,
      invites: inviteCount.count || 0,
      packageSales: packageSaleCount,
      products: productCount,
      total:
        appointmentCount +
        customerCount +
        productCount +
        packageSaleCount +
        (inviteCount.count || 0),
    }

    return NextResponse.json(
      {
        detail: {
          createdAt: profile.created_at,
          email: profile.email,
          id: profile.id,
          invitedByEmail: invitedByResult.data?.email || null,
          lastSignInAt: authUserResult.data.user?.last_sign_in_at || null,
          recordCounts,
          role: profile.role,
          status: profile.status,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Kullanici detayi yuklenemedi.' }, { status: 500 })
  }
}

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
