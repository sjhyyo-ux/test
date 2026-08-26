'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { DevPanel } from '@/components/dev-panel'
import { ErrorPanel } from '@/components/error-panel'
import { InputPanel } from '@/components/input-panel'
import { LoadingOverlay } from '@/components/loading-overlay'
import { QuestionCard } from '@/components/question-card'
import { ResultPanel } from '@/components/result-panel'
import { Toast } from '@/components/toast'
import { DEV_PANEL_ENABLED } from '@/lib/dev-config'
import { parseWords } from '@/lib/parse-words'
import { initialState, quizReducer, type QuizState } from '@/lib/quiz-reducer'
import {
  DIFFICULTY_LABEL,
  QUESTION_TYPE_LABEL,
  type ChoiceKey,
} from '@/lib/quiz-types'

// 네트워크 호출 없이 setTimeout으로 생성 시간만 흉내 낸다.
const FAKE_GENERATE_MS = 2600
const STAGE_1_MS = 5000
const STAGE_2_MS = 12000
const TIMEOUT_MS = 20000

/** 결과 공유·복사에 쓰는 텍스트 */
function buildShareText(state: QuizState, difficultyLabel: string) {
  const lines = state.questions.map((question, index) => {
    const picked = state.answers[index]
    const correct = picked === question.answer
    return `${index + 1}. [${QUESTION_TYPE_LABEL[question.type]}] ${question.targetWord} — ${correct ? 'O' : 'X'} (고른 답 ${picked ?? '-'}, 정답 ${question.answer})`
  })
  const score = state.questions.filter(
    (question, index) => state.answers[index] === question.answer,
  ).length

  return [
    '취약 단어 타겟형 토익 문제 생성기 결과',
    `난이도: ${difficultyLabel}`,
    `점수: ${score} / ${state.questions.length}`,
    '',
    ...lines,
  ].join('\n')
}

export function QuizApp() {
  const [state, dispatch] = useReducer(quizReducer, initialState)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const parsed = useMemo(() => parseWords(state.rawInput), [state.rawInput])

  // 상태가 바뀌면 새 콘텐츠의 시작점으로 포커스를 옮긴다.
  useEffect(() => {
    headingRef.current?.focus()
  }, [state.focusToken])

  // 로딩 타이머: 문구 3단계 교체 + 타임아웃
  useEffect(() => {
    if (state.phase !== 'loading' || state.loadingFrozen) return

    const timers = [
      window.setTimeout(
        () => dispatch({ type: 'generate/success' }),
        FAKE_GENERATE_MS,
      ),
      window.setTimeout(
        () => dispatch({ type: 'loading/stage', stage: 1 }),
        STAGE_1_MS,
      ),
      window.setTimeout(
        () => dispatch({ type: 'loading/stage', stage: 2 }),
        STAGE_2_MS,
      ),
      window.setTimeout(
        () => dispatch({ type: 'generate/fail', kind: 'timeout' }),
        TIMEOUT_MS,
      ),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [state.phase, state.loadingFrozen])

  const difficultyLabel = state.difficulty
    ? DIFFICULTY_LABEL[state.difficulty]
    : '미선택'
  const shareText = useMemo(
    () => buildShareText(state, difficultyLabel),
    [state, difficultyLabel],
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      dispatch({ type: 'toast/show', message: '복사했어요!' })
    } catch {
      // 클립보드를 쓸 수 없으면 직접 복사할 수 있는 텍스트 영역을 노출한다.
      dispatch({ type: 'share/fallback' })
    }
  }, [shareText])

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: '토익 문제 결과', text: shareText })
        return
      } catch {
        // 사용자가 취소했거나 공유가 실패한 경우 → 폴백
      }
    }
    dispatch({ type: 'share/fallback' })
  }, [shareText])

  const showInput = state.phase === 'input' || state.phase === 'loading'

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-[34rem] px-5 py-8 sm:py-12">
        {showInput && (
          <InputPanel
            rawInput={state.rawInput}
            difficulty={state.difficulty}
            parsed={parsed}
            busy={state.phase === 'loading'}
            onChangeInput={(value) =>
              dispatch({ type: 'input/change', value })
            }
            onChangeDifficulty={(value) =>
              dispatch({ type: 'input/difficulty', value })
            }
            onSubmit={() => dispatch({ type: 'generate/start' })}
            headingRef={headingRef}
          />
        )}

        {state.phase === 'quiz' && state.questions.length > 0 && (
          <QuestionCard
            question={state.questions[state.current]}
            index={state.current}
            total={state.questions.length}
            selected={state.answers[state.current] ?? null}
            explanationBroken={state.explanationBroken}
            onSelect={(key: ChoiceKey) =>
              dispatch({ type: 'quiz/answer', key })
            }
            onNext={() => dispatch({ type: 'quiz/next' })}
            headingRef={headingRef}
          />
        )}

        {state.phase === 'result' && (
          <ResultPanel
            questions={state.questions}
            answers={state.answers}
            shareText={shareText}
            shareFallback={state.shareFallback}
            onCopy={handleCopy}
            onShare={handleShare}
            onRestart={() => dispatch({ type: 'flow/restart' })}
            headingRef={headingRef}
          />
        )}

        {state.phase === 'error' && (
          <ErrorPanel
            kind={state.errorKind}
            onRetry={() => dispatch({ type: 'generate/start' })}
            onEditInput={() => dispatch({ type: 'error/edit' })}
            headingRef={headingRef}
          />
        )}
      </main>

      {state.phase === 'loading' && (
        <LoadingOverlay
          stage={state.loadingStage}
          onCancel={() => dispatch({ type: 'loading/cancel' })}
        />
      )}

      <Toast
        message={state.toast}
        onDismiss={() => dispatch({ type: 'toast/hide' })}
      />

      {DEV_PANEL_ENABLED && (
        <DevPanel
          state={state}
          onApply={(patch) => dispatch({ type: 'dev/apply', patch })}
        />
      )}
    </div>
  )
}
