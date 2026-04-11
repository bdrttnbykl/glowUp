import type { MergedCustomer, MessageChannel } from '@/app/_home/types'

type MessageModalProps = {
  body: string
  channel: MessageChannel
  isOpen: boolean
  loading: boolean
  onBodyChange: (value: string) => void
  onChannelChange: (value: MessageChannel) => void
  onClose: () => void
  onSubmit: () => void
  onSubjectChange: (value: string) => void
  recipient: MergedCustomer | null
  subject: string
}

export function MessageModal({
  body,
  channel,
  isOpen,
  loading,
  onBodyChange,
  onChannelChange,
  onClose,
  onSubmit,
  onSubjectChange,
  recipient,
  subject,
}: MessageModalProps) {
  if (!isOpen || !recipient) {
    return null
  }

  const hasPhone = !!recipient.phone?.trim()
  const hasEmail = !!recipient.email?.trim()

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Mesaj gonder</h2>
            <p className="mt-1 text-sm text-slate-500">
              {recipient.customer} icin SMS veya e-posta gonder.
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

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Kanal
            </p>
            <select
              value={channel}
              onChange={(event) => onChannelChange(event.target.value as MessageChannel)}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
            >
              {hasPhone ? <option value="sms">SMS</option> : null}
              {hasEmail ? <option value="email">Email</option> : null}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Alici
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {channel === 'sms' ? recipient.phone || 'Telefon yok' : recipient.email || 'Email yok'}
            </div>
          </div>
        </div>

        {channel === 'email' ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Konu
            </p>
            <input
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              placeholder="Email konusu"
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
            Mesaj
          </p>
          <textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            rows={7}
            placeholder="Mesajini yaz"
            className="w-full resize-none rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        {!hasPhone && !hasEmail ? (
          <p className="mt-4 text-sm text-rose-500">
            Bu musteride mesaj gonderilecek telefon veya email bilgisi yok.
          </p>
        ) : null}

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
            disabled={loading || (!hasPhone && !hasEmail)}
            className="rounded-md bg-[#1f2937] px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Gonderiliyor...' : 'Mesaji gonder'}
          </button>
        </div>
      </div>
    </div>
  )
}
