type AccountSettingsModalProps = {
  brandName: string
  businessName: string
  email: string
  isOpen: boolean
  isCreatingStaff: boolean
  isStaffCreatePanelOpen: boolean
  deletingStaffId: number | null
  editingStaffMemberId: number | null
  loading: boolean
  onBrandNameChange: (value: string) => void
  onBusinessNameChange: (value: string) => void
  onCancelStaffEdit: () => void
  onClose: () => void
  onEditStaff: (staffId: number) => void
  onRemoveStaff: (staffId: number) => void
  onSaveStaff: () => void
  onStaffServiceToggle: (serviceLabel: string) => void
  onToggleStaffCreatePanel: () => void
  onStaffDraftChange: (value: string) => void
  onSubmit: () => void
  serviceOptions: readonly string[]
  staffDraft: string
  staffMembers: readonly { id: number; name: string; services: readonly string[] }[]
  staffServiceDraft: readonly string[]
}

export function AccountSettingsModal({
  brandName,
  businessName,
  email,
  isOpen,
  isCreatingStaff,
  isStaffCreatePanelOpen,
  deletingStaffId,
  editingStaffMemberId,
  loading,
  onBrandNameChange,
  onBusinessNameChange,
  onCancelStaffEdit,
  onClose,
  onEditStaff,
  onRemoveStaff,
  onSaveStaff,
  onStaffServiceToggle,
  onToggleStaffCreatePanel,
  onStaffDraftChange,
  onSubmit,
  serviceOptions,
  staffDraft,
  staffMembers,
  staffServiceDraft,
}: AccountSettingsModalProps) {
  if (!isOpen) {
    return null
  }

  const isEditingStaff = editingStaffMemberId !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 pb-4 pt-6">
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

        <div className="overflow-y-auto px-6 py-5">
          <div className="space-y-4">
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

          <div className="rounded-3xl border border-[#d7e8e3] bg-[#f6fbfa] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15928a]">
                  Personel yonetimi
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Personel ekle, hizmet ata veya aktif listeden cikar.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleStaffCreatePanel}
                className="rounded-2xl bg-[#15928a] px-5 py-3 text-sm font-medium text-white"
              >
                {isStaffCreatePanelOpen ? 'Paneli kapat' : 'Personel ekle'}
              </button>
            </div>

            {isStaffCreatePanelOpen ? (
              <div className="mt-4 space-y-4 border-t border-[#d7e8e3] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15928a]">
                      {isEditingStaff ? 'Personeli duzenle' : 'Yeni personel'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {isEditingStaff
                        ? 'Adi ve verdigi hizmetleri guncelle.'
                        : 'Yeni personel ve hizmetlerini ekle.'}
                    </p>
                  </div>
                  {isEditingStaff ? (
                    <button
                      type="button"
                      onClick={onCancelStaffEdit}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-500"
                    >
                      Duzenlemeyi iptal et
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <label className="block flex-1 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15928a]">
                      Personel adi
                    </span>
                    <input
                      value={staffDraft}
                      onChange={(event) => onStaffDraftChange(event.target.value)}
                      placeholder="Yeni personel adi"
                      className="w-full rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-base text-slate-700 outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={onSaveStaff}
                    disabled={isCreatingStaff}
                    className="rounded-2xl bg-[#15928a] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {isCreatingStaff
                      ? isEditingStaff
                        ? 'Guncelleniyor...'
                        : 'Ekleniyor...'
                      : isEditingStaff
                        ? 'Guncelle'
                        : 'Kaydet'}
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15928a]">
                    Verdigi hizmetler
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {serviceOptions.map((serviceLabel) => {
                      const checked = staffServiceDraft.includes(serviceLabel)

                      return (
                        <label
                          key={serviceLabel}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                            checked
                              ? 'border-[#15928a] bg-[#effaf8] text-[#14726d]'
                              : 'border-[#d7e8e3] bg-white text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onStaffServiceToggle(serviceLabel)}
                            className="h-4 w-4 accent-[#15928a]"
                          />
                          <span>{serviceLabel}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15928a]">
                Aktif personeller
              </p>
              {staffMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d7e8e3] bg-white px-4 py-4 text-sm text-slate-500">
                  Henuz aktif personel eklenmedi.
                </div>
              ) : (
                <div className="space-y-2">
                  {staffMembers.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="rounded-2xl border border-[#d7e8e3] bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-700">{staffMember.name}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {staffMember.services.length === 0 ? (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                                Hizmet secilmedi
                              </span>
                            ) : (
                              staffMember.services.map((serviceLabel) => (
                                <span
                                  key={`${staffMember.id}-${serviceLabel}`}
                                  className="rounded-full bg-[#effaf8] px-3 py-1 text-xs font-medium text-[#14726d]"
                                >
                                  {serviceLabel}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditStaff(staffMember.id)}
                            className="rounded-xl border border-[#b8ddd9] bg-[#effaf8] px-3 py-2 text-sm font-medium text-[#14726d]"
                          >
                            Duzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveStaff(staffMember.id)}
                            disabled={deletingStaffId === staffMember.id}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-50"
                          >
                            {deletingStaffId === staffMember.id ? 'Siliniyor...' : 'Cikar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
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
