import { BookA, Ruler, Link2 } from 'lucide-react'
import { QUESTION_TYPE_LABEL, type QuestionType } from '@/lib/quiz-types'
import { cn } from '@/lib/utils'

// 유형 3종은 액센트 1색 안에서 채움/선/톤 차이 + 아이콘으로 구분한다.
const TYPE_STYLE: Record<
  QuestionType,
  { className: string; Icon: typeof BookA }
> = {
  vocab: {
    className: 'bg-primary text-primary-foreground border-primary',
    Icon: BookA,
  },
  grammar: {
    className: 'bg-card text-accent-foreground border-primary/40',
    Icon: Ruler,
  },
  prep_conj: {
    className: 'bg-primary-soft text-accent-foreground border-transparent',
    Icon: Link2,
  },
}

export function TypeBadge({
  type,
  className,
}: {
  type: QuestionType
  className?: string
}) {
  const { className: typeClass, Icon } = TYPE_STYLE[type]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-micro font-semibold',
        typeClass,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      <span>{QUESTION_TYPE_LABEL[type]}</span>
    </span>
  )
}
