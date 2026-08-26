import { CircleAlert, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'blocker' | 'info' | 'hint'

// 인라인 안내 문구. 색에만 의존하지 않도록 항상 아이콘을 함께 노출한다.
const TONE_STYLE: Record<Tone, { className: string; Icon: typeof Info }> = {
  blocker: {
    className: 'text-destructive',
    Icon: CircleAlert,
  },
  info: {
    className: 'text-accent-foreground',
    Icon: Info,
  },
  hint: {
    className: 'text-muted-foreground',
    Icon: Lightbulb,
  },
}

export function InlineNotice({
  tone = 'info',
  children,
  className,
  id,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const { className: toneClass, Icon } = TONE_STYLE[tone]

  return (
    <p
      id={id}
      className={cn(
        'flex items-start gap-1.5 text-caption text-pretty',
        toneClass,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
