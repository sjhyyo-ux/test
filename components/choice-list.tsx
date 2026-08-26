'use client'

import { useRef } from 'react'
import { Check, X } from 'lucide-react'
import type { Choice, ChoiceKey } from '@/lib/quiz-types'
import { cn } from '@/lib/utils'

export function ChoiceList({
  choices,
  answer,
  selected,
  onSelect,
}: {
  choices: Choice[]
  answer: ChoiceKey
  /** 아직 선택하지 않았으면 null. 선택 후에는 변경 불가 */
  selected: ChoiceKey | null
  onSelect: (key: ChoiceKey) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const answered = selected !== null

  // 키보드(화살표)로 선지 간 이동
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (answered) return
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        'button[role="radio"]',
      ) ?? [],
    )
    const activeIndex = buttons.findIndex(
      (button) => button === document.activeElement,
    )
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    const nextIndex =
      activeIndex === -1
        ? 0
        : (activeIndex + (forward ? 1 : -1) + buttons.length) % buttons.length
    buttons[nextIndex]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label="선지 4개 중 하나를 선택하세요"
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2"
    >
      {choices.map((choice) => {
        const isSelected = selected === choice.key
        const isAnswer = answer === choice.key
        const selectedCorrect = isSelected && isAnswer
        const selectedWrong = isSelected && !isAnswer
        const revealedAnswer = answered && !isSelected && isAnswer
        const dimmed = answered && !isSelected && !isAnswer

        return (
          <button
            key={choice.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={answered}
            tabIndex={answered ? -1 : 0}
            onClick={() => onSelect(choice.key)}
            className={cn(
              'flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none',
              // 기본 / 호버
              !answered &&
                'border-border bg-card hover:border-primary/50 hover:bg-primary-soft active:translate-y-px',
              // 선택-정답
              selectedCorrect && 'border-correct bg-correct-soft',
              // 선택-오답
              selectedWrong && 'border-incorrect bg-incorrect-soft',
              // 선택 후 정답 노출
              revealedAnswer && 'border-correct border-dashed bg-card',
              // 선택 후 비활성 선지
              dimmed && 'border-border bg-muted/60 opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md border text-micro font-bold',
                selectedCorrect && 'border-correct bg-correct text-card',
                selectedWrong && 'border-incorrect bg-incorrect text-card',
                revealedAnswer && 'border-correct text-correct',
                !isSelected && !isAnswer && 'border-border text-muted-foreground',
                !answered && 'border-border-strong text-foreground',
              )}
            >
              {choice.key}
            </span>

            <span className="grow font-serif text-body leading-relaxed text-foreground">
              {choice.text}
            </span>

            {/* 색 외에 아이콘 + 텍스트 라벨로도 정오를 표시 */}
            {selectedCorrect && (
              <span className="flex shrink-0 items-center gap-1 text-micro font-semibold text-correct">
                <Check aria-hidden="true" className="size-3.5" />내 선택 · 정답
              </span>
            )}
            {selectedWrong && (
              <span className="flex shrink-0 items-center gap-1 text-micro font-semibold text-incorrect">
                <X aria-hidden="true" className="size-3.5" />내 선택 · 오답
              </span>
            )}
            {revealedAnswer && (
              <span className="flex shrink-0 items-center gap-1 text-micro font-semibold text-correct">
                <Check aria-hidden="true" className="size-3.5" />
                정답
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
