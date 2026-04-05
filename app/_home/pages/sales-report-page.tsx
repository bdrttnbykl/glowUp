import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { CashReportPeriod, PersonnelReportRow } from '@/app/_home/types'
import { formatCurrencyValue } from '@/app/_home/utils'

type ComparisonCard = {
  currentValue: number
  deltaRatio: number | null
  label: string
  previousValue: number
  type: 'currency' | 'count'
}

type ServiceRow = {
  averageTicket: number
  count: number
  revenue: number
  service: string
}

type PackageRow = {
  averageTicket: number
  count: number
  packageLabel: string
  revenue: number
}

type PaymentRow = {
  amount: number
  count: number
  method: string
  share: number
}

type ActivityRow = {
  label: string
  revenue: number
  transactions: number
}

type CustomerSegmentRow = {
  customerCount: number
  label: string
  revenue: number
  share: number
  transactions: number
}

type CreatorRow = {
  appointments: number
  creator: string
  packages: number
  revenue: number
}

type ProductRow = {
  averagePrice: number
  category: string
  count: number
  product: string
  revenue: number
}

type SalesReportPageProps = {
  comparisonCards: readonly ComparisonCard[]
  creatorRows: readonly CreatorRow[]
  customerSegmentRows: readonly CustomerSegmentRow[]
  dayRows: readonly ActivityRow[]
  hourRows: readonly ActivityRow[]
  message: string
  onPeriodChange: (value: CashReportPeriod) => void
  onRefreshReport: () => void
  onTargetChange: (value: string) => void
  packageRows: readonly PackageRow[]
  paymentRows: readonly PaymentRow[]
  period: CashReportPeriod
  personnelRows: readonly PersonnelReportRow[]
  productRows: readonly ProductRow[]
  serviceRows: readonly ServiceRow[]
  targetValue: string
  targetValueNumeric: number
  totals: {
    activePersonnelCount: number
    averageBasket: number
    packageRevenue: number
    paymentTrackedRevenue: number
    productRevenue: number
    serviceRevenue: number
    targetProgress: number
    targetRemaining: number
    topServiceLabel: string
    totalRevenue: number
    totalTransactions: number
    untrackedPaymentRevenue: number
  }
}

const percentageFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const formatMetricValue = (value: number, type: ComparisonCard['type']) => {
  if (type === 'currency') {
    return formatCurrencyValue(value)
  }

  return value.toLocaleString('tr-TR')
}

const renderDeltaPill = (deltaRatio: number | null) => {
  if (deltaRatio === null) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Baz yok
      </span>
    )
  }

  const toneClassName =
    deltaRatio > 0
      ? 'bg-emerald-100 text-emerald-700'
      : deltaRatio < 0
        ? 'bg-rose-100 text-rose-700'
        : 'bg-slate-100 text-slate-600'

  const prefix = deltaRatio > 0 ? '+' : ''

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${toneClassName}`}
    >
      {`${prefix}%${percentageFormatter.format(deltaRatio)}`}
    </span>
  )
}

export function SalesReportPage({
  comparisonCards,
  creatorRows,
  customerSegmentRows,
  dayRows,
  hourRows,
  message,
  onPeriodChange,
  onRefreshReport,
  onTargetChange,
  packageRows,
  paymentRows,
  period,
  personnelRows,
  productRows,
  serviceRows,
  targetValue,
  targetValueNumeric,
  totals,
}: SalesReportPageProps) {
  const topPersonnelRows = personnelRows.filter((item) => item.totalRevenue > 0).slice(0, 6)

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title="Satis raporlari"
        description="Hizmet, paket ve urun gelirlerini ayni yuzeyde topla. Donem karsilastirmasi, yogunluk, musteri segmenti ve performans kirilimlarini tek raporda gorebilirsin."
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
            <input
              value={targetValue}
              onChange={(event) => onTargetChange(event.target.value)}
              placeholder="Satis hedefi"
              className="min-w-[170px] rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              onClick={onRefreshReport}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Yenile
            </button>
          </>
        }
        stats={
          <>
            <DashboardMetric label="Toplam satis" value={formatCurrencyValue(totals.totalRevenue)} />
            <DashboardMetric
              label="Ortalama sepet"
              value={formatCurrencyValue(totals.averageBasket)}
              tone="emerald"
            />
            <DashboardMetric
              label="Hedef gerceklesme"
              value={
                targetValueNumeric > 0
                  ? `%${percentageFormatter.format(totals.targetProgress)}`
                  : 'Hedef gir'
              }
              tone="amber"
            />
          </>
        }
      />

      <DashboardSectionCard>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#dbe6f2] bg-[linear-gradient(135deg,#f7fbff_0%,#eef6ff_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Hizmet satisi
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#274a78]">
              {formatCurrencyValue(totals.serviceRevenue)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Randevu tahsilatlarindan gelen toplam gelir.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#f6fffa_0%,#ebfbf3_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Paket satisi
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-emerald-700">
              {formatCurrencyValue(totals.packageRevenue)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Paket kayitlarindan yazilan toplam gelir.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-[linear-gradient(135deg,#fffaf1_0%,#fff3df_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Urun satisi
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-amber-700">
              {formatCurrencyValue(totals.productRevenue)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              `Satis` tipi urun kayitlarinin toplam tutari.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Lider hizmet
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-800">
              {totals.topServiceLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {totals.totalTransactions.toLocaleString('tr-TR')} satis isleminden olusan donem ozeti.
            </p>
          </div>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Donem karsilastirmasi
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Secili donem, ayni uzunluktaki onceki donemle karsilastirilir.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7e0eb] bg-[#f8fbff] px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
              Hedef durumu
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-800">
              {targetValueNumeric > 0
                ? formatCurrencyValue(totals.targetRemaining > 0 ? totals.targetRemaining : 0)
                : 'Hedef gir'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {targetValueNumeric > 0 ? 'Kalan hedef' : 'Rapor ici hedef tanimlanmadi'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {comparisonCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-[#d7e0eb] bg-[linear-gradient(135deg,#fcfdff_0%,#f4f8fc_100%)] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                  {card.label}
                </p>
                {renderDeltaPill(card.deltaRatio)}
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-800">
                {formatMetricValue(card.currentValue, card.type)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Onceki donem: {formatMetricValue(card.previousValue, card.type)}
              </p>
            </div>
          ))}
        </div>

        {targetValueNumeric > 0 && (
          <div className="mt-5 rounded-3xl border border-[#d7e0eb] bg-white p-5">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
              <span>Hedef gerceklesme</span>
              <span>
                {formatCurrencyValue(totals.totalRevenue)} / {formatCurrencyValue(targetValueNumeric)}
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#4c7bc0_0%,#22c55e_100%)] transition-[width]"
                style={{ width: `${Math.min(totals.targetProgress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </DashboardSectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Hizmet bazli satis
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Gelir ureten randevular hizmet bazinda gruplanir.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Hizmet</th>
                  <th className="px-4 py-4 font-semibold">Adet</th>
                  <th className="px-4 py-4 font-semibold">Gelir</th>
                  <th className="px-4 py-4 font-semibold">Ort. sepet</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {serviceRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Hizmet satis verisi yok.
                    </td>
                  </tr>
                ) : (
                  serviceRows.map((item) => (
                    <tr key={item.service} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.service}</td>
                      <td className="px-4 py-4">{item.count}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.revenue)}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.averageTicket)}</td>
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
              Paket bazli satis
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Paket kayitlari tipine gore adet ve ciro dagilimi.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Paket</th>
                  <th className="px-4 py-4 font-semibold">Adet</th>
                  <th className="px-4 py-4 font-semibold">Gelir</th>
                  <th className="px-4 py-4 font-semibold">Ort. fiyat</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {packageRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Paket satis verisi yok.
                    </td>
                  </tr>
                ) : (
                  packageRows.map((item) => (
                    <tr key={item.packageLabel} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.packageLabel}</td>
                      <td className="px-4 py-4">{item.count}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.revenue)}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.averageTicket)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Personel bazli performans
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Secili donemde aktif personelin islem ve ciro dagilimi.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Personel</th>
                  <th className="px-4 py-4 font-semibold">Hizmet</th>
                  <th className="px-4 py-4 font-semibold">Paket</th>
                  <th className="px-4 py-4 font-semibold">Toplam islem</th>
                  <th className="px-4 py-4 font-semibold">Ciro</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {topPersonnelRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      Personel satis verisi yok.
                    </td>
                  </tr>
                ) : (
                  topPersonnelRows.map((item) => (
                    <tr key={item.staff} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.staff}</td>
                      <td className="px-4 py-4">{item.completedAppointments}</td>
                      <td className="px-4 py-4">{item.packageSales}</td>
                      <td className="px-4 py-4">{item.totalTransactions}</td>
                      <td className="px-4 py-4 font-semibold text-[#35588a]">
                        {formatCurrencyValue(item.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Aktif personel
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-800">
                {totals.activePersonnelCount}
              </p>
            </div>
            <div className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Islem basina ciro
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-800">
                {formatCurrencyValue(totals.averageBasket)}
              </p>
            </div>
            <div className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Yontemi kayitli tahsilat
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-800">
                {formatCurrencyValue(totals.paymentTrackedRevenue)}
              </p>
            </div>
          </div>
        </DashboardSectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Odeme yontemi dagilimi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Bu tablo sadece odeme yontemi kayitli randevu tahsilatlarindan hesaplanir.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Yontem</th>
                  <th className="px-4 py-4 font-semibold">Adet</th>
                  <th className="px-4 py-4 font-semibold">Tutar</th>
                  <th className="px-4 py-4 font-semibold">Pay</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {paymentRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Odeme yontemi verisi yok.
                    </td>
                  </tr>
                ) : (
                  paymentRows.map((item) => (
                    <tr key={item.method} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.method}</td>
                      <td className="px-4 py-4">{item.count}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.amount)}</td>
                      <td className="px-4 py-4">%{percentageFormatter.format(item.share)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totals.untrackedPaymentRevenue > 0 && (
            <div className="border-t border-[#d7e0eb] bg-[#fffaf1] px-5 py-4 text-sm text-slate-600">
              Odeme yontemi kaydi olmayan urun geliri:
              <span className="ml-2 font-semibold text-amber-700">
                {formatCurrencyValue(totals.untrackedPaymentRevenue)}
              </span>
            </div>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
            Yeni musteri vs mevcut musteri
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Musterinin ilk satis tarihi secili doneme denk geliyorsa `yeni`, daha once satisi varsa `mevcut` kabul edilir.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {customerSegmentRows.length === 0 ? (
              <div className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] px-5 py-10 text-center text-slate-400 md:col-span-2">
                Musteri segment verisi yok.
              </div>
            ) : (
              customerSegmentRows.map((item) => (
                <div key={item.label} className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-800">
                    {formatCurrencyValue(item.revenue)}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Musteri</span>
                      <span>{item.customerCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Islem</span>
                      <span>{item.transactions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pay</span>
                      <span>%{percentageFormatter.format(item.share)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardSectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Gun bazli satis yogunlugu
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hizmet, paket ve urun satis olaylari gunlere gore dagitilir.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Gun</th>
                  <th className="px-4 py-4 font-semibold">Islem</th>
                  <th className="px-4 py-4 font-semibold">Ciro</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {dayRows.map((item) => (
                  <tr key={item.label} className="border-b border-slate-100">
                    <td className="px-4 py-4 font-medium text-slate-800">{item.label}</td>
                    <td className="px-4 py-4">{item.transactions}</td>
                    <td className="px-4 py-4">{formatCurrencyValue(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Saat bazli satis yogunlugu
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              En yogun saatler ciro ve islem adetleriyle listelenir.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Saat</th>
                  <th className="px-4 py-4 font-semibold">Islem</th>
                  <th className="px-4 py-4 font-semibold">Ciro</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {hourRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                      Saat bazli satis verisi yok.
                    </td>
                  </tr>
                ) : (
                  hourRows.map((item) => (
                    <tr key={item.label} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.label}</td>
                      <td className="px-4 py-4">{item.transactions}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Urun satis raporu
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              `Satis` tipindeki urun kayitlari baz alinir.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Urun</th>
                  <th className="px-4 py-4 font-semibold">Kategori</th>
                  <th className="px-4 py-4 font-semibold">Adet</th>
                  <th className="px-4 py-4 font-semibold">Gelir</th>
                  <th className="px-4 py-4 font-semibold">Ort. fiyat</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {productRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      Urun satis verisi yok.
                    </td>
                  </tr>
                ) : (
                  productRows.map((item) => (
                    <tr key={`${item.product}-${item.category}`} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.product}</td>
                      <td className="px-4 py-4">{item.category}</td>
                      <td className="px-4 py-4">{item.count}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.revenue)}</td>
                      <td className="px-4 py-4">{formatCurrencyValue(item.averagePrice)}</td>
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
              Olusturan kullanici bazli rapor
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sube verisi olmadigi icin rapor, kaydi acan kullaniciya gore olusturulur.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Olusturan</th>
                  <th className="px-4 py-4 font-semibold">Randevu</th>
                  <th className="px-4 py-4 font-semibold">Paket</th>
                  <th className="px-4 py-4 font-semibold">Ciro</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {creatorRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Olusturan bazli veri yok.
                    </td>
                  </tr>
                ) : (
                  creatorRows.map((item) => (
                    <tr key={item.creator} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.creator}</td>
                      <td className="px-4 py-4">{item.appointments}</td>
                      <td className="px-4 py-4">{item.packages}</td>
                      <td className="px-4 py-4 font-semibold text-[#35588a]">
                        {formatCurrencyValue(item.revenue)}
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
