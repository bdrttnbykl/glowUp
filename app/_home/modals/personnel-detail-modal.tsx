import type { PersonnelDetailEntry, PersonnelReportRow } from '@/app/_home/types'
import { formatCurrencyValue } from '@/app/_home/utils'

type PersonnelDetailModalProps = {
  entries: readonly PersonnelDetailEntry[]
  isOpen: boolean
  onClose: () => void
  period: string
  staffRow: PersonnelReportRow | null
}

export function PersonnelDetailModal({
  entries,
  isOpen,
  onClose,
  period,
  staffRow,
}: PersonnelDetailModalProps) {
  if (!isOpen || !staffRow) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-5xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {staffRow.staff} islem gecmisi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {period} doneminde hangi musterilere hangi hizmetleri verdigini ve paket
              hareketlerini burada gorebilirsin.
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

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[#d7e0eb] bg-[#f8fbff] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#537bb4]">
              Hizmet adedi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#274a78]">
              {staffRow.completedAppointments}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Hizmet geliri
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">
              {formatCurrencyValue(staffRow.appointmentRevenue)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              Paket satisi
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-700">{staffRow.packageSales}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Toplam tutar
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">
              {formatCurrencyValue(staffRow.totalRevenue)}
            </p>
          </div>
        </div>

        <div className="mt-5 max-h-[58vh] overflow-auto rounded-2xl border border-[#d7e0eb]">
          <table className="w-full min-w-[920px] bg-white text-left">
            <thead className="sticky top-0 border-b border-[#d7e0eb] bg-[#f6f9fd] text-[13px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-4 font-semibold">Tur</th>
                <th className="px-4 py-4 font-semibold">Musteri</th>
                <th className="px-4 py-4 font-semibold">Telefon</th>
                <th className="px-4 py-4 font-semibold">Hareket</th>
                <th className="px-4 py-4 font-semibold">Odeme</th>
                <th className="px-4 py-4 font-semibold">Tarih</th>
                <th className="px-4 py-4 font-semibold text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="text-[15px] text-slate-700">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Secilen donemde bu personele ait detay hareket yok.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={`${entry.kind}-${entry.occurredAt}-${entry.label}-${index}`} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          entry.kind === 'Hizmet'
                            ? 'bg-[#edf4ff] text-[#35588a]'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {entry.kind}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800">{entry.customer}</td>
                    <td className="px-4 py-4">{entry.phone || '-'}</td>
                    <td className="px-4 py-4">{entry.label}</td>
                    <td className="px-4 py-4">{entry.paymentMethod || '-'}</td>
                    <td className="px-4 py-4">
                      {new Date(entry.occurredAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-[#35588a]">
                      {formatCurrencyValue(entry.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
