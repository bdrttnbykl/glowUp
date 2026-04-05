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
  blue: 'border-[#b7cae4] bg-[#edf4ff] text-[#35588a]',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
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
    <div className="overflow-hidden rounded-[22px] border border-[#c9d6e7] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4fb_58%,#e8eef6_100%)] shadow-[0_16px_34px_rgba(41,65,106,0.08)]">
      <div className="flex flex-col gap-6 px-6 py-6 xl:flex-row xl:items-start xl:justify-between xl:px-7">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-[#bfd0e5] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#537bb4]">
            Dashboard
          </span>
          <h1 className="mt-4 text-4xl font-light tracking-[-0.05em] text-[#274a78] xl:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">{description}</p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
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
      className={`rounded-[20px] border border-[#d2dce9] bg-white/95 p-5 shadow-[0_12px_28px_rgba(24,39,75,0.07)] ${className}`.trim()}
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
      className={`min-w-[136px] rounded-2xl border px-4 py-3 shadow-sm ${metricToneClassMap[tone]}`}
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
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
      {message}
    </div>
  )
}
