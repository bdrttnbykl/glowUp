'use client'

import { useState } from 'react'

import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { ManagedInvite, ManagedUser, ManagedUserDetail } from '@/app/_home/types'

type AccessManagementPageProps = {
  activeUserDetail: ManagedUserDetail | null
  activeUserDetailId: string | null
  currentUserId: string
  deletingUserId: string | null
  inviteEmail: string
  invites: ManagedInvite[]
  isCreatingInvite: boolean
  isLoading: boolean
  isUserDetailLoading: boolean
  lastCreatedInvite: {
    code: string
    email: string
    expiresAt: string
    id: number
  } | null
  message: string
  onCloseUserDetail: () => void
  onCreateInvite: () => void
  onDeleteUser: (user: ManagedUser) => void
  onInviteEmailChange: (value: string) => void
  onRefresh: () => void
  onRevokeInvite: (inviteId: number) => void
  onSelectUser: (user: ManagedUser) => void
  onUpdateUserStatus: (user: ManagedUser, nextStatus: ManagedUser['status']) => void
  revokingInviteId: number | null
  updatingUserId: string | null
  users: ManagedUser[]
}

const statusLabelMap: Record<ManagedInvite['status'], string> = {
  expired: 'Suresi doldu',
  pending: 'Bekliyor',
  revoked: 'Iptal edildi',
  used: 'Kullanildi',
}

const statusClassNameMap: Record<ManagedInvite['status'], string> = {
  expired: 'bg-slate-100 text-slate-600',
  pending: 'bg-emerald-50 text-emerald-700',
  revoked: 'bg-rose-50 text-rose-700',
  used: 'bg-[#edf4ff] text-[#35588a]',
}

const formatInviteExpiry = (value: string) =>
  new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  })

const formatDetailDate = (value: string | null) => {
  if (!value) {
    return 'Henuz giris yapmadi'
  }

  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const buildInviteShareText = ({
  appUrl,
  code,
  email,
  expiresAt,
}: {
  appUrl: string | null
  code: string
  email: string
  expiresAt: string
}) =>
  [
    `Merhaba,`,
    ``,
    `Senin icin bir glowUp davet kodu olusturdum.`,
    `Email: ${email}`,
    `Davet kodu: ${code}`,
    `Son kullanma: ${formatInviteExpiry(expiresAt)}`,
    ``,
    `Kayit olurken once email ve bu kodu girmen, sonra kendi sifreni olusturman gerekiyor.`,
    ...(appUrl ? ['', `Kayit ekrani: ${appUrl}`] : []),
  ].join('\n')

export function AccessManagementPage({
  activeUserDetail,
  activeUserDetailId,
  currentUserId,
  deletingUserId,
  inviteEmail,
  invites,
  isCreatingInvite,
  isLoading,
  isUserDetailLoading,
  lastCreatedInvite,
  message,
  onCloseUserDetail,
  onCreateInvite,
  onDeleteUser,
  onInviteEmailChange,
  onRefresh,
  onRevokeInvite,
  onSelectUser,
  onUpdateUserStatus,
  revokingInviteId,
  updatingUserId,
  users,
}: AccessManagementPageProps) {
  const ownerCount = users.filter((user) => user.role === 'owner').length
  const pendingInviteCount = invites.filter((invite) => invite.status === 'pending').length
  const usedInviteCount = invites.filter((invite) => invite.status === 'used').length
  const [shareMessage, setShareMessage] = useState('')

  const handleCopyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setShareMessage(successMessage)
    } catch {
      setShareMessage('Panoya kopyalanamadi.')
    }
  }

  const handleOpenWhatsAppShare = () => {
    if (!lastCreatedInvite) {
      return
    }

    const shareText = buildInviteShareText({
      appUrl: typeof window === 'undefined' ? null : window.location.origin,
      code: lastCreatedInvite.code,
      email: lastCreatedInvite.email,
      expiresAt: lastCreatedInvite.expiresAt,
    })

    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    )
    setShareMessage('WhatsApp paylasimi acildi.')
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title="Erisim ve davetler"
        description="Kullanicilari, owner rolunu ve tek kullanimlik davet kodlarini bu ekrandan yonet. Yeni kayit akisi email ve davet kodu ile baslar, sifre olusturma asamasina sonra gecer."
        actions={
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => onInviteEmailChange(event.target.value)}
                placeholder="davet@email.com"
                className="min-w-[240px] rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={onCreateInvite}
                disabled={isCreatingInvite}
                className="rounded-2xl bg-[#20a638] px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isCreatingInvite ? 'Olusturuluyor...' : 'Davet olustur'}
              </button>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600 disabled:opacity-60"
            >
              {isLoading ? 'Yukleniyor...' : 'Yenile'}
            </button>
          </>
        }
        stats={
          <>
            <DashboardMetric label="Toplam kullanici" value={`${users.length}`} />
            <DashboardMetric label="Owner" value={`${ownerCount}`} tone="amber" />
            <DashboardMetric label="Bekleyen davet" value={`${pendingInviteCount}`} tone="emerald" />
            <DashboardMetric label="Kullanilan davet" value={`${usedInviteCount}`} tone="slate" />
          </>
        }
      />

      {lastCreatedInvite && (
        <DashboardSectionCard className="border-[#d5dfec] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_58%,#eef6ff_100%)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#537bb4]">
                Yeni davet kodu
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#274a78]">
                {lastCreatedInvite.code}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {lastCreatedInvite.email} icin olusturuldu. Bu kodu kaydet; listede sadece son 4
                karakter gorunur.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void handleCopyToClipboard(lastCreatedInvite.code, 'Davet kodu panoya kopyalandi.')
                  }
                  className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-2 text-sm font-medium text-[#274a78]"
                >
                  Kodu kopyala
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleCopyToClipboard(
                      buildInviteShareText({
                        appUrl: typeof window === 'undefined' ? null : window.location.origin,
                        code: lastCreatedInvite.code,
                        email: lastCreatedInvite.email,
                        expiresAt: lastCreatedInvite.expiresAt,
                      }),
                      'Hazir mail metni panoya kopyalandi.'
                    )
                  }
                  className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-2 text-sm font-medium text-[#274a78]"
                >
                  Mail metnini kopyala
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppShare}
                  className="rounded-xl border border-[#d8ebdc] bg-[#effaf2] px-4 py-2 text-sm font-medium text-[#1f8e3d]"
                >
                  WhatsApp&apos;ta ac
                </button>
                <button
                  type="button"
                  onClick={() => onRevokeInvite(lastCreatedInvite.id)}
                  disabled={revokingInviteId === lastCreatedInvite.id}
                  className="rounded-xl border border-[#f1c3c8] bg-white px-4 py-2 text-sm font-medium text-rose-600 disabled:cursor-not-allowed disabled:border-[#e6eaf0] disabled:text-slate-300"
                >
                  {revokingInviteId === lastCreatedInvite.id
                    ? 'Iptal ediliyor...'
                    : 'Bu daveti iptal et'}
                </button>
              </div>
              {shareMessage && (
                <p className="mt-3 text-sm text-[#537bb4]">{shareMessage}</p>
              )}
            </div>

            <div className="rounded-3xl border border-[#d7e0eb] bg-white/90 px-5 py-4 text-sm text-slate-600">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Son kullanma
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {formatInviteExpiry(lastCreatedInvite.expiresAt)}
              </p>
            </div>
          </div>
        </DashboardSectionCard>
      )}

      {(isUserDetailLoading || activeUserDetail) && (
        <DashboardSectionCard className="border-[#d5dfec] bg-[linear-gradient(135deg,#ffffff_0%,#f9fbff_58%,#eef5ff_100%)]">
          {isUserDetailLoading && !activeUserDetail ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#537bb4]">
                  Kullanici detayi
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#274a78]">
                  Yukleniyor...
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Secilen kullanicinin kayit ve aktivite bilgileri getiriliyor.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseUserDetail}
                className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-2 text-sm font-medium text-slate-600"
              >
                Kapat
              </button>
            </div>
          ) : activeUserDetail ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#537bb4]">
                    Kullanici detayi
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#274a78]">
                    {activeUserDetail.email}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Kayit tarihi, son giris ve olusturdugu kayit dagilimi bu alanda gorunur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCloseUserDetail}
                  className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Kapat
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-[#d7e0eb] bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Kayit tarihi
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDetailDate(activeUserDetail.createdAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e0eb] bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Son giris
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDetailDate(activeUserDetail.lastSignInAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e0eb] bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Davet eden
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {activeUserDetail.invitedByEmail || '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e0eb] bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Rol
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{activeUserDetail.role}</p>
                </div>
                <div className="rounded-2xl border border-[#d7e0eb] bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Durum
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {activeUserDetail.status === 'active' ? 'Aktif' : 'Pasif'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <DashboardMetric
                  label="Toplam kayit"
                  tone="blue"
                  value={`${activeUserDetail.recordCounts.total}`}
                />
                <DashboardMetric
                  label="Randevu"
                  tone="emerald"
                  value={`${activeUserDetail.recordCounts.appointments}`}
                />
                <DashboardMetric
                  label="Musteri"
                  tone="slate"
                  value={`${activeUserDetail.recordCounts.customers}`}
                />
                <DashboardMetric
                  label="Urun"
                  tone="amber"
                  value={`${activeUserDetail.recordCounts.products}`}
                />
                <DashboardMetric
                  label="Paket satis"
                  tone="blue"
                  value={`${activeUserDetail.recordCounts.packageSales}`}
                />
                <DashboardMetric
                  label="Davet"
                  tone="slate"
                  value={`${activeUserDetail.recordCounts.invites}`}
                />
              </div>
            </div>
          ) : null}
        </DashboardSectionCard>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Mevcut kullanicilar
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Owner ve uye rollerini, kayit tarihlerini ve davet kaynagini takip et.
            </p>
            <p className="mt-2 text-sm text-rose-600">
              Kullanici silmek ilgili hesabin randevu, musteri, urun ve diger bagli kayitlarini da
              kalici olarak siler.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[980px] bg-white text-left">
              <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Email</th>
                  <th className="px-4 py-4 font-semibold">Rol</th>
                  <th className="px-4 py-4 font-semibold">Durum</th>
                  <th className="px-4 py-4 font-semibold">Davet eden</th>
                  <th className="px-4 py-4 font-semibold">Olusturulma</th>
                  <th className="px-4 py-4 font-semibold text-right">Islem</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      Kullanici kaydi bulunamadi.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => onSelectUser(user)}
                      className={`border-b border-slate-100 cursor-pointer transition hover:bg-[#f8fbff] ${
                        activeUserDetailId === user.id ? 'bg-[#f4f8ff]' : ''
                      }`.trim()}
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">{user.email}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                            user.role === 'owner'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-[#edf4ff] text-[#35588a]'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {user.status === 'active' ? 'aktif' : 'pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-4">{user.invitedByEmail || '-'}</td>
                      <td className="px-4 py-4">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              onUpdateUserStatus(
                                user,
                                user.status === 'active' ? 'inactive' : 'active'
                              )
                            }}
                            disabled={
                              user.role !== 'member' ||
                              user.id === currentUserId ||
                              updatingUserId === user.id
                            }
                            className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:border-[#e6eaf0] disabled:text-slate-300"
                          >
                            {updatingUserId === user.id
                              ? 'Guncelleniyor...'
                              : user.status === 'active'
                                ? 'Pasife al'
                                : 'Aktif et'}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              onDeleteUser(user)
                            }}
                            disabled={
                              user.role !== 'member' ||
                              user.id === currentUserId ||
                              deletingUserId === user.id ||
                              updatingUserId === user.id
                            }
                            className="rounded-xl border border-[#f1c3c8] bg-white px-4 py-3 text-sm font-medium text-rose-600 disabled:cursor-not-allowed disabled:border-[#e6eaf0] disabled:text-slate-300"
                          >
                            {deletingUserId === user.id ? 'Siliniyor...' : 'Kullaniciyi sil'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Davet kodlari
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tek kullanimlik kodlar email&apos;e bagli calisir. Kullanildiginda tekrar aktif olmaz.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[760px] bg-white text-left">
              <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Email</th>
                  <th className="px-4 py-4 font-semibold">Kod</th>
                  <th className="px-4 py-4 font-semibold">Durum</th>
                  <th className="px-4 py-4 font-semibold">Olusturan</th>
                  <th className="px-4 py-4 font-semibold">Bitis</th>
                  <th className="px-4 py-4 font-semibold text-right">Islem</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      Henuz davet olusturulmadi.
                    </td>
                  </tr>
                ) : (
                  invites.map((invite) => (
                    <tr key={invite.id} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-900">{invite.email}</td>
                      <td className="px-4 py-4">{invite.codeHint}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusClassNameMap[invite.status]}`}
                        >
                          {statusLabelMap[invite.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">{invite.createdByEmail || '-'}</td>
                      <td className="px-4 py-4">
                        {new Date(invite.expiresAt).toLocaleString('tr-TR', {
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => onRevokeInvite(invite.id)}
                            disabled={invite.status !== 'pending' || revokingInviteId === invite.id}
                            className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            {revokingInviteId === invite.id ? 'Iptal...' : 'Iptal et'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
