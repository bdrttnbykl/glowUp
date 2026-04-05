import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { Product } from '@/app/_home/types'

type ProductsPageProps = {
  message: string
  onDeleteProduct: (id: number) => void
  onOpenProductModal: () => void
  onRefreshProducts: () => void
  products: Product[]
}

export function ProductsPage({
  message,
  onDeleteProduct,
  onOpenProductModal,
  onRefreshProducts,
  products,
}: ProductsPageProps) {
  const purchaseCount = products.filter((item) => item.transaction_type === 'Alis').length
  const saleCount = products.filter((item) => item.transaction_type === 'Satis').length
  const trackedStockCount = products.filter((item) => !!item.stock && item.stock !== '0').length

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title={`Urun ve hizmet (${products.length})`}
        description="Urun ve hizmet kartlari; islem tipi, ilgili kisi, fiyat ve stok durumu ile tek merkezde tutulur."
        actions={
          <>
            <button
              type="button"
              onClick={onOpenProductModal}
              className="rounded-2xl bg-[#20a638] px-5 py-3 text-sm font-medium text-white"
            >
              Yeni urun / hizmet ekle
            </button>
            <button
              type="button"
              onClick={onRefreshProducts}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Yenile
            </button>
          </>
        }
        stats={
          <>
            <DashboardMetric label="Alis" value={`${purchaseCount}`} />
            <DashboardMetric label="Satis" value={`${saleCount}`} tone="emerald" />
            <DashboardMetric label="Stokta" value={`${trackedStockCount}`} tone="amber" />
          </>
        }
      />

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[1460px] bg-white text-left">
            <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[15px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-5 font-semibold">Urun</th>
                <th className="px-4 py-5 font-semibold">Islem tipi</th>
                <th className="px-4 py-5 font-semibold">Kisi</th>
                <th className="px-4 py-5 font-semibold">Kategori</th>
                <th className="px-4 py-5 font-semibold">Alis fiyati</th>
                <th className="px-4 py-5 font-semibold">Satis fiyati</th>
                <th className="px-4 py-5 font-semibold">Stok</th>
                <th className="px-4 py-5 font-semibold">Olusturulma</th>
                <th className="px-4 py-5 font-semibold text-right">Islem</th>
              </tr>
            </thead>
            <tbody className="text-[16px] text-slate-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-slate-400">
                    Henuz urun yok.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-5 font-medium text-slate-800">{item.product}</td>
                    <td className="px-4 py-5">{item.transaction_type || '-'}</td>
                    <td className="px-4 py-5">{item.counterparty || '-'}</td>
                    <td className="px-4 py-5">{item.category || '-'}</td>
                    <td className="px-4 py-5">{item.cost_price || '-'}</td>
                    <td className="px-4 py-5">{item.price || '-'}</td>
                    <td className="px-4 py-5">{item.stock || '-'}</td>
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
                          onClick={() => onDeleteProduct(item.id)}
                          className="rounded-xl bg-rose-600 px-4 py-3 text-white"
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
