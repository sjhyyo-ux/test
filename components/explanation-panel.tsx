'use client'

import { Check, CircleAlert, Languages, Target, X } from 'lucide-react'
import type { ChoiceKey, Question } from '@/lib/quiz-types'
import { cn } from '@/lib/utils'

/** 해설 블록 공통 껍데기 — 블록마다 라벨을 달아 정보 위계를 분리한다 */
function Block({
  label,
  icon,
  children,
  className,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-1.5 px-4 py-3', className)}>
      <h4 className="flex items-center gap-1.5 text-micro font-bold tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </h4>
      <div className="text-caption leading-relaxed text-foreground">
        {children}
      </div>
    </section>
  )
}

export function ExplanationPanel({
  question,
  selected,
  broken,
}: {
  question: Question
  selected: ChoiceKey
  /** E8: 해설 렌더 실패 폴백 */
  broken?: boolean
}) {
  const isCorrect = selected === question.answer
  const answerChoice = question.choices.find(
    (choice) => choice.key === question.answer,
  )
  const myChoice = question.choices.find((choice) => choice.key === selected)

  return (
    <div
      aria-live="polite"
      className="animate-explain overflow-hidden rounded-xl border border-border bg-card motion-reduce:animate-none"
    >
      {/* ① 정오 표시 — 색 + 아이콘 + 텍스트 라벨 3중 표기 */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3',
          isCorrect ? 'bg-correct-soft' : 'bg-incorrect-soft',
        )}
      >
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full',
            isCorrect ? 'bg-correct' : 'bg-incorrect',
          )}
        >
          {isCorrect ? (
            <Check aria-hidden="true" className="size-4 text-card" />
          ) : (
            <X aria-hidden="true" className="size-4 text-card" />
          )}
        </span>
        <p
          className={cn(
            'text-title font-bold',
            isCorrect ? 'text-correct' : 'text-incorrect',
          )}
        >
          {isCorrect ? '정답이에요' : '오답이에요'}
        </p>
        <p className="ml-auto text-caption text-muted-foreground">
          정답 <span className="font-bold text-foreground">{question.answer}</span>
        </p>
      </div>

      {broken ? (
        // E8: 해설을 불러오지 못한 경우에도 정답은 반드시 알려 준다
        <div className="flex flex-col gap-1.5 px-4 py-4">
          <p className="flex items-start gap-1.5 text-caption text-foreground">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-destructive"
            />
            <span>
              이 선지의 해설을 불러오지 못했어요. 정답은 [{question.answer}]
              입니다.
            </span>
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {/* ② 정답 근거 */}
          <Block
            label="정답 근거"
            icon={<Check aria-hidden="true" className="size-3" />}
          >
            <p>
              <span className="font-serif font-semibold">
                ({question.answer}) {answerChoice?.text}
              </span>{' '}
              — {question.explanations[question.answer]}
            </p>
          </Block>

          {/* ③ 내가 고른 오답이 틀린 이유 (정답이면 숨김) */}
          {!isCorrect && myChoice && (
            <Block
              label="내가 고른 선지가 틀린 이유"
              icon={<X aria-hidden="true" className="size-3" />}
              className="bg-incorrect-soft/40"
            >
              <p>
                <span className="font-serif font-semibold">
                  ({myChoice.key}) {myChoice.text}
                </span>{' '}
                — {question.explanations[selected]}
              </p>
            </Block>
          )}

          {/* ④ 한글 해석 */}
          <Block
            label="한글 해석"
            icon={<Languages aria-hidden="true" className="size-3" />}
          >
            <p className="text-pretty">{question.translation}</p>
          </Block>

          {/* ⑤ 타깃 단어 한 줄 정리 */}
          <Block
            label={`타깃 단어 정리 · ${question.targetWord}`}
            icon={<Target aria-hidden="true" className="size-3" />}
            className="bg-primary-soft/50"
          >
            <p className="text-pretty">{question.wordNote}</p>
          </Block>
        </div>
      )}
    </div>
  )
}
