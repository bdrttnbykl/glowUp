import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { CashReportPeriod, PersonnelCompensationRow } from '@/app/_home/types'
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
}: PersonnelReportPageProps) {
  const totalRevenue = rows.reduce((sum, item) => sum + item.totalRevenue, 0)
  const totalEarnedAmount = rows.reduce((sum, item) => sum + item.earnedAmount, 0)
  const totalBonusAmount = rows.reduce((sum, item) => sum + item.bonusAmount, 0)
  const appointmentRevenue = rows.reduce((sum, item) => sum + item.appointmentRevenue, 0)
  const packageRevenue = rows.reduce((sum, item) => sum + item.packageRevenue, 0)
  const activeStaffCount = rows.filter((item) => item.totalTransactions > 0).length
  const topEarnedStaff = [...rows].sort((left, right) => right.earnedAmount - left.earnedAmount)[0]

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
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-800">
              {topEarnedStaff?.staff || 'Veri yok'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {topEarnedStaff
                ? `${topEarnedStaff.totalTransactions} islem / ${formatCurrencyValue(topEarnedStaff.earnedAmount)}`
                : 'Secilen donemde kayit bulunmuyor.'}
            </p>
          </div>
        </div>
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-14 text-center text-slate-400">
                    Personel raporu icin gosterilecek kayit yok.
                  </td>
                </tr>
              ) : (
                rows.map((item, index) => {
                  const share = totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0
                  const draft = compensationDrafts[item.staff] || {
                    bonusRate: item.bonusRate ? String(item.bonusRate) : '',
                    fixedSalary: item.fixedSalary ? String(item.fixedSalary) : '',
                  }

                  return (
                    <tr
                      key={item.staff}
                      onClick={() => onOpenPersonnelDetail(item.staff)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-[#f8fbff]"
                    >
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3 text-left">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                              index === 0 && item.totalRevenue > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-[#edf4ff] text-[#35588a]'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="font-medium text-slate-800">{item.staff}</div>
                            <div className="text-sm text-slate-400">
                              {item.totalTransactions > 0 ? 'Detayi gor' : 'Kayit yok'}
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
