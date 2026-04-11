import { createHash, randomBytes } from 'crypto'

import { createClient, type User } from '@supabase/supabase-js'

type AuthenticatedUserResult = {
  accessToken: string
  user: User
}

type OwnerContext = AuthenticatedUserResult & {
  profile: {
    email: string
    role: 'member' | 'owner'
  }
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getSupabaseEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    throw new ApiError(500, 'Supabase public ayarlari eksik.')
  }

  if (!serviceRoleKey) {
    throw new ApiError(500, 'SUPABASE_SERVICE_ROLE_KEY eksik.')
  }

  return { anonKey, serviceRoleKey, url }
}

export const normalizeEmail = (value: string) => value.trim().toLowerCase()

export const validateEmail = (value: string) => emailPattern.test(normalizeEmail(value))

export const normalizeInviteCode = (value: string) => value.replace(/[^a-z0-9]/gi, '').toUpperCase()

export const formatInviteCode = (value: string) => {
  const normalized = normalizeInviteCode(value)

  return normalized.match(/.{1,4}/g)?.join('-') || normalized
}

export const hashInviteCode = (value: string) =>
  createHash('sha256').update(normalizeInviteCode(value)).digest('hex')

export const createInviteCode = () => formatInviteCode(randomBytes(8).toString('hex'))

export const createServiceRoleClient = () => {
  const { serviceRoleKey, url } = getSupabaseEnv()

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const createAuthenticatedClient = (accessToken: string) => {
  const { anonKey, url } = getSupabaseEnv()

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export const getBearerToken = (request: Request) => {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')

  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Yetkili istek icin oturum gerekli.')
  }

  const token = header.slice('Bearer '.length).trim()

  if (!token) {
    throw new ApiError(401, 'Gecerli oturum anahtari bulunamadi.')
  }

  return token
}

export const getAuthenticatedUser = async (request: Request): Promise<AuthenticatedUserResult> => {
  const accessToken = getBearerToken(request)
  const authClient = createAuthenticatedClient(accessToken)
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser()

  if (error || !user) {
    throw new ApiError(401, 'Oturum dogrulanamadi.')
  }

  return {
    accessToken,
    user,
  }
}

export const requireOwner = async (request: Request): Promise<OwnerContext> => {
  const auth = await getAuthenticatedUser(request)
  const adminClient = createServiceRoleClient()
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('email, role')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error) {
    throw new ApiError(500, 'Profil rolu okunamadi.')
  }

  if (!profile || profile.role !== 'owner') {
    throw new ApiError(403, 'Bu islem sadece owner kullaniciya acik.')
  }

  return {
    ...auth,
    profile,
  }
}

export const validateInviteEmailAndCode = (email: string, inviteCode: string) => {
  const normalizedEmail = normalizeEmail(email)
  const normalizedInviteCode = normalizeInviteCode(inviteCode)

  if (!validateEmail(normalizedEmail)) {
    throw new ApiError(400, 'Gecerli bir email adresi gir.')
  }

  if (normalizedInviteCode.length < 8) {
    throw new ApiError(400, 'Davet kodu gecersiz.')
  }

  return {
    normalizedEmail,
    normalizedInviteCode,
  }
}

export const getActiveInvite = async (email: string, inviteCode: string) => {
  const adminClient = createServiceRoleClient()
  const { data: invite, error } = await adminClient
    .from('invite_codes')
    .select('id, email, created_by, expires_at, used_at, revoked_at')
    .eq('email', normalizeEmail(email))
    .eq('code_hash', hashInviteCode(inviteCode))
    .maybeSingle()

  if (error) {
    throw new ApiError(500, 'Davet kodu dogrulanamadi.')
  }

  if (!invite) {
    throw new ApiError(404, 'Email ve davet kodu eslesmedi.')
  }

  if (invite.revoked_at) {
    throw new ApiError(410, 'Bu davet kodu iptal edildi.')
  }

  if (invite.used_at) {
    throw new ApiError(410, 'Bu davet kodu daha once kullanildi.')
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new ApiError(410, 'Bu davet kodunun suresi doldu.')
  }

  return invite
}

export const getInviteStatus = (invite: {
  expires_at: string
  revoked_at: string | null
  used_at: string | null
}) => {
  if (invite.revoked_at) {
    return 'revoked' as const
  }

  if (invite.used_at) {
    return 'used' as const
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return 'expired' as const
  }

  return 'pending' as const
}

export const assertStrongEnoughPassword = (password: string) => {
  const trimmedPassword = password.trim()

  if (trimmedPassword.length < 8) {
    throw new ApiError(400, 'Sifre en az 8 karakter olmali.')
  }

  return trimmedPassword
}
