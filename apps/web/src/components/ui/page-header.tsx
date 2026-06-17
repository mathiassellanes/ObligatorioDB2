import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  icon?: LucideIcon
  /** Right-aligned content: badge, button, etc. */
  action?: ReactNode
}

/**
 * Consistent page header used across all pages: title + optional subtitle on
 * the left, optional action slot on the right. Replaces the ad-hoc title/meta
 * markup that drifted between pages.
 */
export function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#39ff14]" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="section-title leading-none">{title}</h1>
          {subtitle && <p className="text-[#6b7a9c] text-sm mt-1.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
