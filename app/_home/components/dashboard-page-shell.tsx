import type { ReactNode } from 'react'

type DashboardPageShellProps = {
  children: ReactNode
}

type DashboardPageHeroProps = {
  actions?: ReactNode
  description: string
  stats?: ReactNode
  title: string
}

type DashboardSectionCardProps = {
  children: ReactNode
  className?: string
}

type DashboardMetricProps = {
  label: string
  tone?: 'blue' | 'emerald' | 'amber' | 'slate'
  value: string
}

type DashboardMessageProps = {
  message: string
}

const metricToneClassMap = {
  blue: 'border-[#9edfd7] bg-[linear-gradient(135deg,#f5fffd_0%,#dff9f5_100%)] text-[#0e7c77]',
  emerald: 'border-[#bee6cf] bg-[linear-gradient(135deg,#f8fffa_0%,#e6f8ea_100%)] text-[#24734f]',
  amber: 'border-[#ffd29f] bg-[linear-gradient(135deg,#fffaf1_0%,#ffe7c5_100%)] text-[#bd6d16]',
  slate: 'border-[#f4c8b8] bg-[linear-gradient(135deg,#fff8f5_0%,#ffe8df_100%)] text-[#c45a3c]',
} as const

export function DashboardPageShell({ children }: DashboardPageShellProps) {
  return <section className="space-y-5">{children}</section>
}

export function DashboardPageHero({
  actions,
  description,
  stats,
  title,
}: DashboardPageHeroProps) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#cde9e3] bg-[linear-gradient(135deg,#fffefb_0%,#eefaf8_54%,#dff4ef_100%)] shadow-[0_16px_32px_rgba(42,111,103,0.08)]">
      <div className="flex flex-col gap-6 px-6 py-6 xl:flex-row xl:items-start xl:justify-between xl:px-7">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-[#bfe4de] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#15928a]">
            Panel
          </span>
          <h1 className="mt-4 text-4xl font-light tracking-[-0.05em] text-[#154c57] xl:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5f6f6c]">{description}</p>
        </div>

        <div
          className={`flex flex-col gap-3 xl:items-end ${stats ? '' : 'xl:self-stretch xl:justify-center'}`.trim()}
        >
          {actions && <div className="flex flex-wrap gap-2 xl:justify-end">{actions}</div>}
          {stats && <div className="flex flex-wrap gap-3 xl:justify-end">{stats}</div>}
        </div>
      </div>
    </div>
  )
}

export function DashboardSectionCard({
  children,
  className = '',
}: DashboardSectionCardProps) {
  return (
    <div
      className={`rounded-[20px] border border-[#dde8e3] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfc_100%)] p-5 shadow-[0_12px_24px_rgba(28,74,69,0.06)] ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export function DashboardMetric({
  label,
  tone = 'blue',
  value,
}: DashboardMetricProps) {
  return (
    <div
      className={`min-w-[136px] rounded-2xl border px-4 py-3 shadow-[0_10px_20px_rgba(255,255,255,0.28)] ${metricToneClassMap[tone]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  )
}

export function DashboardMessage({ message }: DashboardMessageProps) {
  if (!message) {
    return null
  }

  return (
    <div className="rounded-2xl border border-[#cde9e3] bg-[linear-gradient(135deg,#f5fffd_0%,#e8faf6_100%)] px-4 py-3 text-sm text-[#0f7d77] shadow-sm">
      {message}
    </div>
  )
}
