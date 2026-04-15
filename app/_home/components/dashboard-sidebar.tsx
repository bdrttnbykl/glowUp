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
  const isActiveReportSection = reportSidebarItems.some((item) => item.label === activeSection)

  return (
    <header className="sticky top-0 z-40 border-b border-[#2d6ea6] bg-[linear-gradient(180deg,#2d77b9_0%,#3f8ac8_100%)] text-white shadow-[0_10px_24px_rgba(27,71,112,0.18)]">
      <div className="grid min-h-[72px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-md bg-[#224f80] px-5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Image
              src={salonAppyLogo}
              alt="glowup logo"
              className="h-auto w-[120px] object-contain brightness-[2.8] saturate-0"
              priority
            />
          </div>
        </div>

        <nav className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto">
          {items.map((item) => {
            const active = item.label === activeSection
            const isReportsItem = item.label === 'Raporlar'

            if (isReportsItem) {
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={onToggleReportMenu}
                  className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition ${
                    active || isReportMenuOpen
                      ? 'bg-[#2d6ea6] text-white'
                      : 'text-white/90 hover:bg-white/12'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs">{isReportMenuOpen ? '▲' : '▼'}</span>
                </button>
              )
            }

            return (
              <button
                type="button"
                key={item.label}
                onClick={() => onSelectSection(item.label)}
                className={`rounded-md px-4 py-3 text-sm font-semibold transition ${
                  active ? 'bg-[#2d6ea6] text-white' : 'text-white/90 hover:bg-white/12'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/12"
            title="Hizli ekle"
          >
            +
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/12"
            title="Ara"
          >
            <span className="text-sm">⌕</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            disabled={loading}
            className="rounded-md border border-white/18 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16 disabled:opacity-50"
          >
            {loading ? 'Cikiliyor...' : 'Cikis'}
          </button>
        </div>
      </div>

      {(isReportMenuOpen || isActiveReportSection) && (
        <div className="border-t border-[#5a98d0] bg-[#f8fbfe] px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
          <div className="flex flex-wrap items-center gap-2">
            {reportSidebarItems.map((reportItem) => {
              const active = reportItem.label === activeSection

              return (
                <button
                  key={reportItem.label}
                  type="button"
                  onClick={() => onSelectReportSection(reportItem.label)}
                  className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-[#3f8ac8] bg-[#3f8ac8] text-white shadow-sm'
                      : 'border-[#d7e4f1] bg-white text-[#5b6f85] hover:bg-[#f3f8fd]'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-[#3f8ac8]'}>
                    <SidebarIcon name={reportItem.icon} />
                  </span>
                  <span>{reportItem.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
