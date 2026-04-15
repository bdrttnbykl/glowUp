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
    <header className="border-b border-[#d7e8e3] bg-[linear-gradient(135deg,#fffefb_0%,#f1faf8_52%,#e7f5f2_100%)] px-4 py-5 shadow-[0_10px_22px_rgba(28,74,69,0.06)] md:px-8">
      <div className="relative flex flex-col gap-4 xl:min-h-[72px] xl:justify-center">
        <div className="flex flex-wrap items-center justify-start gap-4 xl:absolute xl:left-1/2 xl:top-1/2 xl:w-max xl:-translate-x-1/2 xl:-translate-y-1/2 xl:justify-center">
          <div className="flex items-center rounded-xl bg-[linear-gradient(135deg,#ffffff_0%,#f3fbf9_100%)] px-4 py-3 text-[#15928a] shadow-sm">
            <SidebarIcon name="calendar" />
          </div>
          <div className="flex min-w-[320px] items-center rounded-xl bg-[linear-gradient(135deg,#ffffff_0%,#f5fcfa_100%)] px-4 py-3 shadow-sm xl:min-w-[380px]">
            <input
              placeholder="Musteri arama..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span className="ml-3 text-[#93b9b4]">Ara</span>
          </div>
          <div className="relative flex items-center gap-5 text-[#5b706c]">
            <button
              type="button"
              onClick={() => onPlaceholderAction('Bildirim')}
              className="text-sm font-medium transition hover:text-[#154c57]"
            >
              Bildirim
            </button>
            <button
              type="button"
              onClick={onToggleQuickActions}
              className="text-2xl leading-none text-[#15928a] transition hover:text-[#154c57]"
              aria-expanded={isQuickActionsOpen}
              aria-haspopup="menu"
            >
              +
            </button>
            <button
              type="button"
              onClick={onOpenAccountSettings}
              className="text-sm font-medium transition hover:text-[#154c57]"
            >
              Ayar
            </button>

            {isQuickActionsOpen && (
              <div className="absolute left-10 top-[calc(100%+18px)] z-30 w-[314px] overflow-hidden rounded-2xl border border-[#dceae5] bg-[linear-gradient(180deg,#ffffff_0%,#f5fcfa_100%)] shadow-[0_18px_35px_rgba(28,74,69,0.12)]">
                <div className="h-[6px] w-16 bg-[linear-gradient(90deg,#15928a_0%,#ff8c66_100%)]" />
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
                      className="flex w-full items-center justify-between px-4 py-4 text-left text-[17px] text-[#536866] transition hover:bg-white/70"
                    >
                      <span>{item.label}</span>
                      <span className="text-[#15928a]">
                        <SidebarIcon name={item.icon} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 xl:ml-auto xl:justify-end">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#15928a_0%,#46c4b4_100%)] text-white shadow-[0_10px_22px_rgba(21,146,138,0.2)]">
            {(brandName || userEmail).slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#154c57]">{brandName}</p>
            <p className="text-sm text-[#7f9692]">{businessName}</p>
            <button
              type="button"
              onClick={onOpenAccountSettings}
              className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[#15928a] transition hover:text-[#154c57]"
            >
              Hesap ayarlari
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
