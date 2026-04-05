import type { CustomerDraft } from '@/app/_home/types'
import { normalizePhoneInput } from '@/app/_home/utils'

type CustomerModalProps = {
  draft: CustomerDraft
  isEditing?: boolean
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onDraftChange: (draft: CustomerDraft) => void
  onSubmit: () => void
}

export function CustomerModal({
  draft,
  isEditing = false,
  isOpen,
  loading,
  onClose,
  onDraftChange,
  onSubmit,
}: CustomerModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {isEditing ? 'Musteriyi duzenle' : 'Yeni musteri'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? 'Manuel kaydedilmis musteri kartini guncelle.'
                : 'Elle eklenen musteriler listede randevu musterileriyle birlikte gorunur.'}
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
          <input
            value={draft.customer}
            onChange={(e) => onDraftChange({ ...draft, customer: e.target.value })}
            placeholder="Musteri"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            inputMode="tel"
            maxLength={10}
            pattern="^\\d{0,10}$"
            value={draft.phone}
            onChange={(e) =>
              onDraftChange({ ...draft, phone: normalizePhoneInput(e.target.value) })
            }
            placeholder="Telefon numarasi"
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
            {loading ? 'Bekle...' : isEditing ? 'Degisiklikleri kaydet' : 'Musteri olustur'}
          </button>
        </div>
      </div>
    </div>
  )
}
