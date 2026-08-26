'use client'

import { Check, Copy, RotateCcw, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/inline-notice'
import { TypeBadge } from '@/components/type-badge'
import type { ChoiceKey, Question } from '@/lib/quiz-types'

export function ResultPanel({
  questions,
  answers,
  shareText,
  shareFallback,
  onCopy,
  onShare,
  onRestart,
  headingRef,
}: {
  questions: Question[]
  answers: (ChoiceKey | null)[]
  shareText: string
  /** E9: 공유 실패 폴백 */
  shareFallback: boolean
  onCopy: () => void
  onShare: () => void
  onRestart: () => void
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const results = questions.map((question, index) => ({
    question,
    correct: answers[index] === question.answer,
  }))
  const score = results.filter((result) => result.correct).length
  const wrongWords = results
    .filter((result) => !result.correct)
    .map((result) => result.question.targetWord)
  const uniqueWrongWords = Array.from(new Set(wrongWords))

  return (
    <div className="flex flex-col gap-5">
      {/* 점수 */}
      <section className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-4 py-7">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-caption font-semibold text-muted-foreground outline-none"
        >
          채점 결과
        </h2>
        <p className="text-display font-bold tabular-nums">
          <span className="text-primary">{score}</span>
          <span className="text-muted-foreground"> / {questions.length}</span>
        </p>
        <p className="text-caption text-muted-foreground text-pretty">
          {score === questions.length
            ? '전부 맞혔어요. 다른 단어로도 확인해 보세요.'
            : '틀린 단어를 한 번 더 넣어 보면 오래 남아요.'}
        </p>
      </section>

      {/* 유형별 정오표 — 출제된 유형만 표시 */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-title font-semibold">유형별 정오</h3>
        <ul className="flex flex-col divide-y divide-border">
          {results.map(({ question, correct }) => (
            <li
              key={question.id}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <TypeBadge type={question.type} />
                <span className="truncate font-serif text-caption text-muted-foreground">
                  {question.targetWord}
                </span>
              </div>
              {correct ? (
                <span className="flex shrink-0 items-center gap-1 text-caption font-semibold text-correct">
                  <Check aria-hidden="true" className="size-4" />
                  정답
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-caption font-semibold text-incorrect">
                  <X aria-hidden="true" className="size-4" />
                  오답
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 틀린 문항의 타깃 단어 */}
      <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <h3 className="text-title font-semibold">다시 볼 단어</h3>
        {uniqueWrongWords.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            틀린 문항이 없어요. 다시 볼 단어가 없습니다.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {uniqueWrongWords.map((word) => (
              <span
                key={word}
                className="rounded-md border border-incorrect/30 bg-incorrect-soft px-2 py-1 font-serif text-caption font-medium text-incorrect"
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* E9: 공유 실패 폴백 — 직접 복사할 수 있는 텍스트 영역 */}
      {shareFallback && (
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h3 className="text-title font-semibold">공유하지 못했어요</h3>
          <InlineNotice tone="info">
            아래 내용을 직접 복사해 주세요.
          </InlineNotice>
          <textarea
            readOnly
            value={shareText}
            rows={6}
            aria-label="공유 텍스트"
            className="w-full resize-y rounded-lg border border-input bg-muted/50 p-3 text-caption leading-relaxed text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
          />
          <Button
            variant="outline"
            onClick={onCopy}
            className="h-11 w-full text-body"
          >
            <Copy aria-hidden="true" className="size-4" />
            텍스트 복사
          </Button>
        </section>
      )}

      {/* 3버튼 위계: 주 / 보조 / 부차 */}
      <div className="flex flex-col gap-2 pb-2">
        <Button size="lg" onClick={onCopy} className="h-12 w-full text-title">
          <Copy aria-hidden="true" className="size-4" />
          결과 전체 복사
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onShare}
          className="h-12 w-full text-body"
        >
          <Share2 aria-hidden="true" className="size-4" />
          공유
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onRestart}
          className="h-11 w-full text-body text-muted-foreground"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          새로 시작
        </Button>
        <InlineNotice tone="hint">이 결과는 저장되지 않습니다.</InlineNotice>
      </div>
    </div>
  )
}
