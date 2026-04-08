'use client'

import { useState } from 'react'

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

type SalesTimelineRow = {
  label: string
  packageRevenue: number
  productRevenue: number
  serviceRevenue: number
  shortLabel: string
  totalRevenue: number
}

type SalesReportTab = 'Hizmetler' | 'Ozet' | 'Paket satislari' | 'Urun satislari'
type SalesSeriesKey = keyof Pick<
  SalesTimelineRow,
  'packageRevenue' | 'productRevenue' | 'serviceRevenue' | 'totalRevenue'
>

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
  salesTimelineRows: readonly SalesTimelineRow[]
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

const reportTabs: readonly SalesReportTab[] = [
  'Ozet',
  'Hizmetler',
  'Urun satislari',
  'Paket satislari',
]

const chartSeriesConfig: ReadonlyArray<{
  key: SalesSeriesKey
  label: string
  stroke: string
}> = [
  {
    key: 'totalRevenue',
    label: 'Toplam gelir',
    stroke: '#42dfcf',
  },
  {
    key: 'serviceRevenue',
    label: 'Hizmet gelirleri',
    stroke: '#36d649',
  },
  {
    key: 'productRevenue',
    label: 'Urun satisi gelirleri',
    stroke: '#4b67e9',
  },
  {
    key: 'packageRevenue',
    label: 'Paket satisi gelirleri',
    stroke: '#c84ff0',
  },
]

const getVisibleSeriesKeys = (tab: SalesReportTab): readonly SalesSeriesKey[] => {
  if (tab === 'Hizmetler') {
    return ['serviceRevenue']
  }

  if (tab === 'Urun satislari') {
    return ['productRevenue']
  }

  if (tab === 'Paket satislari') {
    return ['packageRevenue']
  }

  return ['totalRevenue', 'serviceRevenue', 'productRevenue', 'packageRevenue']
}

const getRoundedChartMax = (value: number) => {
  if (value <= 0) {
    return 1
  }

  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude

  if (normalized <= 1) {
    return magnitude
  }

  if (normalized <= 2) {
    return 2 * magnitude
  }

  if (normalized <= 5) {
    return 5 * magnitude
  }

  return 10 * magnitude
}

const buildLinePath = (points: ReadonlyArray<{ x: number; y: number }>) => {
  if (points.length === 0) {
    return ''
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
}

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
  salesTimelineRows,
  serviceRows,
  targetValue,
  targetValueNumeric,
  totals,
}: SalesReportPageProps) {
  const [activeTab, setActiveTab] = useState<SalesReportTab>('Ozet')
  const topPersonnelRows = personnelRows.filter((item) => item.totalRevenue > 0).slice(0, 6)
  const visibleSeriesConfig = chartSeriesConfig.filter((item) =>
    getVisibleSeriesKeys(activeTab).includes(item.key)
  )
  const chartMaxValue = getRoundedChartMax(
    Math.max(
      ...salesTimelineRows.flatMap((row) => visibleSeriesConfig.map((series) => row[series.key])),
      0
    )
  )
  const chartHeight = 320
  const chartPadding = {
    top: 22,
    right: 24,
    bottom: 62,
    left: 74,
  }
  const chartWidth = Math.max(760, salesTimelineRows.length * (period === 'Bu yil' ? 110 : 58))
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const yAxisValues = Array.from({ length: 6 }, (_, index) => (chartMaxValue / 5) * index)
  const chartSeries = visibleSeriesConfig.map((series) => {
    const points = salesTimelineRows.map((row, index) => {
      const x =
        salesTimelineRows.length === 1
          ? chartPadding.left + plotWidth / 2
          : chartPadding.left + (index / (salesTimelineRows.length - 1)) * plotWidth
      const y = chartPadding.top + plotHeight - (row[series.key] / chartMaxValue) * plotHeight

      return {
        value: row[series.key],
        x,
        y,
      }
    })

    return {
      ...series,
      path: buildLinePath(points),
      points,
    }
  })
  const hasChartData = chartSeries.some((series) => series.points.some((point) => point.value > 0))
  const tabSummaryValue =
    activeTab === 'Hizmetler'
      ? totals.serviceRevenue
      : activeTab === 'Urun satislari'
        ? totals.productRevenue
        : activeTab === 'Paket satislari'
          ? totals.packageRevenue
          : totals.totalRevenue
  const tabSummaryCount =
    activeTab === 'Hizmetler'
      ? serviceRows.reduce((sum, item) => sum + item.count, 0)
      : activeTab === 'Urun satislari'
        ? productRows.reduce((sum, item) => sum + item.count, 0)
        : activeTab === 'Paket satislari'
          ? packageRows.reduce((sum, item) => sum + item.count, 0)
          : totals.totalTransactions
  const latestTimelineRow =
    salesTimelineRows.length > 0 ? salesTimelineRows[salesTimelineRows.length - 1] : null
  const previousTimelineRow =
    salesTimelineRows.length > 1 ? salesTimelineRows[salesTimelineRows.length - 2] : null
  const latestRevenue = latestTimelineRow?.totalRevenue || 0
  const previousRevenue = previousTimelineRow?.totalRevenue || 0
  const latestRevenueDelta =
    previousRevenue === 0 ? (latestRevenue === 0 ? 0 : null) : ((latestRevenue - previousRevenue) / previousRevenue) * 100
  const now = new Date()
  const totalPeriodSlots =
    period === 'Bu hafta'
      ? 7
      : period === 'Bu ay'
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        : 12
  const projectedRevenue =
    salesTimelineRows.length > 0 ? (totals.totalRevenue / salesTimelineRows.length) * totalPeriodSlots : 0
  const projectedTargetDelta = projectedRevenue - targetValueNumeric
  const leadingChannel = [
    {
      count: serviceRows.reduce((sum, item) => sum + item.count, 0),
      label: 'Hizmet',
      revenue: totals.serviceRevenue,
    },
    {
      count: packageRows.reduce((sum, item) => sum + item.count, 0),
      label: 'Paket',
      revenue: totals.packageRevenue,
    },
    {
      count: productRows.reduce((sum, item) => sum + item.count, 0),
      label: 'Urun',
      revenue: totals.productRevenue,
    },
  ].sort((left, right) => right.revenue - left.revenue)[0]
  const topServiceRow = serviceRows[0] || null
  const topProductRow = productRows[0] || null
  const topPackageRow = packageRows[0] || null
  const topPersonnelRow = topPersonnelRows[0] || null
  const topDayRow =
    [...dayRows].sort((left, right) => right.revenue - left.revenue || right.transactions - left.transactions)[0] ||
    null
  const topHourRow = hourRows[0] || null
  const topPaymentRow = paymentRows[0] || null
  const newCustomerRow =
    customerSegmentRows.find((item) => item.label === 'Yeni musteri') || null
  const existingCustomerRow =
    customerSegmentRows.find((item) => item.label === 'Mevcut musteri') || null

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

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="border-b border-[#d7e0eb] bg-[#f8fafc] px-3 pt-3">
          <div className="flex flex-wrap items-end gap-1">
            <div className="rounded-t-2xl border border-[#d7e0eb] border-b-white bg-white px-4 py-3 text-sm font-medium text-slate-600">
              Gunluk / donem raporu
            </div>
            {reportTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-t-2xl border px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'border-[#c6d6ea] border-b-white bg-white text-[#315887]'
                    : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
                {activeTab === 'Ozet'
                  ? 'Gelir ozeti'
                  : activeTab === 'Hizmetler'
                    ? 'Hizmet satis akisi'
                    : activeTab === 'Urun satislari'
                      ? 'Urun satis akisi'
                      : 'Paket satis akisi'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {activeTab === 'Ozet'
                  ? 'Toplam gelir, hizmet, urun ve paket katkilari ayni grafikte izlenir.'
                  : activeTab === 'Hizmetler'
                    ? 'Randevu kapanislarindan gelen hizmet geliri toplam ciro ile birlikte izlenir.'
                    : activeTab === 'Urun satislari'
                      ? '`Satis` tipindeki urun hareketlerinin donem icindeki etkisi cizilir.'
                      : 'Paket satis kayitlarinin donem icindeki ciro etkisi ayri gorunur.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#d7e0eb] bg-[#f8fbff] px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
                  Secili kanal
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-800">{activeTab}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {tabSummaryCount.toLocaleString('tr-TR')} islem
                </p>
              </div>
              <div className="rounded-2xl border border-[#d7e0eb] bg-[#f8fbff] px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
                  Gelir
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-800">
                  {formatCurrencyValue(tabSummaryValue)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {salesTimelineRows.length.toLocaleString('tr-TR')} veri noktasi
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {visibleSeriesConfig.map((series) => (
              <div
                key={series.key}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              >
                <span className="h-3 w-9 rounded-full" style={{ backgroundColor: series.stroke }} />
                <span>{series.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="relative min-w-full" style={{ width: `${chartWidth}px` }}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-[320px] w-full text-slate-400"
                role="img"
                aria-label="Satis raporu cizgi grafigi"
              >
                {yAxisValues.map((tick) => {
                  const y = chartPadding.top + plotHeight - (tick / chartMaxValue) * plotHeight

                  return (
                    <g key={tick}>
                      <line
                        x1={chartPadding.left}
                        y1={y}
                        x2={chartWidth - chartPadding.right}
                        y2={y}
                        stroke="#dce4ee"
                        strokeWidth="1"
                      />
                      <text
                        x={chartPadding.left - 12}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="12"
                        fill="#7b8aa0"
                      >
                        {Math.round(tick).toLocaleString('tr-TR')}
                      </text>
                    </g>
                  )
                })}

                {salesTimelineRows.map((row, index) => {
                  const x =
                    salesTimelineRows.length === 1
                      ? chartPadding.left + plotWidth / 2
                      : chartPadding.left + (index / (salesTimelineRows.length - 1)) * plotWidth

                  return (
                    <g key={`${row.label}-${index}`}>
                      <line
                        x1={x}
                        y1={chartPadding.top}
                        x2={x}
                        y2={chartPadding.top + plotHeight}
                        stroke="#eef2f7"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={chartHeight - 18}
                        fontSize="12"
                        fill="#6b7280"
                        textAnchor="end"
                        transform={`rotate(-24 ${x} ${chartHeight - 18})`}
                      >
                        {row.shortLabel}
                      </text>
                    </g>
                  )
                })}

                {chartSeries.map((series) => (
                  <path
                    key={series.key}
                    d={series.path}
                    fill="none"
                    stroke={series.stroke}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {chartSeries.map((series) =>
                  series.points.map((point, index) => (
                    <circle
                      key={`${series.key}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#ffffff"
                      stroke={series.stroke}
                      strokeWidth="2.5"
                    />
                  ))
                )}
              </svg>

              {!hasChartData && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[18px] border border-dashed border-[#d7e0eb] bg-white/70 text-sm text-slate-500">
                  Secili donemde cizilecek gelir hareketi yok.
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Grafik su an takip edilen gelir kalemlerini gosterir. Masraf veya puan hareketleri
            icin veri geldikce ayni yuzeye ek seri eklenebilir.
          </p>
        </div>
      </DashboardSectionCard>

      {activeTab === 'Ozet' && (
        <>
          <DashboardSectionCard>
            <div className="grid gap-4 xl:grid-cols-4">
              <div className="rounded-3xl border border-[#dbe6f2] bg-[linear-gradient(135deg,#f7fbff_0%,#eef6ff_100%)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                    Donem nabzi
                  </p>
                  {renderDeltaPill(latestRevenueDelta)}
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#274a78]">
                  {formatCurrencyValue(latestRevenue)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {latestTimelineRow
                    ? `${latestTimelineRow.shortLabel} icin kaydedilen son gelir noktasi.`
                    : 'Secili donemde gelir hareketi yok.'}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#f6fffa_0%,#ebfbf3_100%)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Pace tahmini
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-emerald-700">
                  {formatCurrencyValue(projectedRevenue)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {targetValueNumeric > 0
                    ? projectedTargetDelta >= 0
                      ? `Bu hizla hedefin ${formatCurrencyValue(projectedTargetDelta)} uzerindesin.`
                      : `Bu hizla hedefin ${formatCurrencyValue(Math.abs(projectedTargetDelta))} altindasin.`
                    : 'Donem hizi baz alinarak tahmini kapanis hesabi.'}
                </p>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-[linear-gradient(135deg,#fffaf1_0%,#fff3df_100%)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Lider kanal
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-amber-700">
                  {leadingChannel?.label || 'Veri yok'}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {leadingChannel
                    ? `${formatCurrencyValue(leadingChannel.revenue)} ve ${leadingChannel.count.toLocaleString('tr-TR')} islem`
                    : 'Kanal bazli gelir verisi yok.'}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Lider personel
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-800">
                  {topPersonnelRow?.staff || 'Veri yok'}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {topPersonnelRow
                    ? `${formatCurrencyValue(topPersonnelRow.totalRevenue)} ve ${topPersonnelRow.totalTransactions} islem`
                    : 'Personel performans verisi yok.'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-[#d7e0eb] bg-[linear-gradient(135deg,#fcfdff_0%,#f4f8fc_100%)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
                      En cok satanlar
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Donem icinde en yuksek ciro getiren kartlar.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#d7e0eb] bg-white px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
                      Toplam ciro
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-800">
                      {formatCurrencyValue(totals.totalRevenue)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-[#d7e0eb] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                      Hizmet lideri
                    </p>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-800">
                      {topServiceRow?.service || 'Veri yok'}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-[#35588a]">
                      {formatCurrencyValue(topServiceRow?.revenue || 0)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topServiceRow
                        ? `${topServiceRow.count} islem, ortalama ${formatCurrencyValue(topServiceRow.averageTicket)}`
                        : 'Hizmet satisi yok.'}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-100 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                      Urun lideri
                    </p>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-800">
                      {topProductRow?.product || 'Veri yok'}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-amber-700">
                      {formatCurrencyValue(topProductRow?.revenue || 0)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topProductRow
                        ? `${topProductRow.count} islem, kategori ${topProductRow.category}`
                        : 'Urun satisi yok.'}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-emerald-100 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Paket lideri
                    </p>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-800">
                      {topPackageRow?.packageLabel || 'Veri yok'}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-emerald-700">
                      {formatCurrencyValue(topPackageRow?.revenue || 0)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topPackageRow
                        ? `${topPackageRow.count} islem, ortalama ${formatCurrencyValue(topPackageRow.averageTicket)}`
                        : 'Paket satisi yok.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] p-5">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
                  Hizli bakis
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Donemin ritmini bozmadan tek bakista okunacak ozet.
                </p>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="font-semibold text-slate-700">En guclu gun</p>
                      <p className="mt-1 text-slate-500">
                        {topDayRow ? `${topDayRow.transactions} islem` : 'Veri yok'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{topDayRow?.label || '-'}</p>
                      <p className="mt-1 text-slate-500">
                        {formatCurrencyValue(topDayRow?.revenue || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="font-semibold text-slate-700">En yogun saat</p>
                      <p className="mt-1 text-slate-500">
                        {topHourRow ? `${topHourRow.transactions} islem` : 'Veri yok'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{topHourRow?.label || '-'}</p>
                      <p className="mt-1 text-slate-500">
                        {formatCurrencyValue(topHourRow?.revenue || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="font-semibold text-slate-700">Baskin odeme</p>
                      <p className="mt-1 text-slate-500">
                        {topPaymentRow ? `%${percentageFormatter.format(topPaymentRow.share)} pay` : 'Veri yok'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{topPaymentRow?.method || '-'}</p>
                      <p className="mt-1 text-slate-500">
                        {formatCurrencyValue(topPaymentRow?.amount || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-700">Musteri karmasi</p>
                      <p className="mt-1 text-slate-500">
                        Yeni ve mevcut musteri geliri
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">
                        %{percentageFormatter.format(newCustomerRow?.share || 0)} yeni
                      </p>
                      <p className="mt-1 text-slate-500">
                        %{percentageFormatter.format(existingCustomerRow?.share || 0)} mevcut
                      </p>
                    </div>
                  </div>
                </div>
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
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_240px]">
                <div className="rounded-3xl border border-[#d7e0eb] bg-white p-5">
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

                <div className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                    Tahmini kapanis
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-800">
                    {formatCurrencyValue(projectedRevenue)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Donem hizina gore hedefin
                    {' '}
                    {projectedTargetDelta >= 0 ? 'ustunde' : 'altinda'}
                    {' '}
                    kapanis tahmini.
                  </p>
                </div>
              </div>
            )}
          </DashboardSectionCard>
        </>
      )}

      {activeTab === 'Ozet' && (
        <>
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

        </>
      )}

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
