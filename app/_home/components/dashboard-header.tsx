import { quickActionItems } from '@/app/_home/constants'
import { SidebarIcon } from '@/app/_home/sidebar-icon'

type DashboardHeaderProps = {
  isQuickActionsOpen: boolean
  brandName: string
  businessName: string
  onOpenAppointmentModal: () => void
  onOpenAccountSettings: () => void
  onOpenCustomerModal: () => void
  onOpenPackageSaleModal: () => void
  onOpenProductModal: () => void
  onPlaceholderAction: (label: string) => void
  onQuickActionSectionSelect: (section: string) => void
  onToggleQuickActions: () => void
  userEmail: string
}

export function DashboardHeader({
  isQuickActionsOpen,
  brandName,
  businessName,
  onOpenAppointmentModal,
  onOpenAccountSettings,
  onOpenCustomerModal,
  onOpenPackageSaleModal,
  onOpenProductModal,
  onPlaceholderAction,
  onQuickActionSectionSelect,
  onToggleQuickActions,
  userEmail,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-[#d8e1ea] bg-white">
      <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4b7c2] text-sm font-semibold text-white">
            {(brandName || userEmail).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[19px] font-semibold text-[#2b3d52]">{brandName}</p>
            <p className="mt-1 text-sm text-slate-500">{businessName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleQuickActions}
            className="rounded-md border border-[#d8e1ea] bg-white px-4 py-2 text-sm font-semibold text-[#5b6f85] shadow-sm transition hover:bg-[#f7fafd]"
            aria-expanded={isQuickActionsOpen}
            aria-haspopup="menu"
          >
            Ekle
          </button>
          <button
            type="button"
            onClick={() => onPlaceholderAction('Teklif')}
            className="rounded-md border border-[#d8e1ea] bg-white px-4 py-2 text-sm font-semibold text-[#5b6f85] shadow-sm transition hover:bg-[#f7fafd]"
          >
            Teklif
          </button>
          <button
            type="button"
            onClick={onOpenAppointmentModal}
            className="rounded-md border border-[#3f8ac8] bg-[#3f8ac8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f76b3]"
          >
            Randevu
          </button>
          <button
            type="button"
            onClick={onOpenAccountSettings}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#d8e1ea] bg-white text-[#5b6f85] shadow-sm transition hover:bg-[#f7fafd]"
            title="Hesap ayarlari"
          >
            <SidebarIcon name="more" />
          </button>
        </div>
      </div>

      <div className="border-t border-[#edf2f7] bg-[#fbfdff] px-6 py-3">
        <div className="relative flex flex-wrap items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => onQuickActionSectionSelect('Randevular')}
            className="border-b-3 border-[#3f8ac8] pb-2 font-semibold text-[#3f8ac8]"
          >
            Randevular
          </button>
          <button
            type="button"
            onClick={() => onQuickActionSectionSelect('Randevu takvimi')}
            className="pb-2 font-medium text-slate-500 transition hover:text-[#3f8ac8]"
          >
            Takvim
          </button>
          <button
            type="button"
            onClick={() => onQuickActionSectionSelect('Paket satislari')}
            className="pb-2 font-medium text-slate-500 transition hover:text-[#3f8ac8]"
          >
            Paket ve satis
          </button>

          {isQuickActionsOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[314px] overflow-hidden rounded-xl border border-[#d8e1ea] bg-white shadow-[0_18px_35px_rgba(28,74,69,0.12)]">
              <div className="h-[4px] w-20 bg-[#3f8ac8]" />
              <div className="py-1">
                {quickActionItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.label === 'Yeni randevu') {
                        onOpenAppointmentModal()
                        return
                      }

                      if (item.label === 'Yeni musteri') {
                        onOpenCustomerModal()
                        return
                      }

                      if (item.label === 'Yeni urun / hizmet ekle') {
                        onOpenProductModal()
                        return
                      }

                      if (item.label === 'Yeni paket satisi') {
                        onOpenPackageSaleModal()
                        return
                      }

                      if (item.section) {
                        onQuickActionSectionSelect(item.section)
                        return
                      }

                      onPlaceholderAction(item.label)
                    }}
                    className="flex w-full items-center justify-between px-4 py-4 text-left text-[15px] text-[#536866] transition hover:bg-[#f7fafd]"
                  >
                    <span>{item.label}</span>
                    <span className="text-[#3f8ac8]">
                      <SidebarIcon name={item.icon} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
