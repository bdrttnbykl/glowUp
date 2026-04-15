type DashboardBreadcrumbProps = {
  activeSection: string
}

export function DashboardBreadcrumb({ activeSection }: DashboardBreadcrumbProps) {
  return (
    <div className="border-b border-[#e2e8f0] bg-[#f8fbfe] px-6 py-3 text-sm text-slate-500">
      <span className="font-medium text-[#3f8ac8]">GlowUp Panel</span>
      <span className="px-3 text-slate-300">/</span>
      <span className="font-medium text-slate-600">Pera Beauty House</span>
      <span className="px-3 text-slate-300">/</span>
      <span className="font-semibold text-[#2b3d52]">{activeSection}</span>
    </div>
  )
}
