'use client'

import { ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChoiceList } from '@/components/choice-list'
import { ExplanationPanel } from '@/components/explanation-panel'
import { InlineNotice } from '@/components/inline-notice'
import { TypeBadge } from '@/components/type-badge'
import { BLANK_TOKEN, type ChoiceKey, type Question } from '@/lib/quiz-types'

/** 빈칸을 한눈에 보이도록 지문을 쪼개어 렌더 */
function Sentence({ stem }: { stem: string }) {
  const parts = stem.split(BLANK_TOKEN)

  return (
    <p className="font-serif text-passage text-foreground text-pretty">
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 && (
            <span className="mx-1 inline-block w-20 rounded-t-sm border-b-2 border-primary bg-primary-soft align-baseline">
              <span className="sr-only">빈칸</span>
              <span aria-hidden="true">&nbsp;</span>
            </span>
          )}
        </span>
      ))}
    </p>
  )
}

export function QuestionCard({
  question,
  index,
  total,
  selected,
  explanationBroken,
  onSelect,
  onNext,
  headingRef,
}: {
  question: Question
  index: number
  total: number
  selected: ChoiceKey | null
  explanationBroken: boolean
  onSelect: (key: ChoiceKey) => void
  onNext: () => void
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const isLast = index === total - 1
  const answered = selected !== null

  return (
    <div className="flex flex-col gap-5">
      {/* EX-4: 문항이 3개보다 적게 만들어진 경우 안내 배너 */}
      {total < 3 && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-primary-soft px-3 py-2.5">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-accent-foreground"
          />
          <p className="text-caption text-accent-foreground text-pretty">
            이번엔 {total}문항이 만들어졌어요.
          </p>
        </div>
      )}

      <header className="flex items-center justify-between gap-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-title font-bold tabular-nums outline-none"
        >
          <span className="text-primary">{index + 1}</span>
          <span className="text-muted-foreground"> / {total}</span>
          <span className="sr-only">번째 문항</span>
        </h2>
        <TypeBadge type={question.type} />
      </header>

      {/* 진행 바 */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="풀이 진행률"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-micro font-semibold text-muted-foreground">
            타깃 단어{' '}
            <span className="font-serif text-foreground">
              {question.targetWord}
            </span>
          </p>
          <Sentence stem={question.stem} />
        </div>

        <ChoiceList
          choices={question.choices}
          answer={question.answer}
          selected={selected}
          onSelect={onSelect}
        />
      </section>

      {answered && (
        <ExplanationPanel
          question={question}
          selected={selected}
          broken={explanationBroken}
        />
      )}

      <div className="flex flex-col gap-2 pb-2">
        <Button
          size="lg"
          disabled={!answered}
          onClick={onNext}
          className="h-12 w-full text-title"
        >
          {isLast ? '결과 보기' : '다음 문제'}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
        {!answered && (
          <InlineNotice tone="hint">
            선지를 하나 고르면 해설이 바로 펼쳐져요. 선택은 한 번만 가능해요.
          </InlineNotice>
        )}
      </div>
    </div>
  )
}
