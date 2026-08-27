'use client'

import { CloudOff, Pencil, RotateCcw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/inline-notice'
import { ERROR_MESSAGE, type ErrorKind } from '@/lib/quiz-reducer'

// 사용자가 다음에 할 수 있는 행동을 사유별로 한 줄 더 안내한다.
const ERROR_SUB: Record<ErrorKind, string> = {
  generic: '단어와 난이도는 그대로 남아 있어요.',
  busy: '보통 30초 뒤에는 다시 만들 수 있어요.',
  network: '연결이 돌아오면 같은 조건으로 다시 만들어 드려요.',
  timeout: '난이도를 낮추거나 단어 수를 줄이면 더 빨라요.',
  invalid_word: '스펠링을 확인하거나 다른 영단어를 입력해 보세요.',
  generation_quality: '단어를 변경하거나 다시 시도해 보세요. (단어와 난이도는 보존됩니다)',
}

export function ErrorPanel({
  kind,
  onRetry,
  onEditInput,
  headingRef,
}: {
  kind: ErrorKind
  onRetry: () => void
  onEditInput: () => void
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const Icon = kind === 'network' ? CloudOff : TriangleAlert

  return (
    <div className="flex flex-col gap-5">
      <section
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-5 py-8 text-center"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-muted">
          <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-title font-bold text-pretty outline-none"
        >
          {ERROR_MESSAGE[kind]}
        </h2>
        <p className="text-caption text-muted-foreground text-pretty">
          {ERROR_SUB[kind]}
        </p>
      </section>

      {/* 막다른 길이 되지 않도록 항상 두 가지 다음 행동을 제공 */}
      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={onRetry} className="h-12 w-full text-title">
          <RotateCcw aria-hidden="true" className="size-4" />
          다시 시도
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onEditInput}
          className="h-12 w-full text-body"
        >
          <Pencil aria-hidden="true" className="size-4" />
          입력 수정
        </Button>
        <InlineNotice tone="hint">
          결과는 저장되지 않습니다. 새로고침 시 사라집니다.
        </InlineNotice>
      </div>
    </div>
  )
}
