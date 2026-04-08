import {
  DashboardMessage,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { Product } from '@/app/_home/types'

type ProductsPageProps = {
  message: string
  onDeleteProduct: (id: number) => void
  onEditProduct: (product: Product) => void
  onOpenProductHistory: (productName: string) => void
  onOpenProductModal: () => void
  onRefreshProducts: () => void
  products: Product[]
}

export function ProductsPage({
  message,
  onDeleteProduct,
  onEditProduct,
  onOpenProductHistory,
  onOpenProductModal,
  onRefreshProducts,
  products,
}: ProductsPageProps) {
  const visibleProducts = products.filter(
    (item) => item.item_type === 'Hizmet' || item.transaction_type !== 'Satis'
  )

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title={`Urun ve hizmet (${visibleProducts.length})`}
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
      />

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[1460px] bg-white text-left">
            <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[15px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-5 font-semibold">Kayit</th>
                <th className="px-4 py-5 font-semibold">Kart tipi</th>
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
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-slate-400">
                    Henuz urun veya hizmet yok.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onOpenProductHistory(item.product)}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-[#f8fbff]"
                  >
                    <td className="px-4 py-5 font-medium text-slate-800">
                      <button
                        type="button"
                        onClick={() => onOpenProductHistory(item.product)}
                        className="w-full text-left transition hover:text-[#35588a] hover:underline"
                      >
                        {item.product}
                      </button>
                    </td>
                    <td className="px-4 py-5">{item.item_type || 'Urun'}</td>
                    <td className="px-4 py-5">{item.transaction_type || '-'}</td>
                    <td className="px-4 py-5">{item.counterparty || '-'}</td>
                    <td className="px-4 py-5">{item.category || '-'}</td>
                    <td className="px-4 py-5">{item.cost_price || '-'}</td>
                    <td className="px-4 py-5">{item.price || '-'}</td>
                    <td className="px-4 py-5">{item.item_type === 'Hizmet' ? '-' : item.stock || '-'}</td>
                    <td className="px-4 py-5">
                      {new Date(item.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onEditProduct(item)
                          }}
                          className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-[#537bb4]"
                        >
                          Duzenle
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenProductHistory(item.product)
                          }}
                          className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-[#537bb4]"
                        >
                          Gecmis
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteProduct(item.id)
                          }}
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
