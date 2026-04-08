type DashboardBreadcrumbProps = {
  activeSection: string
}

export function DashboardBreadcrumb({ activeSection }: DashboardBreadcrumbProps) {
  return (
    <div className="border-b border-slate-300 bg-[#d9e0eb] px-8 py-4 text-sm text-slate-500">
      <span className="text-[#4c77b2]">SalonAppy</span>
      <span className="px-3">/</span>
      <span>Pera Beauty House</span>
      <span className="px-3">/</span>
      <span className="text-[#4c77b2]">{activeSection}</span>
    </div>
  )
}
