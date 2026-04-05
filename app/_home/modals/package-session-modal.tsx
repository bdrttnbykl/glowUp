import { staffOptions } from '@/app/_home/constants'
import type { PackageSaleRow, PackageSessionDraft } from '@/app/_home/types'

type PackageSessionModalProps = {
  draft: PackageSessionDraft
  isOpen: boolean
  loading: boolean
  packageSale: PackageSaleRow | null
  onClose: () => void
  onDraftChange: (draft: PackageSessionDraft) => void
  onSubmit: () => void
}

export function PackageSessionModal({
  draft,
  isOpen,
  loading,
  packageSale,
  onClose,
  onDraftChange,
  onSubmit,
}: PackageSessionModalProps) {
  if (!isOpen || !packageSale) {
    return null
  }

  const nextSessionNumber = Math.min(packageSale.used_sessions + 1, packageSale.total_sessions)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Pakete seans ekle</h2>
            <p className="mt-1 text-sm text-slate-500">
              {packageSale.customer} icin {packageSale.package_name} / {packageSale.session_type} /{' '}
              {nextSessionNumber}. seans randevusu olustur.
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
            value={draft.staff}
            onChange={(e) => onDraftChange({ ...draft, staff: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">Hizmet veren sec</option>
            {staffOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            type="time"
            value={draft.time}
            onChange={(e) => onDraftChange({ ...draft, time: e.target.value })}
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
            {loading ? 'Bekle...' : 'Seansi olustur'}
          </button>
        </div>
      </div>
    </div>
  )
}
