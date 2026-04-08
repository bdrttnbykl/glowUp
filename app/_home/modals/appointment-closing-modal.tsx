import type { AppointmentClosingDraft } from '@/app/_home/types'

type AppointmentClosingModalProps = {
  productOptions: Array<{
    availableStock: number
    category: string | null
    defaultPrice: string
    label: string
    stockProductId: number
    value: string
  }>
  draft: AppointmentClosingDraft
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onDraftChange: (draft: AppointmentClosingDraft) => void
  onSubmit: () => void
}

export function AppointmentClosingModal({
  productOptions,
  draft,
  isOpen,
  loading,
  onClose,
  onDraftChange,
  onSubmit,
}: AppointmentClosingModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-3xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Randevu sonucu</h2>
            <p className="mt-1 text-sm text-slate-500">
              Musteri geldi mi, odeme ne kadar ve nasil alindi bilgisini kaydet.
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

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select
            value={draft.attendanceStatus}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                attendanceStatus: e.target.value,
                paymentMethod: e.target.value === 'Gelmedi' ? '' : draft.paymentMethod,
                collectedAmount: e.target.value === 'Gelmedi' ? '' : draft.collectedAmount,
              })
            }
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option>Geldi</option>
            <option>Gelmedi</option>
          </select>
          <select
            disabled={draft.attendanceStatus === 'Gelmedi'}
            value={draft.paymentMethod}
            onChange={(e) => onDraftChange({ ...draft, paymentMethod: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option>Nakit</option>
            <option>Kredi karti</option>
            <option>Havale</option>
            <option>Diger</option>
          </select>
          <input
            disabled={draft.attendanceStatus === 'Gelmedi'}
            value={draft.collectedAmount}
            onChange={(e) => onDraftChange({ ...draft, collectedAmount: e.target.value })}
            placeholder="Alinan odeme"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-[#d8e1ee] bg-[#f8fbff] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
                Urun satisi
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Musteri randevu sirasinda urun de aldiysa buradan ekle. Kayit, randevuyla birlikte
                urun satisina dusulur.
              </p>
            </div>
            <button
              type="button"
              disabled={draft.attendanceStatus === 'Gelmedi'}
                onClick={() =>
                  onDraftChange({
                    ...draft,
                    productSales: [
                      ...draft.productSales,
                      { id: null, product: '', price: '', quantity: '1' },
                    ],
                  })
                }
              className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-[#537bb4] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Urun ekle
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {draft.productSales.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#cfd9e8] bg-white/70 px-4 py-4 text-sm text-slate-400">
                Urun eklenmedi.
              </div>
            ) : (
              draft.productSales.map((item, index) => (
                <div
                  key={`${item.id ?? 'new'}-${index}`}
                  className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_110px_minmax(0,1fr)_96px]"
                >
                  <select
                    disabled={draft.attendanceStatus === 'Gelmedi'}
                    value={item.product}
                    onChange={(event) => {
                      const selectedOption = productOptions.find(
                        (option) => option.value === event.target.value
                      )

                      onDraftChange({
                        ...draft,
                        productSales: draft.productSales.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                product: event.target.value,
                                price: currentItem.price || selectedOption?.defaultPrice || '',
                              }
                            : currentItem
                        ),
                      })
                    }}
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Urun sec</option>
                    {productOptions.map((option) => (
                      <option key={`${option.value}-${option.category || 'no-category'}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    disabled={draft.attendanceStatus === 'Gelmedi'}
                    value={item.quantity}
                    onChange={(event) =>
                      onDraftChange({
                        ...draft,
                        productSales: draft.productSales.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, quantity: event.target.value }
                            : currentItem
                        ),
                      })
                    }
                    placeholder="Adet"
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <input
                    disabled={draft.attendanceStatus === 'Gelmedi'}
                    value={item.price}
                    onChange={(event) =>
                      onDraftChange({
                        ...draft,
                        productSales: draft.productSales.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, price: event.target.value }
                            : currentItem
                        ),
                      })
                    }
                    placeholder="Urun satis tutari"
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    disabled={draft.attendanceStatus === 'Gelmedi'}
                    onClick={() =>
                      onDraftChange({
                        ...draft,
                        productSales: draft.productSales.filter((_, currentIndex) => currentIndex !== index),
                      })
                    }
                    className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Kaldir
                  </button>
                  {item.product && (
                    <div className="md:col-span-4 -mt-1 text-xs text-slate-400">
                      Stok:{' '}
                      {productOptions.find((option) => option.value === item.product)?.availableStock ?? 0}
                    </div>
                  )}
                </div>
              ))
            )}
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
            className="rounded-md bg-slate-900 px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Bekle...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
