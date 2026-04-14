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
import {
  buildWhatsAppAppointmentReminderMessage,
  createWhatsAppLink,
  createDateFromIso,
  downloadPdfFile,
  formatAppointmentOutcomeLabel,
  formatDateIso,
  getTodayDateInputValue,
  isPastAppointment,
  normalizeWhatsAppPhone,
} from '@/app/_home/utils'

type AppointmentPeriodFilter =
  | 'Tum zamanlar'
  | 'Bugun'
  | 'Bu hafta'
  | 'Bu ay'
  | 'Bu yil'
  | 'Ozel aralik'

type AppointmentsPageProps = {
  appointmentRows: AppointmentRow[]
  message: string
  onDeleteNote: (id: number) => void
  onOpenAppointmentClosingModal: (item: Appointment) => void
  onPlaceholderAction: (label: string) => void
  onRefreshAppointments: () => void
  onStartEditingNote: (item: Appointment) => void
}

export function AppointmentsPage({
  appointmentRows,
  message,
  onDeleteNote,
  onOpenAppointmentClosingModal,
  onPlaceholderAction,
  onRefreshAppointments,
  onStartEditingNote,
}: AppointmentsPageProps) {
  const [visibilityFilter, setVisibilityFilter] = useState<'Acik' | 'Sonuclanan' | 'Hepsi'>(
    'Acik'
  )
  const [periodFilter, setPeriodFilter] = useState<AppointmentPeriodFilter>('Tum zamanlar')
  const [isPeriodPreviewOpen, setIsPeriodPreviewOpen] = useState(false)
  const [whatsAppMessage, setWhatsAppMessage] = useState('')
  const [activeWhatsAppLink, setActiveWhatsAppLink] = useState('')
  const todayIso = getTodayDateInputValue()
  const [customRangeStart, setCustomRangeStart] = useState(todayIso)
  const [customRangeEnd, setCustomRangeEnd] = useState(todayIso)

  const getSelectedRange = () => {
    if (periodFilter === 'Tum zamanlar') {
      return null
    }

    if (periodFilter === 'Ozel aralik') {
      if (!customRangeStart || !customRangeEnd) {
        return null
      }

      const start =
        customRangeStart <= customRangeEnd ? customRangeStart : customRangeEnd
      const end = customRangeStart <= customRangeEnd ? customRangeEnd : customRangeStart

      return { start, end }
    }

    const today = createDateFromIso(todayIso)
    const rangeStart = new Date(today)

    if (periodFilter === 'Bu hafta') {
      const day = rangeStart.getDay()
      const diff = day === 0 ? -6 : 1 - day
      rangeStart.setDate(rangeStart.getDate() + diff)
    } else if (periodFilter === 'Bu ay') {
      rangeStart.setDate(1)
    } else if (periodFilter === 'Bu yil') {
      rangeStart.setMonth(0, 1)
    }

    return {
      start: periodFilter === 'Bugun' ? todayIso : formatDateIso(rangeStart),
      end: todayIso,
    }
  }

  const selectedRange = getSelectedRange()
  const appointmentsInPeriod = appointmentRows.filter((item) => {
    if (!selectedRange) {
      return true
    }

    if (!item.date) {
      return false
    }

    return item.date >= selectedRange.start && item.date <= selectedRange.end
  })
  const appointmentsInPeriodPreview = [...appointmentsInPeriod].sort((left, right) => {
    const leftKey = `${left.date || ''} ${left.time || '99:99'}`
    const rightKey = `${right.date || ''} ${right.time || '99:99'}`
    return leftKey.localeCompare(rightKey, 'tr')
  })
  const openCount = appointmentsInPeriod.filter((item) => !item.closed_at).length
  const closedCount = appointmentsInPeriod.filter((item) => !!item.closed_at).length
  const filteredAppointments = appointmentsInPeriod.filter((item) => {
    if (visibilityFilter === 'Acik') {
      return !item.closed_at
    }

    if (visibilityFilter === 'Sonuclanan') {
      return !!item.closed_at
    }

    return true
  })
  const formatShortDate = (isoDate: string) =>
    createDateFromIso(isoDate).toLocaleDateString('tr-TR')
  const getWhatsAppReminderLink = (item: AppointmentRow) => {
    const phone = normalizeWhatsAppPhone(item.phone)

    if (!phone) {
      return null
    }

    return createWhatsAppLink(
      phone,
      buildWhatsAppAppointmentReminderMessage({
        businessName: 'GlowUp Guzellik Merkezi',
        customerName: item.customer,
        date: item.date,
        serviceName: item.service,
        time: item.time,
      })
    )
  }
  const openWhatsAppReminder = (item: AppointmentRow) => {
    const whatsappLink = getWhatsAppReminderLink(item)

    if (!whatsappLink) {
      setWhatsAppMessage('Bu randevuda gecerli bir telefon numarasi yok.')
      setActiveWhatsAppLink('')
      return
    }

    setWhatsAppMessage('WhatsApp acilmazsa asagidaki hazir linki kullan.')
    setActiveWhatsAppLink(whatsappLink)
    window.open(whatsappLink, '_blank', 'noopener,noreferrer')
  }
  const rangeSummary = selectedRange
    ? selectedRange.start === selectedRange.end
      ? formatShortDate(selectedRange.start)
      : `${formatShortDate(selectedRange.start)} - ${formatShortDate(selectedRange.end)}`
    : 'Tum kayitlar'

  const handleDownload = () => {
    const rows = [
      [
        'Musteri',
        'Telefon',
        'Hizmet',
        'Hizmet veren',
        'Tarih',
        'Saat',
        'Durum',
        'Musteri durumu',
        'Odeme yontemi',
        'Tahsilat',
        'Toplam hizmet fiyati',
        'Olusturan',
        'Olusturulma tarihi',
        'Olusturulma saati',
      ],
      ...filteredAppointments.map((item) => [
        item.customer || '',
        item.phone || '',
        item.service,
        item.staff || '',
        item.date || '',
        item.time || '',
        item.status || 'Taslak',
        formatAppointmentOutcomeLabel(item.attendance_status, item.service_status),
        item.payment_method || '',
        item.collected_amount || '',
        item.total_price || '',
        item.creator || '',
        item.createdLabel,
        item.createdTime,
      ]),
    ]

    downloadPdfFile({
      filename: 'randevular.pdf',
      orientation: 'landscape',
      rows,
      title: 'Randevu Listesi',
    })
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title={`Randevular (${filteredAppointments.length})`}
        description="Gunun operasyonunu buradan takip et. Acik, sonuclanmis veya tum randevulari secilen donem icinde tek akista gorebilir ve hizli aksiyon alabilirsin."
        stats={
          <>
            <DashboardMetric label="Acik" value={`${openCount}`} tone="emerald" />
            <DashboardMetric label="Sonuclanan" value={`${closedCount}`} tone="amber" />
            <DashboardMetric label="Toplam" value={`${appointmentsInPeriod.length}`} />
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
              <select
                value={periodFilter}
                onChange={(event) =>
                  setPeriodFilter(event.target.value as AppointmentPeriodFilter)
                }
                className="min-w-[220px] rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-base text-slate-700 outline-none"
              >
                <option>Tum zamanlar</option>
                <option>Bugun</option>
                <option>Bu hafta</option>
                <option>Bu ay</option>
                <option>Bu yil</option>
                <option>Ozel aralik</option>
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
              onClick={handleDownload}
              className="rounded-2xl bg-[#537bb4] px-5 py-3 text-sm font-medium text-white"
            >
              Indir
            </button>
          </div>
        </div>

        {periodFilter === 'Ozel aralik' ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:max-w-[520px]">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Baslangic
              </span>
              <input
                type="date"
                value={customRangeStart}
                onChange={(event) => setCustomRangeStart(event.target.value)}
                className="w-full rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-base text-slate-700 outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Bitis
              </span>
              <input
                type="date"
                value={customRangeEnd}
                onChange={(event) => setCustomRangeEnd(event.target.value)}
                className="w-full rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-base text-slate-700 outline-none"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-[#d9e2ef] bg-[#f8fbff] px-5 py-4 text-sm leading-6 text-slate-600">
          Randevu sonucunu kaydetmek veya guncellemek icin `Sonuclandir` kullan. Paket
          randevularinda seans dusumu sadece `Geldi` secildiginde yapilir. Secili donem:
          {` ${rangeSummary}`}.
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Acik
            </div>
            <div className="mt-2 text-3xl font-semibold text-emerald-900">{openCount}</div>
            <div className="mt-1 text-sm text-emerald-800">Secili araliktaki acik randevular</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Sonuclanan
            </div>
            <div className="mt-2 text-3xl font-semibold text-amber-900">{closedCount}</div>
            <div className="mt-1 text-sm text-amber-800">
              Secili aralikta tamamlanan randevular
            </div>
          </div>
          <div className="rounded-2xl border border-[#d9e2ef] bg-white px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Gosterilen Sonuc
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {filteredAppointments.length}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {visibilityFilter} gorunumunde listelenen kayitlar
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#d9e2ef] bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Secili Donem Detayi
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Secili tarih araligindaki tum randevulari popup icinde yatay akista gorebilirsin.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPeriodPreviewOpen(true)}
            disabled={appointmentsInPeriodPreview.length === 0}
            className="rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-5 py-3 text-sm font-medium text-[#537bb4] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {appointmentsInPeriodPreview.length === 0
              ? 'Donemde randevu yok'
              : `${appointmentsInPeriodPreview.length} randevuyu popupta gor`}
          </button>
        </div>

        {activeWhatsAppLink ? (
          <div className="mt-4 rounded-2xl border border-[#d8ebdc] bg-[#effaf2] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f8e3d]">
              Hazir WhatsApp Linki
            </div>
            <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center">
              <a
                href={activeWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-[#1f8e3d] underline underline-offset-4"
              >
                {activeWhatsAppLink}
              </a>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(activeWhatsAppLink)
                  setWhatsAppMessage('WhatsApp linki panoya kopyalandi.')
                }}
                className="rounded-2xl border border-[#b9d6c0] bg-white px-4 py-2 text-sm font-medium text-[#1f8e3d]"
              >
                Linki kopyala
              </button>
            </div>
          </div>
        ) : null}
      </DashboardSectionCard>

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[1520px] bg-white text-left">
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
                filteredAppointments.map((item) => {
                  const whatsAppLink = getWhatsAppReminderLink(item)

                  return (
                  <tr key={item.id} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-5 font-medium text-slate-800">{item.customer || '-'}</td>
                    <td className="px-4 py-5">{item.phone || '-'}</td>
                    <td className="px-4 py-5">{item.service}</td>
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
                    <td className="px-4 py-5">
                      {formatAppointmentOutcomeLabel(item.attendance_status, item.service_status)}
                    </td>
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
                        <button
                          type="button"
                          onClick={() => onOpenAppointmentClosingModal(item)}
                          className={`rounded-xl px-4 py-3 text-white ${
                            item.closed_at ? 'bg-amber-600' : 'bg-rose-600'
                          }`}
                        >
                          {item.closed_at ? 'Sonucu duzenle' : 'Sonuclandir'}
                        </button>
                        {whatsAppLink ? (
                          <a
                            href={whatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setWhatsAppMessage('')}
                            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#d8ebdc] bg-[#effaf2] px-4 py-3 text-[#1f8e3d]"
                          >
                            WhatsApp hatirlat
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openWhatsAppReminder(item)}
                            className="rounded-xl border border-[#d8ebdc] bg-[#effaf2] px-4 py-3 text-[#1f8e3d]"
                          >
                            WhatsApp hatirlat
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </DashboardSectionCard>

      {isPeriodPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
          <div className="flex max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-[#d9e2ef] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#d9e2ef] px-6 py-5">
              <div>
                <h3 className="text-2xl font-semibold text-slate-800">Secili donemdeki randevular</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {rangeSummary} araliginda bulunan tum kayitlar. Gorunum filtresi uygulanmaz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPeriodPreviewOpen(false)}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-500"
              >
                Kapat
              </button>
            </div>

            <div className="border-b border-[#d9e2ef] bg-[#f8fbff] px-6 py-4 text-sm text-slate-600">
              Toplam {appointmentsInPeriodPreview.length} kayit
            </div>

            <div className="overflow-x-auto overflow-y-auto px-6 py-6">
              {appointmentsInPeriodPreview.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d9e2ef] bg-[#f8fbff] px-4 py-8 text-center text-sm text-slate-400">
                  Secili tarih araliginda randevu yok.
                </div>
              ) : (
                <div className="flex min-w-max gap-4">
                  {appointmentsInPeriodPreview.map((item) => {
                    const whatsAppLink = getWhatsAppReminderLink(item)

                    return (
                    <div
                      key={`period-preview-${item.id}`}
                      className="w-[320px] shrink-0 rounded-3xl border border-[#d9e2ef] bg-[#f8fbff] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-800">{item.customer || '-'}</div>
                          <div className="mt-1 text-sm text-slate-500">{item.service}</div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.closed_at
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.closed_at ? 'Sonuclanan' : 'Acik'}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div>
                          {item.date ? formatShortDate(item.date) : '-'}
                          {item.time ? ` / ${item.time}` : ''}
                        </div>
                        <div>{item.staff || 'Personel yok'}</div>
                        <div>{item.phone || 'Telefon yok'}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-500">
                          {item.status || 'Taslak'}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-500">
                          {formatAppointmentOutcomeLabel(item.attendance_status, item.service_status)}
                        </span>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPeriodPreviewOpen(false)
                            onStartEditingNote(item)
                          }}
                          className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-[#537bb4]"
                        >
                          Duzenle
                        </button>
                        {whatsAppLink ? (
                          <a
                            href={whatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setWhatsAppMessage('')}
                            className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[#d8ebdc] bg-[#effaf2] px-4 py-3 text-sm font-medium text-[#1f8e3d]"
                          >
                            WhatsApp hatirlat
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openWhatsAppReminder(item)}
                            className="rounded-2xl border border-[#d8ebdc] bg-[#effaf2] px-4 py-3 text-sm font-medium text-[#1f8e3d]"
                          >
                            WhatsApp hatirlat
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsPeriodPreviewOpen(false)
                            onOpenAppointmentClosingModal(item)
                          }}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium text-white ${
                            item.closed_at ? 'bg-amber-600' : 'bg-rose-600'
                          }`}
                        >
                          {item.closed_at ? 'Sonucu duzenle' : 'Sonuclandir'}
                        </button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <DashboardMessage message={whatsAppMessage || message} />
    </DashboardPageShell>
  )
}
