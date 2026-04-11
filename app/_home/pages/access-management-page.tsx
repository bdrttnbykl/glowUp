'use client'

import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { ManagedInvite, ManagedUser } from '@/app/_home/types'

type AccessManagementPageProps = {
  currentUserId: string
  deletingUserId: string | null
  inviteEmail: string
  invites: ManagedInvite[]
  isCreatingInvite: boolean
  isLoading: boolean
  lastCreatedInvite: {
    code: string
    email: string
    expiresAt: string
  } | null
  message: string
  onCreateInvite: () => void
  onDeleteUser: (user: ManagedUser) => void
  onInviteEmailChange: (value: string) => void
  onRefresh: () => void
  onRevokeInvite: (inviteId: number) => void
  revokingInviteId: number | null
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

export function AccessManagementPage({
  currentUserId,
  deletingUserId,
  inviteEmail,
  invites,
  isCreatingInvite,
  isLoading,
  lastCreatedInvite,
  message,
  onCreateInvite,
  onDeleteUser,
  onInviteEmailChange,
  onRefresh,
  onRevokeInvite,
  revokingInviteId,
  users,
}: AccessManagementPageProps) {
  const ownerCount = users.filter((user) => user.role === 'owner').length
  const pendingInviteCount = invites.filter((invite) => invite.status === 'pending').length
  const usedInviteCount = invites.filter((invite) => invite.status === 'used').length

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
            </div>

            <div className="rounded-3xl border border-[#d7e0eb] bg-white/90 px-5 py-4 text-sm text-slate-600">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Son kullanma
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {new Date(lastCreatedInvite.expiresAt).toLocaleString('tr-TR', {
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
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
            <table className="w-full min-w-[860px] bg-white text-left">
              <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Email</th>
                  <th className="px-4 py-4 font-semibold">Rol</th>
                  <th className="px-4 py-4 font-semibold">Davet eden</th>
                  <th className="px-4 py-4 font-semibold">Olusturulma</th>
                  <th className="px-4 py-4 font-semibold text-right">Islem</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      Kullanici kaydi bulunamadi.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100">
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
                      <td className="px-4 py-4">{user.invitedByEmail || '-'}</td>
                      <td className="px-4 py-4">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => onDeleteUser(user)}
                            disabled={
                              user.role !== 'member' ||
                              user.id === currentUserId ||
                              deletingUserId === user.id
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
              Tek kullanimlik kodlar email’e bagli calisir. Kullanildiginda tekrar aktif olmaz.
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
