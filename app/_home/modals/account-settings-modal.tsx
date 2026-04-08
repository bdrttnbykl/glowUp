type AccountSettingsModalProps = {
  brandName: string
  businessName: string
  email: string
  isOpen: boolean
  loading: boolean
  onBrandNameChange: (value: string) => void
  onBusinessNameChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export function AccountSettingsModal({
  brandName,
  businessName,
  email,
  isOpen,
  loading,
  onBrandNameChange,
  onBusinessNameChange,
  onClose,
  onSubmit,
}: AccountSettingsModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="w-full max-w-xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Hesap ayarlari</h2>
            <p className="mt-1 text-sm text-slate-500">
              Profil kartinda gorunen marka ve isletme bilgilerini guncelle.
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
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Marka adi
            </span>
            <input
              value={brandName}
              onChange={(event) => onBrandNameChange(event.target.value)}
              placeholder="glowUp"
              className="w-full rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-base text-slate-700 outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              Isletme adi
            </span>
            <input
              value={businessName}
              onChange={(event) => onBusinessNameChange(event.target.value)}
              placeholder="Pera Beauty House"
              className="w-full rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-base text-slate-700 outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
              E-posta
            </span>
            <input
              value={email}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-base text-slate-500 outline-none"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-5 py-3 text-slate-600"
          >
            Iptal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
