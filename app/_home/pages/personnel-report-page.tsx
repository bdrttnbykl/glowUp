import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { CashReportPeriod, PersonnelCompensationRow, StaffMember } from '@/app/_home/types'
import { formatCurrencyValue } from '@/app/_home/utils'

type CompensationDraft = {
  bonusRate: string
  fixedSalary: string
}

type PersonnelReportPageProps = {
  compensationDrafts: Record<string, CompensationDraft>
  isSavingCompensationFor: string | null
  message: string
  onCompensationDraftChange: (
    staffName: string,
    field: keyof CompensationDraft,
    value: string
  ) => void
  onDownloadPayrollPdf: (staffName: string) => void
  onEndDateChange: (value: string) => void
  onOpenPersonnelDetail: (staffName: string) => void
  onPeriodChange: (value: CashReportPeriod) => void
  onRefreshReport: () => void
  onSaveCompensation: (staffName: string) => void
  onStartDateChange: (value: string) => void
  period: CashReportPeriod
  rangeEndDate: string
  rangeStartDate: string
  rows: readonly PersonnelCompensationRow[]
  staffMembers: readonly Pick<StaffMember, 'name' | 'services'>[]
}

const staffPaletteOptions = [
  {
    badge: 'border-[#ffd1c2] bg-[linear-gradient(135deg,#fff2ed_0%,#ffd9cb_100%)] text-[#c75f3e]',
    bar: 'bg-[linear-gradient(180deg,#ffcfb9_0%,#e77b42_100%)]',
    chip: 'bg-[#fff1eb] text-[#c75f3e]',
    rank: 'bg-[#fff2ed] text-[#c75f3e]',
    panel: 'border-[#ffd9cb] bg-[linear-gradient(135deg,#fffaf8_0%,#fff0e7_100%)]',
  },
  {
    badge: 'border-[#bfe7dd] bg-[linear-gradient(135deg,#edfffb_0%,#cdf4ea_100%)] text-[#16786f]',
    bar: 'bg-[linear-gradient(180deg,#9be7d6_0%,#1f9688_100%)]',
    chip: 'bg-[#ecfbf7] text-[#16786f]',
    rank: 'bg-[#ecfbf7] text-[#16786f]',
    panel: 'border-[#c9efe5] bg-[linear-gradient(135deg,#f8fffd_0%,#ebfaf6_100%)]',
  },
  {
    badge: 'border-[#d5d1ff] bg-[linear-gradient(135deg,#f4f1ff_0%,#e2ddff_100%)] text-[#6551d5]',
    bar: 'bg-[linear-gradient(180deg,#d4c8ff_0%,#6f5ef7_100%)]',
    chip: 'bg-[#f2efff] text-[#6551d5]',
    rank: 'bg-[#f2efff] text-[#6551d5]',
    panel: 'border-[#e0dbff] bg-[linear-gradient(135deg,#faf8ff_0%,#f1edff_100%)]',
  },
  {
    badge: 'border-[#ffe2a8] bg-[linear-gradient(135deg,#fff9e9_0%,#ffe8b7_100%)] text-[#b57918]',
    bar: 'bg-[linear-gradient(180deg,#ffe3a6_0%,#e59a1f_100%)]',
    chip: 'bg-[#fff7e0] text-[#b57918]',
    rank: 'bg-[#fff7e0] text-[#b57918]',
    panel: 'border-[#ffe5b5] bg-[linear-gradient(135deg,#fffdf4_0%,#fff5df_100%)]',
  },
] as const

const serviceLabelToneMap: Record<string, string> = {
  'Ayak Bakimi': 'Ayak Uzmani',
  'El Bakimi': 'El Bakimi',
  Manikur: 'Manikur',
  Pedikur: 'Pedikur',
  'Kalici Oje': 'Kalici Oje',
  'Nail Art': 'Nail Artist',
  'Cilt Bakimi': 'Cilt Bakimi',
}

type StaffGlyphKey = 'nail-candle' | 'foot-candle' | 'skin-candle'

const getStaffGlyphKey = (serviceLabel: string): StaffGlyphKey => {
  if (serviceLabel === 'Ayak Bakimi' || serviceLabel === 'Pedikur') {
    return 'foot-candle'
  }

  if (serviceLabel === 'Cilt Bakimi') {
    return 'skin-candle'
  }

  return 'nail-candle'
}

const StaffGlyphIcon = ({
  glyph,
  className,
}: {
  glyph: StaffGlyphKey
  className?: string
}) => {
  if (glyph === 'foot-candle') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 3.3c1.5 1.2 1.9 2.5 1.1 4-.5.9-1.3 1.6-1.1 2.7-1.7-1.1-2.2-2.8-1.3-4.4.4-.8.8-1.3 1.3-2.3Z" />
        <path d="M8.4 10.2h7.2v7.2a3.6 3.6 0 0 1-3.6 3.6 3.6 3.6 0 0 1-3.6-3.6v-7.2Z" />
        <path d="M9.3 10.2V8.9c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7v1.3" />
        <circle cx="10" cy="13.6" r=".55" />
        <circle cx="11.8" cy="12.7" r=".52" />
        <circle cx="13.7" cy="13.2" r=".5" />
        <circle cx="15.1" cy="14.6" r=".45" />
        <path d="M10.3 17.4c1.5-.6 3.2-.4 4.3.8" />
      </svg>
    )
  }

  if (glyph === 'skin-candle') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 3.2c1.4 1.1 1.8 2.4 1.1 3.8-.5 1-.3 1.6.3 2.7-1.7-.6-2.7-2.1-2.7-3.7 0-1 .4-1.8 1.3-2.8Z" />
        <path d="M8.2 10.1h7.6v7.3a3.8 3.8 0 0 1-3.8 3.8 3.8 3.8 0 0 1-3.8-3.8v-7.3Z" />
        <path d="M9.2 10.1V8.8c0-1.5 1.3-2.8 2.8-2.8s2.8 1.3 2.8 2.8v1.3" />
        <path d="M12 17.5c2.2-1 3.5-3 3.7-6.1-2.4.1-4.2.9-5.4 2.3-.9 1.1-1 2.7-.2 3.8.5.7 1.2 1 1.9 1Z" />
        <path d="M10.6 14.9c1.1-.2 2-.1 2.9.3" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3.1c1.8 1.2 2.2 2.7 1.2 4.3-.5.8-1.2 1.4-1.2 2.5-1.8-1-2.3-2.8-1.4-4.5.4-.8.8-1.4 1.4-2.3Z" />
      <path d="M8 10h8v7.6a4 4 0 0 1-4 4 4 4 0 0 1-4-4V10Z" />
      <path d="M9.1 10V8.7c0-1.6 1.3-2.9 2.9-2.9s2.9 1.3 2.9 2.9V10" />
      <path d="m9.8 16.3 3.8-3.8a.9.9 0 0 1 1.2 0l.4.4a.9.9 0 0 1 0 1.2l-3.8 3.8-1.8.4.2-2Z" />
      <path d="m13.3 13.2 1.5 1.5" />
    </svg>
  )
}

const getStaffVisual = (staffName: string, services: readonly string[]) => {
  const paletteIndex =
    staffName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % staffPaletteOptions.length
  const palette = staffPaletteOptions[paletteIndex]
  const primaryService = services[0] || 'Genel Uzman'

  return {
    glyph: getStaffGlyphKey(primaryService),
    palette,
    primaryServiceLabel: serviceLabelToneMap[primaryService] || primaryService,
  }
}

export function PersonnelReportPage({
  compensationDrafts,
  isSavingCompensationFor,
  message,
  onCompensationDraftChange,
  onDownloadPayrollPdf,
  onEndDateChange,
  onOpenPersonnelDetail,
  onPeriodChange,
  onRefreshReport,
  onSaveCompensation,
  onStartDateChange,
  period,
  rangeEndDate,
  rangeStartDate,
  rows,
  staffMembers,
}: PersonnelReportPageProps) {
  const servicesByStaff = staffMembers.reduce<Record<string, readonly string[]>>((result, item) => {
    result[item.name] = item.services || []
    return result
  }, {})
  const visibleRows = rows.filter((item) => servicesByStaff[item.staff] !== undefined)
  const totalRevenue = visibleRows.reduce((sum, item) => sum + item.totalRevenue, 0)
  const totalEarnedAmount = visibleRows.reduce((sum, item) => sum + item.earnedAmount, 0)
  const totalBonusAmount = visibleRows.reduce((sum, item) => sum + item.bonusAmount, 0)
  const appointmentRevenue = visibleRows.reduce((sum, item) => sum + item.appointmentRevenue, 0)
  const packageRevenue = visibleRows.reduce((sum, item) => sum + item.packageRevenue, 0)
  const activeStaffCount = visibleRows.filter((item) => item.totalTransactions > 0).length
  const topEarnedStaff = [...visibleRows].sort((left, right) => right.earnedAmount - left.earnedAmount)[0]
  const topEarnedStaffVisual = topEarnedStaff
    ? getStaffVisual(topEarnedStaff.staff, servicesByStaff[topEarnedStaff.staff] || [])
    : null
  const maxTransactionCount = Math.max(...visibleRows.map((item) => item.totalTransactions), 1)
  const chartRows = [...visibleRows].sort((left, right) => {
    if (right.totalTransactions !== left.totalTransactions) {
      return right.totalTransactions - left.totalTransactions
    }

    return left.staff.localeCompare(right.staff, 'tr-TR')
  })
  const chartScaleLabels = [maxTransactionCount, Math.ceil(maxTransactionCount / 2), 0]

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title="Personel raporu"
        description="Kapanan hizmet tahsilatlarini ve paket satislarini personele gore topla. Sabit maas ve prim oranini girerek hak edisleri hesapla, bordroyu PDF olarak indir."
        actions={
          <>
            <select
              value={period}
              onChange={(event) => onPeriodChange(event.target.value as CashReportPeriod)}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              <option>Bu ay</option>
              <option>Bu hafta</option>
              <option>Bu yil</option>
            </select>
            <button
              type="button"
              onClick={onRefreshReport}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Yenile
            </button>
            <input
              type="date"
              value={rangeStartDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            />
            <input
              type="date"
              value={rangeEndDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            />
          </>
        }
        stats={
          <>
            <DashboardMetric label="Aktif personel" value={`${activeStaffCount}`} />
            <DashboardMetric
              label="Toplam hak edis"
              value={formatCurrencyValue(totalEarnedAmount)}
              tone="emerald"
            />
            <DashboardMetric
              label="Toplam prim"
              value={formatCurrencyValue(totalBonusAmount)}
              tone="amber"
            />
          </>
        }
      />

      <DashboardSectionCard>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#dbe6f2] bg-[linear-gradient(135deg,#f7fbff_0%,#eef6ff_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Hizmet tahsilati
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#274a78]">
              {formatCurrencyValue(appointmentRevenue)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kapanmis randevulardan gelen tahsilat toplami.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#f6fffa_0%,#ebfbf3_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Paket satis geliri
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-emerald-700">
              {formatCurrencyValue(packageRevenue)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Paket satisi acan personele yazilan toplam tutar.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-[linear-gradient(135deg,#fffaf1_0%,#fff3df_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              En yuksek hak edis
            </p>
            {topEarnedStaff && topEarnedStaffVisual ? (
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-[20px] border text-base font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${topEarnedStaffVisual.palette.badge}`}
                >
                  <StaffGlyphIcon glyph={topEarnedStaffVisual.glyph} className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-800">
                    {topEarnedStaff.staff}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {topEarnedStaffVisual.primaryServiceLabel}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-800">
                Veri yok
              </p>
            )}
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {topEarnedStaff
                ? `${topEarnedStaff.totalTransactions} islem / ${formatCurrencyValue(topEarnedStaff.earnedAmount)}`
                : 'Secilen donemde kayit bulunmuyor.'}
            </p>
          </div>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Personel mum analizi
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Her kolon secilen donemde personelin yaptigi toplam islem sayisini gosterir.
            </p>
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-[#d7e0eb] bg-[#f8fbff] px-5 py-8 text-sm text-slate-500">
            Mum grafigi icin aktif personel verisi bulunmuyor.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[840px] rounded-[30px] border border-[#e4ebf3] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Islem dagilimi</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Mum yuksekligi secilen tarihteki toplam islem adedine gore artar.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e3ebf4] bg-white/80 px-4 py-3 text-right shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Tavan deger
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{maxTransactionCount} islem</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-[320px] w-12 shrink-0 flex-col justify-between pb-12 pt-2 text-right text-xs font-semibold text-slate-400">
                  {chartScaleLabels.map((label, index) => (
                    <span key={`chart-scale-${label}-${index}`}>{label}</span>
                  ))}
                </div>

                <div className="min-w-0 flex-1 rounded-[26px] border border-[#edf2f7] bg-white/80 px-4 pb-5 pt-4">
                  <div className="flex h-[296px] items-end gap-5 border-b border-[#dde5ef] bg-[repeating-linear-gradient(to_top,transparent,transparent_63px,#edf2f7_63px,#edf2f7_64px)] px-2 pb-4">
                    {chartRows.map((item) => {
                      const visual = getStaffVisual(item.staff, servicesByStaff[item.staff] || [])
                      const barHeight =
                        item.totalTransactions > 0
                          ? Math.max(52, Math.round((item.totalTransactions / maxTransactionCount) * 228))
                          : 22

                      return (
                        <div
                          key={`bar-${item.staff}`}
                          className="flex min-w-[118px] flex-1 flex-col items-center justify-end gap-3"
                        >
                          <div className="rounded-full border border-white/80 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-[0_10px_18px_rgba(15,23,42,0.08)]">
                            {item.totalTransactions}
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenPersonnelDetail(item.staff)}
                            className="flex w-full flex-col items-center gap-3"
                          >
                            <span
                              className={`relative block w-full overflow-hidden rounded-t-[24px] rounded-b-[12px] shadow-[0_16px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 ${visual.palette.bar}`}
                              style={{ height: `${barHeight}px` }}
                            >
                              <span className="absolute inset-x-3 top-3 h-2 rounded-full bg-white/40" />
                              <span className="absolute inset-x-0 bottom-0 h-7 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.16)_100%)]" />
                            </span>
                            <span className="text-center">
                              <span className="block text-sm font-semibold text-slate-700">{item.staff}</span>
                              <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                {visual.primaryServiceLabel}
                              </span>
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardSectionCard>

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[1560px] bg-white text-left">
            <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[15px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-5 font-semibold">Personel</th>
                <th className="px-4 py-5 font-semibold">Hizmet adedi</th>
                <th className="px-4 py-5 font-semibold">Hizmet geliri</th>
                <th className="px-4 py-5 font-semibold">Paket satisi</th>
                <th className="px-4 py-5 font-semibold">Paket geliri</th>
                <th className="px-4 py-5 font-semibold">Toplam islem</th>
                <th className="px-4 py-5 font-semibold">Hak edis baz</th>
                <th className="px-4 py-5 font-semibold">Pay</th>
                <th className="px-4 py-5 font-semibold">Sabit maas</th>
                <th className="px-4 py-5 font-semibold">Prim %</th>
                <th className="px-4 py-5 font-semibold">Prim</th>
                <th className="px-4 py-5 font-semibold">Hak edis</th>
                <th className="px-4 py-5 font-semibold text-right">Islem</th>
              </tr>
            </thead>
            <tbody className="text-[16px] text-slate-700">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-14 text-center text-slate-400">
                    Personel raporu icin gosterilecek kayit yok.
                  </td>
                </tr>
              ) : (
                visibleRows.map((item, index) => {
                  const share = totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0
                  const draft = compensationDrafts[item.staff] || {
                    bonusRate: item.bonusRate ? String(item.bonusRate) : '',
                    fixedSalary: item.fixedSalary ? String(item.fixedSalary) : '',
                  }
                  const staffServices = servicesByStaff[item.staff] || []
                  const visual = getStaffVisual(item.staff, staffServices)

                  return (
                    <tr
                      key={item.staff}
                      onClick={() => onOpenPersonnelDetail(item.staff)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-[#f8fbff]"
                    >
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3 text-left">
                          <span
                            className={`flex h-14 w-14 items-center justify-center rounded-[20px] border text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${visual.palette.badge}`}
                          >
                            <StaffGlyphIcon glyph={visual.glyph} className="h-7 w-7" />
                          </span>
                          <div>
                            <div className="font-medium text-slate-800">{item.staff}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${visual.palette.rank}`}
                              >
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <span className="text-sm text-slate-500">{visual.primaryServiceLabel}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {staffServices.length > 0 ? (
                                staffServices.slice(0, 3).map((serviceLabel) => (
                                  <span
                                    key={`${item.staff}-${serviceLabel}`}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${visual.palette.chip}`}
                                  >
                                    {serviceLabel}
                                  </span>
                                ))
                              ) : (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                  Hizmet tanimi yok
                                </span>
                              )}
                              {staffServices.length > 3 ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                  +{staffServices.length - 3}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">{item.completedAppointments}</td>
                      <td className="px-4 py-5">{formatCurrencyValue(item.appointmentRevenue)}</td>
                      <td className="px-4 py-5">{item.packageSales}</td>
                      <td className="px-4 py-5">{formatCurrencyValue(item.packageRevenue)}</td>
                      <td className="px-4 py-5">{item.totalTransactions}</td>
                      <td className="px-4 py-5 font-semibold text-[#35588a]">
                        {formatCurrencyValue(item.totalRevenue)}
                      </td>
                      <td className="px-4 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                          %{share.toLocaleString('tr-TR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <input
                          value={draft.fixedSalary}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            onCompensationDraftChange(item.staff, 'fixedSalary', event.target.value)
                          }
                          placeholder="0"
                          inputMode="decimal"
                          className="w-[140px] rounded-xl border border-[#c8d6e8] bg-[#f8fbff] px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-5">
                        <input
                          value={draft.bonusRate}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            onCompensationDraftChange(item.staff, 'bonusRate', event.target.value)
                          }
                          placeholder="0"
                          inputMode="decimal"
                          className="w-[96px] rounded-xl border border-[#c8d6e8] bg-[#f8fbff] px-3 py-2 text-sm outline-none"
                        />
                      </td>
                      <td className="px-4 py-5 font-semibold text-emerald-700">
                        {formatCurrencyValue(item.bonusAmount)}
                      </td>
                      <td className="px-4 py-5 font-semibold text-[#274a78]">
                        {formatCurrencyValue(item.earnedAmount)}
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              onSaveCompensation(item.staff)
                            }}
                            disabled={isSavingCompensationFor === item.staff}
                            className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-2 text-sm font-medium text-[#35588a] disabled:opacity-50"
                          >
                            {isSavingCompensationFor === item.staff ? 'Kaydediliyor' : 'Kaydet'}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              onDownloadPayrollPdf(item.staff)
                            }}
                            className="rounded-xl bg-[#537bb4] px-4 py-2 text-sm font-medium text-white"
                          >
                            PDF
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

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
