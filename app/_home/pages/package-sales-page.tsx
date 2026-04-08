import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { PackageSaleRow } from '@/app/_home/types'
import { formatCurrencyValue, parseCurrencyValue } from '@/app/_home/utils'

type PackageSalesPageProps = {
  message: string
  onOpenPackageSessionModal: (item: PackageSaleRow) => void
  onOpenPackageSaleModal: () => void
  onRefreshPackageSales: () => void
  packageSales: PackageSaleRow[]
}

export function PackageSalesPage({
  message,
  onOpenPackageSessionModal,
  onOpenPackageSaleModal,
  onRefreshPackageSales,
  packageSales,
}: PackageSalesPageProps) {
  const uniqueCustomerCount = new Set(
    packageSales
      .map((item) => item.customer.trim().toLocaleLowerCase('tr-TR'))
      .filter(Boolean)
  ).size
  const totalRemaining = packageSales.reduce((sum, item) => sum + item.remaining_sessions, 0)
  const openSessionCount = packageSales.filter((item) => item.has_open_appointment).length
  const totalRevenue = packageSales.reduce((sum, item) => sum + parseCurrencyValue(item.price), 0)
  const readyToPlanPackages = packageSales.filter(
    (item) => item.remaining_sessions > 0 && !item.has_open_appointment
  )
  const topRemainingPackages = [...packageSales]
    .sort((left, right) => right.remaining_sessions - left.remaining_sessions)
    .slice(0, 4)
  const sessionTypeRows = Object.entries(
    packageSales.reduce<Record<string, number>>((result, item) => {
      const key = item.session_type.trim() || 'Belirtilmedi'
      result[key] = (result[key] || 0) + 1
      return result
    }, {})
  ).sort((left, right) => right[1] - left[1])

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title={`Paket satislari (${packageSales.length} paket)`}
        description="Satilan paketleri, kalan haklarini ve acik seans planlamasini ayni operasyon panelinde takip et."
        actions={
          <>
            <button
              type="button"
              onClick={onOpenPackageSaleModal}
              className="rounded-2xl bg-[#20a638] px-5 py-3 text-sm font-medium text-white"
            >
              Yeni paket satisi
            </button>
            <button
              type="button"
              onClick={onRefreshPackageSales}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Yenile
            </button>
          </>
        }
        stats={
          <>
            <DashboardMetric label="Toplam musteri" value={`${uniqueCustomerCount}`} />
            <DashboardMetric label="Toplam paket" value={`${packageSales.length}`} tone="slate" />
            <DashboardMetric label="Kalan seans" value={`${totalRemaining}`} tone="emerald" />
            <DashboardMetric
              label="Paket cirosu"
              value={formatCurrencyValue(totalRevenue)}
              tone="amber"
            />
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <DashboardSectionCard className="overflow-hidden border-[#d5dfec] bg-[linear-gradient(135deg,#fdfefe_0%,#f4f9ff_46%,#eef7f1_100%)] p-0">
          <div className="grid gap-0 md:grid-cols-3">
            <div className="border-b border-[#d8e1ee] px-6 py-6 md:border-b-0 md:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#537bb4]">
                Seans hazir
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#274a78]">
                {readyToPlanPackages.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hemen yeni seans planlanabilecek aktif paket sayisi.
              </p>
            </div>
            <div className="border-b border-[#d8e1ee] px-6 py-6 md:border-b-0 md:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Acik seans
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-emerald-700">
                {openSessionCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Takvimde planlanmis ve henuz kapanmamis paket seansi.
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
                Ortalama hak
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-amber-700">
                {packageSales.length > 0 ? Math.round(totalRemaining / packageSales.length) : 0}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Paket basi kalan ortalama seans adedi.
              </p>
            </div>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard className="border-[#d6deea] bg-[linear-gradient(145deg,#fcfdff_0%,#f3f7fd_100%)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#537bb4]">
                Paket dagilimi
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#274a78]">
                Seans tiplerine gore gorunum
              </h2>
            </div>
            <div className="rounded-2xl border border-[#d6dfec] bg-white/80 px-4 py-3 text-right shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Hazir paket
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                {readyToPlanPackages.length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {sessionTypeRows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#d3dcea] px-4 py-4 text-sm text-slate-500">
                Paket tipi verisi henuz yok.
              </p>
            ) : (
              sessionTypeRows.slice(0, 4).map(([label, count]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-[#dbe4ef] bg-white/85 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                      Paket tipi
                    </p>
                  </div>
                  <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-sm font-semibold text-[#35588a]">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </DashboardSectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardSectionCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#537bb4]">
                Oncelikli aksiyon
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#274a78]">
                Seans bekleyen paketler
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {readyToPlanPackages.length} hazir
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {topRemainingPackages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#d3dcea] px-4 py-4 text-sm text-slate-500">
                Paket verisi henuz olusmadi.
              </p>
            ) : (
              topRemainingPackages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenPackageSessionModal(item)}
                  disabled={item.remaining_sessions === 0 && !item.has_open_appointment}
                  className="flex items-center justify-between rounded-[18px] border border-[#dbe4ef] bg-[linear-gradient(135deg,#ffffff_0%,#f6f9ff_100%)] px-4 py-4 text-left transition hover:border-[#9eb6da] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{item.customer}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.package_name} / {item.session_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tracking-[-0.04em] text-[#274a78]">
                      {item.remaining_sessions}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                      kalan seans
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#537bb4]">
            Hizli ozet
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#274a78]">
            Operasyon sinyalleri
          </h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[#dbe4ef] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-800">Planlanmis paket seanslari</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#35588a]">
                {openSessionCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[#dbe4ef] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-800">Toplam paket cirosu</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-emerald-700">
                {formatCurrencyValue(totalRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#dbe4ef] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-800">Paket basina ortalama tutar</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-amber-700">
                {formatCurrencyValue(packageSales.length > 0 ? totalRevenue / packageSales.length : 0)}
              </p>
            </div>
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1240px] bg-white text-left">
            <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[15px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-5 font-semibold">Musteri</th>
                <th className="px-4 py-5 font-semibold">Telefon</th>
                <th className="px-4 py-5 font-semibold">Paket</th>
                <th className="px-4 py-5 font-semibold">Seans tipi</th>
                <th className="px-4 py-5 font-semibold">Toplam seans</th>
                <th className="px-4 py-5 font-semibold">Kullanilan</th>
                <th className="px-4 py-5 font-semibold">Kalan</th>
                <th className="px-4 py-5 font-semibold">Ilk acik seans</th>
                <th className="px-4 py-5 font-semibold">Fiyat</th>
                <th className="px-4 py-5 font-semibold">Olusturulma</th>
                <th className="px-4 py-5 font-semibold text-right">Islem</th>
              </tr>
            </thead>
            <tbody className="text-[16px] text-slate-700">
              {packageSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center text-slate-400">
                    Henuz paket satisi yok.
                  </td>
                </tr>
              ) : (
                packageSales.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-5 font-medium text-slate-800">
                      <button
                        type="button"
                        onClick={() => onOpenPackageSessionModal(item)}
                        disabled={item.remaining_sessions === 0 && !item.has_open_appointment}
                        className="text-left transition hover:text-[#35588a] disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {item.customer}
                      </button>
                    </td>
                    <td className="px-4 py-5">{item.phone || '-'}</td>
                    <td className="px-4 py-5">{item.package_name}</td>
                    <td className="px-4 py-5">{item.session_type}</td>
                    <td className="px-4 py-5">{item.total_sessions}</td>
                    <td className="px-4 py-5">{item.used_sessions}</td>
                    <td className="px-4 py-5">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                        {item.remaining_sessions}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      {item.has_open_appointment ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                          Var
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                          Yok
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5">{item.price || '-'}</td>
                    <td className="px-4 py-5">
                      {new Date(item.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => onOpenPackageSessionModal(item)}
                          disabled={item.remaining_sessions === 0 && !item.has_open_appointment}
                          className="rounded-xl bg-[#537bb4] px-4 py-3 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {item.remaining_sessions === 0 && !item.has_open_appointment
                            ? 'Hak bitti'
                            : item.has_open_appointment
                              ? 'Acik seansi ac'
                              : 'Seans ekle'}
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
