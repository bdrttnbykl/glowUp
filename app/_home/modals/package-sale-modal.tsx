import { packageSessionTypeOptions, staffOptions } from '@/app/_home/constants'
import type { PackageSaleDraft } from '@/app/_home/types'

type PackageSaleModalProps = {
  draft: PackageSaleDraft
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onDraftChange: (draft: PackageSaleDraft) => void
  onSubmit: () => void
}

export function PackageSaleModal({
  draft,
  isOpen,
  loading,
  onClose,
  onDraftChange,
  onSubmit,
}: PackageSaleModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-4xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Yeni paket satisi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Paket kaydini olustur, ilk seans randevusunu bagla ve kalan seanslari takip et.
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
            value={draft.customer}
            onChange={(e) => onDraftChange({ ...draft, customer: e.target.value })}
            placeholder="Musteri adi"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={draft.phone}
            onChange={(e) => onDraftChange({ ...draft, phone: e.target.value })}
            placeholder="Telefon numarasi"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={draft.packageName}
            onChange={(e) => onDraftChange({ ...draft, packageName: e.target.value })}
            placeholder="Paket adi"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <select
            value={draft.sessionType}
            onChange={(e) => onDraftChange({ ...draft, sessionType: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            {packageSessionTypeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <input
            value={draft.totalSessions}
            onChange={(e) => onDraftChange({ ...draft, totalSessions: e.target.value })}
            placeholder="Toplam seans"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={draft.price}
            onChange={(e) => onDraftChange({ ...draft, price: e.target.value })}
            placeholder="Paket fiyati"
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <select
            value={draft.staff}
            onChange={(e) => onDraftChange({ ...draft, staff: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">Ilk seans hizmet vereni</option>
            {staffOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Paket satislari odeme tipi otomatik olarak `Nakit` kaydedilir.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={draft.firstSessionDate}
              onChange={(e) => onDraftChange({ ...draft, firstSessionDate: e.target.value })}
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
            />
            <input
              type="time"
              value={draft.firstSessionTime}
              onChange={(e) => onDraftChange({ ...draft, firstSessionTime: e.target.value })}
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
            />
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
            {loading ? 'Bekle...' : 'Paketi kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
