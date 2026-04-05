import type { ProductDraft } from '@/app/_home/types'

type ProductModalProps = {
  draft: ProductDraft
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onDraftChange: (draft: ProductDraft) => void
  onSubmit: () => void
}

export function ProductModal({
  draft,
  isOpen,
  loading,
  onClose,
  onDraftChange,
  onSubmit,
}: ProductModalProps) {
  if (!isOpen) {
    return null
  }

  const isSale = draft.transactionType === 'Satis'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-3xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Yeni urun / hizmet ekle</h2>
            <p className="mt-1 text-sm text-slate-500">
              Urun veya hizmet kartini olusturup satis ve takip akisinda kullan.
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

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            value={draft.product ?? ''}
            onChange={(e) => onDraftChange({ ...draft, product: e.target.value })}
            placeholder="Urun adi"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <select
            value={draft.transactionType ?? 'Alis'}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                transactionType: e.target.value,
                counterparty: '',
                costPrice: e.target.value === 'Satis' ? '' : draft.costPrice,
                price: e.target.value === 'Alis' ? '' : draft.price,
              })
            }
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option>Alis</option>
            <option>Satis</option>
          </select>
          <input
            value={draft.category ?? ''}
            onChange={(e) => onDraftChange({ ...draft, category: e.target.value })}
            placeholder="Kategori"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={draft.stock ?? ''}
            onChange={(e) => onDraftChange({ ...draft, stock: e.target.value })}
            placeholder="Stok miktari"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={draft.counterparty ?? ''}
            onChange={(e) => onDraftChange({ ...draft, counterparty: e.target.value })}
            placeholder={isSale ? 'Urunu alan kisi' : 'Urunu temin eden kisi'}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={isSale ? draft.price ?? '' : draft.costPrice ?? ''}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                price: isSale ? e.target.value : draft.price,
                costPrice: isSale ? draft.costPrice : e.target.value,
              })
            }
            placeholder={isSale ? 'Satis fiyati' : 'Alis fiyati'}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-5 py-3 text-slate-600"
          >
            Iptal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-md bg-[#34b24a] px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Bekle...' : 'Urunu kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
