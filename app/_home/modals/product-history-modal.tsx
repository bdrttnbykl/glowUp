import type { Product } from '@/app/_home/types'
import { formatCurrencyValue, parseCurrencyValue } from '@/app/_home/utils'

type ProductHistoryModalProps = {
  entries: readonly Product[]
  isOpen: boolean
  onClose: () => void
  productName: string | null
}

export function ProductHistoryModal({
  entries,
  isOpen,
  onClose,
  productName,
}: ProductHistoryModalProps) {
  if (!isOpen || !productName) {
    return null
  }

  const purchaseCount = entries.filter((item) => item.transaction_type === 'Alis').length
  const saleCount = entries.filter((item) => item.transaction_type === 'Satis').length
  const appointmentSaleCount = entries.filter(
    (item) => item.transaction_type === 'Satis' && item.appointment_id != null
  ).length
  const latestStockRow = [...entries]
    .filter((item) => item.item_type === 'Urun' && (item.stock || '').trim())
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0]
  const currentStock = latestStockRow?.stock || '0'
  const totalPurchaseAmount = entries
    .filter((item) => item.transaction_type === 'Alis')
    .reduce((sum, item) => sum + parseCurrencyValue(item.cost_price || item.price), 0)
  const totalSaleAmount = entries
    .filter((item) => item.transaction_type === 'Satis')
    .reduce((sum, item) => sum + parseCurrencyValue(item.price), 0)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-6xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">{productName} hareketleri</h2>
            <p className="mt-1 text-sm text-slate-500">
              Bu urun veya hizmet icin olusan tum alis, satis ve randevu satis hareketleri.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-500"
          >
            Kapat
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-[#d7e0eb] bg-[#f8fbff] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
              Mevcut stok
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#274a78]">{currentStock}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Alis kaydi
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{purchaseCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Satis kaydi
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{saleCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              Toplam alis
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-700">
              {formatCurrencyValue(totalPurchaseAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7e0eb] bg-[#f8fbff] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
              Randevu satisi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#274a78]">{appointmentSaleCount}</p>
          </div>
        </div>

        <div className="mt-5 max-h-[58vh] overflow-auto rounded-2xl border border-[#d7e0eb]">
          <table className="w-full min-w-[1100px] bg-white text-left">
            <thead className="sticky top-0 border-b border-[#e4ebf3] bg-[#f6f9fd] text-[13px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-4 font-semibold">Kart tipi</th>
                <th className="px-4 py-4 font-semibold">Islem</th>
                <th className="px-4 py-4 font-semibold">Kanal</th>
                <th className="px-4 py-4 font-semibold">Kisi</th>
                <th className="px-4 py-4 font-semibold">Kategori</th>
                <th className="px-4 py-4 font-semibold">Adet</th>
                <th className="px-4 py-4 font-semibold">Tutar</th>
                <th className="px-4 py-4 font-semibold">Stok</th>
                <th className="px-4 py-4 font-semibold">Olusturulma</th>
              </tr>
            </thead>
            <tbody className="text-[15px] text-slate-700">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Bu urun icin hareket kaydi yok.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">{item.item_type || '-'}</td>
                    <td className="px-4 py-4">{item.transaction_type || '-'}</td>
                    <td className="px-4 py-4">
                      {item.appointment_id != null ? (
                        <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#35588a]">
                          Randevu satisi
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Manuel
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">{item.counterparty || '-'}</td>
                    <td className="px-4 py-4">{item.category || '-'}</td>
                    <td className="px-4 py-4">{item.quantity || '-'}</td>
                    <td className="px-4 py-4 font-medium text-[#35588a]">
                      {item.transaction_type === 'Alis'
                        ? item.cost_price || item.price || '-'
                        : item.price || '-'}
                    </td>
                    <td className="px-4 py-4">{item.item_type === 'Hizmet' ? '-' : item.stock || '-'}</td>
                    <td className="px-4 py-4">
                      {new Date(item.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right text-sm font-medium text-slate-500">
          Toplam satis: {formatCurrencyValue(totalSaleAmount)}
        </div>
      </div>
    </div>
  )
}
