import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { PackageSaleRow } from '@/app/_home/types'

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
  const totalRemaining = packageSales.reduce((sum, item) => sum + item.remaining_sessions, 0)
  const activeSessionCount = packageSales.filter((item) => item.has_open_appointment).length

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title={`Paket satislari (${packageSales.length})`}
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
            <DashboardMetric label="Toplam paket" value={`${packageSales.length}`} />
            <DashboardMetric label="Kalan seans" value={`${totalRemaining}`} tone="emerald" />
            <DashboardMetric label="Acik plan" value={`${activeSessionCount}`} tone="amber" />
          </>
        }
      />

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[1540px] bg-white text-left">
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
                    <td className="px-4 py-5 font-medium text-slate-800">{item.customer}</td>
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
                          disabled={item.remaining_sessions === 0 || item.has_open_appointment}
                          className="rounded-xl bg-[#537bb4] px-4 py-3 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {item.remaining_sessions === 0
                            ? 'Hak bitti'
                            : item.has_open_appointment
                              ? 'Acik seans var'
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
