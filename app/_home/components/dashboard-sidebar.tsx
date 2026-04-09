import Image from 'next/image'

import { reportSidebarItems, sidebarItems } from '@/app/_home/constants'
import { SidebarIcon } from '@/app/_home/sidebar-icon'
import salonAppyLogo from '@/img/glowup-wordmark-transparent-v2.png'

type DashboardSidebarProps = {
  activeSection: string
  isOpen: boolean
  isReportMenuOpen: boolean
  loading: boolean
  onClose: () => void
  onLogout: () => void
  onSelectReportSection: (section: string) => void
  onSelectSection: (section: string) => void
  onToggleReportMenu: () => void
}

export function DashboardSidebar({
  activeSection,
  isOpen,
  isReportMenuOpen,
  loading,
  onClose,
  onLogout,
  onSelectReportSection,
  onSelectSection,
  onToggleReportMenu,
}: DashboardSidebarProps) {
  const handleSectionSelect = (section: string) => {
    onSelectSection(section)
    onClose()
  }

  const handleReportSectionSelect = (section: string) => {
    onSelectReportSection(section)
    onClose()
  }

  const handleLogoutClick = () => {
    onClose()
    onLogout()
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Sidebari kapat"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-[300px] flex-col overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#474958_0%,#4f4754_28%,#8b5e4b_68%,#3c2f2d_100%)] text-white shadow-[0_28px_60px_rgba(15,23,42,0.34)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:z-30 lg:translate-x-0 lg:shadow-none`}
      >
        <div className="relative min-h-0 flex-1 px-3 py-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#f0a36c33_0%,transparent_40%),linear-gradient(180deg,transparent_0%,rgba(26,18,20,0.22)_100%)]" />

          <div className="relative flex h-full min-h-0 flex-col items-center">
            <div className="mb-8 flex w-full items-center justify-between gap-3 overflow-hidden px-1">
              <div className="flex h-12 w-[146px] shrink-0 items-center justify-center">
                <Image
                  src={salonAppyLogo}
                  alt="glowup logo"
                  className="h-auto w-[132px] object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.25)]"
                  priority
                />
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm text-white/80 transition hover:bg-white/15 lg:hidden"
              >
                X
              </button>
            </div>

            <nav className="flex min-h-0 w-full flex-1 flex-col gap-4 pr-1">
              {sidebarItems.map((item) => {
                const active = item.label === activeSection
                const isReportsItem = item.label === 'Raporlar'

                if (isReportsItem) {
                  return (
                    <div
                      key={item.label}
                      className="overflow-hidden rounded-2xl bg-white/8 transition group-hover:bg-white/10"
                    >
                      <button
                        type="button"
                        title={item.label}
                        onClick={onToggleReportMenu}
                        className={`flex h-12 w-full items-center transition ${
                          active || isReportMenuOpen
                            ? 'bg-[#afcb8f] text-slate-700'
                            : 'text-white/95 hover:bg-white/10'
                        }`}
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                          <SidebarIcon name={item.icon} />
                        </span>
                        <span className="whitespace-nowrap text-left text-[17px]">
                          {item.label}
                        </span>
                        <span className="ml-auto mr-4 text-lg">
                          {isReportMenuOpen ? '^' : 'v'}
                        </span>
                      </button>

                      {isReportMenuOpen && (
                        <div className="block space-y-1 bg-black/12 px-3 py-3">
                          {reportSidebarItems.map((reportItem) => (
                            <button
                              key={reportItem.label}
                              type="button"
                              onClick={() => handleReportSectionSelect(reportItem.label)}
                              className="flex w-full items-center rounded-xl px-3 py-3 text-left text-white/95 transition hover:bg-white/10"
                            >
                              <span className="text-[15px]">{reportItem.label}</span>
                              <span className="ml-auto">
                                <SidebarIcon name={reportItem.icon} />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <button
                    type="button"
                    key={item.label}
                    title={item.label}
                    onClick={() => handleSectionSelect(item.label)}
                    className={`flex h-12 w-full items-center rounded-2xl transition ${
                      active
                        ? 'bg-[#afcb8f] text-slate-700'
                        : 'text-white/95 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                      <SidebarIcon name={item.icon} />
                    </span>
                    <span className="whitespace-nowrap text-left text-[17px]">
                      {item.label}
                    </span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={handleLogoutClick}
                disabled={loading}
                title="Cikis"
                className="mt-2 flex h-12 w-full items-center rounded-2xl bg-white/10 transition hover:bg-white/15 disabled:opacity-50"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center text-base">
                  {loading ? '...' : 'X'}
                </span>
                <span className="whitespace-nowrap text-sm">Cikis</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-white/10 bg-black/35 px-2 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#62b0ff] text-sm font-semibold text-slate-950">
              10
            </div>
            <div className="whitespace-nowrap text-sm">10 C Bulutlu</div>
          </div>
        </div>
      </aside>
    </>
  )
}
