'use client'

import { useState } from 'react'
import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { Appointment, AppointmentRow } from '@/app/_home/types'
import { isPastAppointment } from '@/app/_home/utils'

type AppointmentsPageProps = {
  appointmentRows: AppointmentRow[]
  editingContent: string
  editingNoteId: number | null
  message: string
  onCancelEditingNote: () => void
  onChangeEditingContent: (value: string) => void
  onDeleteNote: (id: number) => void
  onOpenAppointmentClosingModal: (item: Appointment) => void
  onPlaceholderAction: (label: string) => void
  onRefreshAppointments: () => void
  onStartEditingNote: (item: Appointment) => void
  onUpdateNote: (id: number) => void
}

export function AppointmentsPage({
  appointmentRows,
  editingContent,
  editingNoteId,
  message,
  onCancelEditingNote,
  onChangeEditingContent,
  onDeleteNote,
  onOpenAppointmentClosingModal,
  onPlaceholderAction,
  onRefreshAppointments,
  onStartEditingNote,
  onUpdateNote,
}: AppointmentsPageProps) {
  const [visibilityFilter, setVisibilityFilter] = useState<'Acik' | 'Sonuclanan' | 'Hepsi'>(
    'Acik'
  )
  const openCount = appointmentRows.filter((item) => !item.closed_at).length
  const closedCount = appointmentRows.filter((item) => !!item.closed_at).length
  const filteredAppointments = appointmentRows.filter((item) => {
    if (visibilityFilter === 'Acik') {
      return !item.closed_at
    }

    if (visibilityFilter === 'Sonuclanan') {
      return !!item.closed_at
    }

    return true
  })

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title={`Randevular (${filteredAppointments.length})`}
        description="Gunun operasyonunu buradan takip et. Acik, sonuclanmis veya tum randevulari tek akista gorebilir ve hizli aksiyon alabilirsin."
        stats={
          <>
            <DashboardMetric label="Acik" value={`${openCount}`} tone="emerald" />
            <DashboardMetric label="Sonuclanan" value={`${closedCount}`} tone="amber" />
            <DashboardMetric label="Toplam" value={`${appointmentRows.length}`} />
          </>
        }
      />

      <DashboardSectionCard>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-2 xl:min-w-[480px]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Gorunum
              </p>
              <select
                value={visibilityFilter}
                onChange={(event) =>
                  setVisibilityFilter(event.target.value as 'Acik' | 'Sonuclanan' | 'Hepsi')
                }
                className="min-w-[220px] rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-base text-slate-700 outline-none"
              >
                <option>Acik</option>
                <option>Sonuclanan</option>
                <option>Hepsi</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Donem
              </p>
              <select className="min-w-[220px] rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-base text-slate-700 outline-none">
                <option>Bu yil</option>
                <option>Bu ay</option>
                <option>Bu hafta</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onPlaceholderAction('Filtrele / Sirala')}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-[#537bb4]"
            >
              Filtrele / Sirala
            </button>
            <button
              type="button"
              onClick={() => onPlaceholderAction('Ayar')}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Ayar
            </button>
            <button
              type="button"
              onClick={onRefreshAppointments}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Yenile
            </button>
            <button
              type="button"
              onClick={() => onPlaceholderAction('Indir')}
              className="rounded-2xl bg-[#537bb4] px-5 py-3 text-sm font-medium text-white"
            >
              Indir
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#d9e2ef] bg-[#f8fbff] px-5 py-4 text-sm leading-6 text-slate-600">
          Randevu sonucunu kaydetmek icin gecmis kayitlarda `Sonuclandir` kullan. Paket
          randevularinda seans dusumu sadece `Geldi` secildiginde yapilir.
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[1400px] bg-white text-left">
            <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[15px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-5 font-semibold">Musteri</th>
                <th className="px-4 py-5 font-semibold">Telefon numarasi</th>
                <th className="px-4 py-5 font-semibold">Hizmetler</th>
                <th className="px-4 py-5 font-semibold">Hizmet veren</th>
                <th className="px-4 py-5 font-semibold">Tarih</th>
                <th className="px-4 py-5 font-semibold">Saat</th>
                <th className="px-4 py-5 font-semibold">Zaman</th>
                <th className="px-4 py-5 font-semibold">Durum</th>
                <th className="px-4 py-5 font-semibold">Musteri durumu</th>
                <th className="px-4 py-5 font-semibold">Odeme</th>
                <th className="px-4 py-5 font-semibold">Toplam hizmet fiyati</th>
                <th className="px-4 py-5 font-semibold">Olusturan</th>
                <th className="px-4 py-5 font-semibold">Olusturulma</th>
                <th className="px-4 py-5 font-semibold text-right">Islem</th>
              </tr>
            </thead>
            <tbody className="text-[16px] text-slate-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-14 text-center text-slate-400">
                    {visibilityFilter === 'Acik'
                      ? 'Acik veya islem bekleyen randevu yok.'
                      : visibilityFilter === 'Sonuclanan'
                        ? 'Sonuclanmis randevu yok.'
                        : 'Randevu kaydi yok.'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-5 font-medium text-slate-800">{item.customer || '-'}</td>
                    <td className="px-4 py-5">{item.phone || '-'}</td>
                    <td className="px-4 py-5">
                      {editingNoteId === item.id ? (
                        <div className="space-y-2">
                          <input
                            value={editingContent}
                            onChange={(e) => onChangeEditingContent(e.target.value)}
                            className="w-full rounded-xl border border-[#c8d6e8] bg-[#f8fbff] px-3 py-2 text-sm outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => onUpdateNote(item.id)}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white"
                            >
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={onCancelEditingNote}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                            >
                              Iptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        item.service
                      )}
                    </td>
                    <td className="px-4 py-5">{item.staff || '-'}</td>
                    <td className="px-4 py-5">{item.date || '-'}</td>
                    <td className="px-4 py-5">{item.time || '-'}</td>
                    <td className="px-4 py-5">
                      {isPastAppointment(item.date, item.time) ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">
                          Gecmis
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5">{item.status || 'Taslak'}</td>
                    <td className="px-4 py-5">{item.attendance_status || '-'}</td>
                    <td className="px-4 py-5">
                      {item.payment_method || item.collected_amount
                        ? `${item.payment_method ? item.payment_method : ''}${item.collected_amount ? `${item.payment_method ? ' / ' : ''}${item.collected_amount}` : ''}`
                        : '-'}
                    </td>
                    <td className="px-4 py-5">{item.total_price || '0 TL'}</td>
                    <td className="px-4 py-5">{item.creator || '-'}</td>
                    <td className="px-4 py-5">
                      <div>{item.createdLabel}</div>
                      <div className="text-sm text-slate-400">{item.createdTime}</div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => onStartEditingNote(item)}
                          className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-[#537bb4]"
                        >
                          Duzenle
                        </button>
                        {isPastAppointment(item.date, item.time) && !item.closed_at && (
                          <button
                            type="button"
                            onClick={() => onOpenAppointmentClosingModal(item)}
                            className="rounded-xl bg-rose-600 px-4 py-3 text-white"
                          >
                            Sonuclandir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteNote(item.id)}
                          className="rounded-xl bg-[#35588a] px-4 py-3 text-white"
                        >
                          Sil
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

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
