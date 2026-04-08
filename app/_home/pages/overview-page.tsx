'use client'

import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { AppointmentRow, PersonnelReportRow } from '@/app/_home/types'
import { formatCurrencyValue } from '@/app/_home/utils'

type OverviewServiceRow = {
  count: number
  revenue: number
  service: string
}

type OverviewPageProps = {
  message: string
  onChangePersonnelPeriod: (value: 'Bugun' | 'Bu hafta' | 'Bu ay') => void
  personnelPeriod: 'Bugun' | 'Bu hafta' | 'Bu ay'
  upcomingAppointments: readonly AppointmentRow[]
  topPersonnelRows: readonly PersonnelReportRow[]
  topServiceRows: readonly OverviewServiceRow[]
  totals: {
    activePackages: number
    monthlyRevenue: number
    openAppointments: number
    packageRevenue: number
    productRevenue: number
    serviceRevenue: number
    todayAppointments: number
    totalCustomers: number
  }
}

export function OverviewPage({
  message,
  onChangePersonnelPeriod,
  personnelPeriod,
  upcomingAppointments,
  topPersonnelRows,
  topServiceRows,
  totals,
}: OverviewPageProps) {
  const personnelPeriodDescription =
    personnelPeriod === 'Bugun'
      ? 'Bugun gelir yaratan personel dagilimi.'
      : personnelPeriod === 'Bu hafta'
        ? 'Bu hafta gelir yaratan personel dagilimi.'
        : 'Bu ay gelir yaratan personel dagilimi.'

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title="Ozet"
        description="Gunluk operasyon, satis dagilimi ve en yakin randevulari tek ekranda izle."
        stats={
          <>
            <DashboardMetric label="Bugun randevu" value={`${totals.todayAppointments}`} tone="emerald" />
            <DashboardMetric label="Acik randevu" value={`${totals.openAppointments}`} />
            <DashboardMetric
              label="Aylik ciro"
              value={formatCurrencyValue(totals.monthlyRevenue)}
              tone="amber"
            />
          </>
        }
      />

      <DashboardSectionCard>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#dbe6f2] bg-[linear-gradient(135deg,#f7fbff_0%,#eef6ff_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Musteri havuzu
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#274a78]">
              {totals.totalCustomers}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kayitli ve randevudan birlesen toplam musteri sayisi.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#f6fffa_0%,#ebfbf3_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Aktif paket
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-emerald-700">
              {totals.activePackages}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Icinde kullanilmamis seans bulunan paket satisi.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-[linear-gradient(135deg,#fffaf1_0%,#fff3df_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Hizmet geliri
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-amber-700">
              {formatCurrencyValue(totals.serviceRevenue)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Bu ay kapanan randevulardan gelen gelir.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Paket + urun
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-800">
              {formatCurrencyValue(totals.packageRevenue + totals.productRevenue)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Bu ay paket ve urun tarafindan gelen ek ciro.
            </p>
          </div>
        </div>
      </DashboardSectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSectionCard className="overflow-hidden p-0">
          <div className="border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Yaklasan randevular
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Takip etmen gereken en yakin acik kayitlar.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full bg-white text-left">
              <thead className="border-b border-[#e4ebf3] text-[13px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Musteri</th>
                  <th className="px-4 py-4 font-semibold">Hizmet</th>
                  <th className="px-4 py-4 font-semibold">Tarih</th>
                  <th className="px-4 py-4 font-semibold">Saat</th>
                  <th className="px-4 py-4 font-semibold">Personel</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-slate-700">
                {upcomingAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      Yaklasan randevu yok.
                    </td>
                  </tr>
                ) : (
                  upcomingAppointments.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-800">{item.customer || '-'}</td>
                      <td className="px-4 py-4">{item.service}</td>
                      <td className="px-4 py-4">{item.date || '-'}</td>
                      <td className="px-4 py-4">{item.time || '-'}</td>
                      <td className="px-4 py-4">{item.staff || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
            En iyi hizmetler
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Bu ay en cok ciro getiren hizmetler.
          </p>

          <div className="mt-5 space-y-3">
            {topServiceRows.length === 0 ? (
              <div className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] px-5 py-10 text-center text-slate-400">
                Hizmet verisi yok.
              </div>
            ) : (
              topServiceRows.map((item) => (
                <div
                  key={item.service}
                  className="rounded-3xl border border-[#d7e0eb] bg-[#f8fbff] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{item.service}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.count} islem
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#35588a]">
                      {formatCurrencyValue(item.revenue)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-[#d7e0eb] bg-[#f6f9fd] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-800">
              Personel performansi
            </h2>
            <p className="mt-1 text-sm text-slate-500">{personnelPeriodDescription}</p>
          </div>

          <select
            value={personnelPeriod}
            onChange={(event) =>
              onChangePersonnelPeriod(event.target.value as 'Bugun' | 'Bu hafta' | 'Bu ay')
            }
            className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="Bugun">Bu gunluk</option>
            <option value="Bu hafta">Bu haftalik</option>
            <option value="Bu ay">Bu aylik</option>
          </select>
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
                    Personel verisi yok.
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

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
