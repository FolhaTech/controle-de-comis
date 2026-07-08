import { DOCUMENT_FIELDS, isDocFilled, type Process } from '@/lib/processos'
import { cn } from '@/lib/utils'

interface DocumentIndicatorsProps {
  process: Process
  compact?: boolean
}

export function DocumentIndicators({ process, compact }: DocumentIndicatorsProps) {
  const filledCount = DOCUMENT_FIELDS.filter((f) => isDocFilled(process[f.key])).length

  return (
    <div className="flex items-center gap-1">
      {DOCUMENT_FIELDS.map((field) => {
        const filled = isDocFilled(process[field.key])
        return (
          <div
            key={field.key}
            title={field.label}
            className={cn(
              'rounded-full transition-colors',
              compact ? 'h-2 w-2' : 'h-3 w-3',
              filled ? 'bg-success' : 'bg-muted-foreground/30',
            )}
          />
        )
      })}
      <span className="ml-1 text-xs text-muted-foreground tabular-nums">{filledCount}/13</span>
    </div>
  )
}
