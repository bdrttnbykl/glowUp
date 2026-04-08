import type { ProductDraft } from '@/app/_home/types'

type ProductModalProps = {
  draft: ProductDraft
  isEditing?: boolean
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onDraftChange: (draft: ProductDraft) => void
  onSubmit: () => void
}

export function ProductModal({
  draft,
  isEditing = false,
  isOpen,
  loading,
  onClose,
  onDraftChange,
  onSubmit,
}: ProductModalProps) {
  if (!isOpen) {
    return null
  }

  const isService = draft.itemType === 'Hizmet'
  const isSale = draft.transactionType === 'Satis'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-3xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {isEditing ? 'Urun / hizmet duzenle' : 'Yeni urun / hizmet ekle'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? 'Kaydin alanlarini guncelleyip alis, satis ve stok akislarini duzeltebilirsin.'
                : 'Urun veya hizmet kartini olusturup alis, satis ve takip akisinda kullan.'}
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

        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.1fr_1.4fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Kart tipi
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(['Urun', 'Hizmet'] as const).map((itemType) => (
                  <button
                    key={itemType}
                    type="button"
                    onClick={() =>
                      onDraftChange({
                        ...draft,
                        itemType,
                        transactionType: draft.transactionType || 'Alis',
                        counterparty: '',
                        quantity: itemType === 'Hizmet' ? '' : draft.quantity,
                        stock: itemType === 'Hizmet' ? '' : draft.stock,
                      })
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      draft.itemType === itemType
                        ? 'bg-[#537bb4] text-white'
                        : 'border border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    {itemType}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#d7e0eb] bg-[#f8fbff] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
                {isService ? 'Hizmet akisi' : 'Urun akisi'}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isService
                  ? 'Hizmet kartinda stok tutulmaz. Alis secersen sirketin disaridan aldigi hizmetleri, satis secersen musterine sundugun hizmetleri kaydedebilirsin.'
                  : 'Urun kartinda alis veya satis tipine gore stok, kisi ve fiyat alanlari kullanilir.'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <input
                value={draft.product ?? ''}
                onChange={(e) => onDraftChange({ ...draft, product: e.target.value })}
                placeholder={isService ? 'Hizmet adi' : 'Urun adi'}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              />

              <input
                value={draft.category ?? ''}
                onChange={(e) => onDraftChange({ ...draft, category: e.target.value })}
                placeholder={isService ? 'Hizmet grubu' : 'Kategori'}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              />

              <input
                value={draft.counterparty ?? ''}
                onChange={(e) => onDraftChange({ ...draft, counterparty: e.target.value })}
                placeholder={
                  isService
                    ? isSale
                      ? 'Hizmeti alan kisi'
                      : 'Hizmeti saglayan kisi'
                    : isSale
                      ? 'Urunu alan kisi'
                      : 'Urunu temin eden kisi'
                }
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="space-y-3">
              <select
                value={draft.transactionType ?? 'Alis'}
                onChange={(e) =>
                  onDraftChange({
                    ...draft,
                    transactionType: e.target.value,
                    counterparty: '',
                    costPrice: e.target.value === 'Satis' ? '' : draft.costPrice,
                    price: e.target.value === 'Alis' ? '' : draft.price,
                    quantity: e.target.value === 'Satis' ? draft.quantity || '1' : '',
                  })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option>Alis</option>
                <option>Satis</option>
              </select>

              {isService ? (
                <div className="flex min-h-[50px] items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  Hizmet kartinda stok takibi yok
                </div>
              ) : (
                <input
                  value={draft.stock ?? ''}
                  onChange={(e) => onDraftChange({ ...draft, stock: e.target.value })}
                  placeholder="Stok miktari"
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                />
              )}

              {isService ? (
                <input
                  value={isSale ? draft.price ?? '' : draft.costPrice ?? ''}
                  onChange={(e) =>
                    onDraftChange({
                      ...draft,
                      price: isSale ? e.target.value : '',
                      costPrice: isSale ? '' : e.target.value,
                    })
                  }
                  placeholder={isSale ? 'Hizmet satis fiyati' : 'Hizmet alis maliyeti'}
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                />
              ) : isSale ? (
                <div className="grid gap-3 md:grid-cols-[140px_1fr]">
                  <input
                    value={draft.quantity ?? ''}
                    onChange={(e) => onDraftChange({ ...draft, quantity: e.target.value })}
                    placeholder="Adet"
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={draft.price ?? ''}
                    onChange={(e) => onDraftChange({ ...draft, price: e.target.value })}
                    placeholder="Satis fiyati"
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>
              ) : (
                <input
                  value={draft.costPrice ?? ''}
                  onChange={(e) => onDraftChange({ ...draft, costPrice: e.target.value })}
                  placeholder="Alis fiyati"
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                />
              )}
            </div>
          </div>
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
            {loading ? 'Bekle...' : isEditing ? 'Guncelle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
