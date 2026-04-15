import Image from 'next/image'

import { reportSidebarItems } from '@/app/_home/constants'
import { SidebarIcon } from '@/app/_home/sidebar-icon'
import salonAppyLogo from '@/img/glowup-wordmark-transparent-v2.png'

type SidebarItem = {
  icon: string
  label: string
}

type DashboardSidebarProps = {
  activeSection: string
  isReportMenuOpen: boolean
  items: readonly SidebarItem[]
  loading: boolean
  onLogout: () => void
  onSelectReportSection: (section: string) => void
  onSelectSection: (section: string) => void
  onToggleReportMenu: () => void
}

export function DashboardSidebar({
  activeSection,
  isReportMenuOpen,
  items,
  loading,
  onLogout,
  onSelectReportSection,
  onSelectSection,
  onToggleReportMenu,
}: DashboardSidebarProps) {
  const handleSectionSelect = (section: string) => {
    onSelectSection(section)
  }

  const handleReportSectionSelect = (section: string) => {
    onSelectReportSection(section)
  }

  return (
    <aside className="group fixed left-0 top-0 z-30 flex h-dvh w-[74px] flex-col overflow-y-scroll overflow-x-hidden overscroll-contain bg-[linear-gradient(180deg,#103d47_0%,#14606c_28%,#1c8a87_66%,#ff8c66_100%)] text-white transition-[width] duration-300 ease-out hover:w-[300px]">
      <div className="relative px-3 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#9ce7df40_0%,transparent_30%),radial-gradient(circle_at_bottom,#ffd0bd30_0%,transparent_24%),linear-gradient(180deg,transparent_0%,rgba(8,34,42,0.16)_100%)]" />

        <div className="relative flex min-h-full flex-col items-center">
          <div className="mb-8 flex w-full items-center justify-center overflow-hidden">
            <div className="flex h-12 w-[56px] shrink-0 items-center justify-center transition-[width] duration-300 ease-out group-hover:w-[146px]">
              <Image
                src={salonAppyLogo}
                alt="glowup logo"
                className="h-auto w-[46px] object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.25)] transition-[width] duration-300 ease-out group-hover:w-[132px]"
                priority
              />
            </div>
          </div>

          <nav className="flex w-full flex-col gap-4 pr-1">
            {items.map((item) => {
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
                          ? 'bg-[#f7fffd] text-[#14726d] shadow-[0_8px_20px_rgba(12,71,75,0.18)]'
                          : 'text-white/95 hover:bg-white/10'
                      }`}
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                          <SidebarIcon name={item.icon} />
                        </span>
                        <span className="translate-x-2 whitespace-nowrap text-left text-[17px] opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                          {item.label}
                        </span>
                        <span
                          className={`ml-auto mr-4 text-lg transition ${
                            isReportMenuOpen ? 'block' : 'hidden group-hover:block'
                          }`}
                        >
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
                            className="flex w-full items-center rounded-xl px-3 py-3 text-left text-white/95 transition hover:bg-white/14"
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
                      ? 'bg-[#f7fffd] text-[#14726d] shadow-[0_8px_20px_rgba(12,71,75,0.18)]'
                      : 'text-white/95 hover:bg-white/10'
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                    <SidebarIcon name={item.icon} />
                  </span>
                  <span className="translate-x-2 whitespace-nowrap text-left text-[17px] opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                    {item.label}
                  </span>
                </button>
              )
            })}

            <button
              type="button"
              onClick={onLogout}
              disabled={loading}
              title="Cikis"
              className="mt-2 flex h-12 w-full items-center rounded-2xl bg-white/18 transition hover:bg-white/24 disabled:opacity-50"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center text-base">
                {loading ? '...' : 'X'}
              </span>
              <span className="translate-x-2 whitespace-nowrap text-sm opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                Cikis
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/20 bg-white/10 px-2 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3 overflow-hidden group-hover:justify-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7fffd] text-sm font-semibold text-[#14726d]">
            10
          </div>
          <div className="translate-x-2 whitespace-nowrap text-sm opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            10 C Bulutlu
          </div>
        </div>
      </div>
    </aside>
  )
}
