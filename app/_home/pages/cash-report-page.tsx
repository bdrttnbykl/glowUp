import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { CashReportPeriod, CashReportSection } from '@/app/_home/types'

type CashReportPageProps = {
  message: string
  onPlaceholderAction: (label: string) => void
  onPeriodChange: (value: CashReportPeriod) => void
  onToggleSection: (key: string) => void
  openCashReportSections: string[]
  period: CashReportPeriod
  sections: readonly CashReportSection[]
}

export function CashReportPage({
  message,
  onPlaceholderAction,
  onPeriodChange,
  onToggleSection,
  openCashReportSections,
  period,
  sections,
}: CashReportPageProps) {
  const totalValue = sections.find((section) => section.key === 'total')?.value || '0,00 TL'
  const incomeValue = sections.find((section) => section.key === 'income')?.value || '0,00 TL'
  const expenseValue = sections.find((section) => section.key === 'expense')?.value || '0,00 TL'

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title="Kasa raporu"
        description="Kapanmis randevu tahsilatlari ve paket satislari donem bazli toplanir. Donemi degistirerek anlik finans ozetini kontrol edebilirsin."
        actions={
          <>
            <select
              value={period}
              onChange={(event) => onPeriodChange(event.target.value as CashReportPeriod)}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              <option>Bu ay</option>
              <option>Bu hafta</option>
              <option>Bu yil</option>
            </select>
            <button
              type="button"
              onClick={() => onPlaceholderAction('Kasa raporu indir')}
              className="rounded-2xl bg-[#537bb4] px-5 py-3 text-sm font-medium text-white"
            >
              Indir
            </button>
          </>
        }
        stats={
          <>
            <DashboardMetric label="Genel toplam" value={totalValue} />
            <DashboardMetric label="Gelir" value={incomeValue} tone="emerald" />
            <DashboardMetric label="Masraf" value={expenseValue} tone="amber" />
          </>
        }
      />

      <DashboardSectionCard>
        <div className="space-y-4 text-[14px] text-slate-800">
          {sections.map((section) => {
            const isOpen = openCashReportSections.includes(section.key)

            return (
              <div
                key={section.key}
                className="overflow-hidden rounded-2xl border border-[#d7e0eb] bg-[#fbfcfe] shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onToggleSection(section.key)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[18px] text-slate-500">{isOpen ? 'v' : '>'}</span>
                    <span className="text-[15px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {section.label}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-[#35588a]">{section.value}</span>
                </button>

                {isOpen && section.items.length > 0 && (
                  <div className="border-t border-[#d7e0eb] bg-white px-5 py-4">
                    <div className="space-y-4">
                      {section.items.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between rounded-xl bg-[#f8fbff] px-4 py-3">
                          <span>{label}</span>
                          <span className="font-semibold text-[#35588a]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DashboardSectionCard>

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
