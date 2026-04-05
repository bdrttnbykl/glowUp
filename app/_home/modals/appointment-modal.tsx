import { serviceOptions, staffOptions } from '@/app/_home/constants'
import type { AppointmentDraft } from '@/app/_home/types'
import { getTodayDateInputValue, normalizePhoneInput } from '@/app/_home/utils'

type AppointmentModalProps = {
  draft: AppointmentDraft
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onDraftChange: (draft: AppointmentDraft) => void
  onSubmit: () => void
}

export function AppointmentModal({
  draft,
  isOpen,
  loading,
  onClose,
  onDraftChange,
  onSubmit,
}: AppointmentModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-4xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Yeni randevu</h2>
            <p className="mt-1 text-sm text-slate-500">
              Musteri ve hizmet bilgilerini girip randevu olustur.
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

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
          <select
            value={draft.service}
            onChange={(e) => {
              const selectedService = serviceOptions.find(
                (service) => service.label === e.target.value
              )

              onDraftChange({
                ...draft,
                service: e.target.value,
                totalPrice: selectedService?.price || '',
              })
            }}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">Hizmet sec</option>
            {serviceOptions.map((service) => (
              <option key={service.label} value={service.label}>
                {service.label}
              </option>
            ))}
          </select>
          <select
            value={draft.staff}
            onChange={(e) => onDraftChange({ ...draft, staff: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">Hizmet veren sec</option>
            {staffOptions.map((staff) => (
              <option key={staff} value={staff}>
                {staff}
              </option>
            ))}
          </select>
          <input
            type="date"
            min={getTodayDateInputValue()}
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
          <select
            value={draft.status}
            onChange={(e) => onDraftChange({ ...draft, status: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option>Taslak</option>
            <option>Onayli</option>
            <option>Beklemede</option>
            <option>Tamamlandi</option>
          </select>
          <input
            readOnly
            tabIndex={-1}
            value={draft.totalPrice}
            placeholder="Toplam hizmet fiyati"
            className="rounded-md border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
          />
          <input
            value={draft.creator}
            onChange={(e) => onDraftChange({ ...draft, creator: e.target.value })}
            placeholder="Olusturan"
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
            {loading ? 'Bekle...' : 'Randevu olustur'}
          </button>
        </div>
      </div>
    </div>
  )
}
