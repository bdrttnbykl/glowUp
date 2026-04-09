import { quickActionItems } from '@/app/_home/constants'
import { SidebarIcon } from '@/app/_home/sidebar-icon'

type DashboardHeaderProps = {
  isQuickActionsOpen: boolean
  brandName: string
  businessName: string
  isDrawerMode: boolean
  onOpenAppointmentModal: () => void
  onOpenAccountSettings: () => void
  onOpenCustomerModal: () => void
  onOpenPackageSaleModal: () => void
  onOpenProductModal: () => void
  onPlaceholderAction: (label: string) => void
  onQuickActionSectionSelect: (section: string) => void
  onToggleSidebar: () => void
  onToggleQuickActions: () => void
  userEmail: string
}

export function DashboardHeader({
  isQuickActionsOpen,
  brandName,
  businessName,
  isDrawerMode,
  onOpenAppointmentModal,
  onOpenAccountSettings,
  onOpenCustomerModal,
  onOpenPackageSaleModal,
  onOpenProductModal,
  onPlaceholderAction,
  onQuickActionSectionSelect,
  onToggleSidebar,
  onToggleQuickActions,
  userEmail,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-300/80 bg-[#eef2f8] px-4 py-5 shadow-[0_8px_24px_rgba(33,45,78,0.07)] md:px-8">
      <div className="relative flex flex-col gap-4 xl:min-h-[72px] xl:justify-center">
        {isDrawerMode && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-400"
              aria-label="Sidebari ac"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>

            <div className="text-right">
              <p className="text-[15px] font-semibold text-slate-700">{brandName}</p>
              <p className="text-xs text-slate-400">{businessName}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-start gap-4 xl:absolute xl:left-1/2 xl:top-1/2 xl:w-max xl:-translate-x-1/2 xl:-translate-y-1/2 xl:justify-center">
          <div className="hidden items-center rounded-xl bg-white px-4 py-3 text-slate-500 shadow-sm sm:flex">
            <SidebarIcon name="calendar" />
          </div>
          <div className="flex min-w-0 flex-1 items-center rounded-xl bg-white px-4 py-3 shadow-sm sm:min-w-[320px] xl:min-w-[380px]">
            <input
              placeholder="Musteri arama..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span className="ml-3 text-slate-300">Ara</span>
          </div>
          <div className="relative flex w-full items-center justify-end gap-5 text-slate-500 sm:w-auto">
            <button
              type="button"
              onClick={() => onPlaceholderAction('Bildirim')}
              className="text-sm font-medium transition hover:text-slate-700"
            >
              Bildirim
            </button>
            <button
              type="button"
              onClick={onToggleQuickActions}
              className="text-2xl leading-none text-slate-500 transition hover:text-slate-700"
              aria-expanded={isQuickActionsOpen}
              aria-haspopup="menu"
            >
              +
            </button>
            <button
              type="button"
              onClick={onOpenAccountSettings}
              className="text-sm font-medium transition hover:text-slate-700"
            >
              Ayar
            </button>

            {isQuickActionsOpen && (
              <div className="absolute left-10 top-[calc(100%+18px)] z-30 w-[314px] overflow-hidden rounded-sm border border-slate-300 bg-white shadow-[0_18px_35px_rgba(15,23,42,0.22)]">
                <div className="h-[6px] w-16 bg-[#6f93c1]" />
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
                      className="flex w-full items-center justify-between px-4 py-4 text-left text-[17px] text-slate-600 transition hover:bg-slate-50"
                    >
                      <span>{item.label}</span>
                      <span className="text-slate-500">
                        <SidebarIcon name={item.icon} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {!isDrawerMode && (
          <div className="flex items-center justify-center gap-3 xl:ml-auto xl:justify-end">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white">
              {(brandName || userEmail).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-700">{brandName}</p>
              <p className="text-sm text-slate-400">{businessName}</p>
              <button
                type="button"
                onClick={onOpenAccountSettings}
                className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[#537bb4] transition hover:text-slate-700"
              >
                Hesap ayarlari
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
