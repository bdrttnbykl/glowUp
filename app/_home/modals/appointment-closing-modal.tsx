import type { AppointmentClosingDraft } from '@/app/_home/types'

type AppointmentClosingModalProps = {
  draft: AppointmentClosingDraft
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onDraftChange: (draft: AppointmentClosingDraft) => void
  onSubmit: () => void
}

export function AppointmentClosingModal({
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
      <div className="w-full max-w-2xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
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
