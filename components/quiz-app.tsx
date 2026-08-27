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

// EX-10 로딩 경과 단계 시간 설정 (ms)
const STAGE_1_MS = 6000
const STAGE_2_MS = 15000
const TIMEOUT_MS = 35000


/** 결과 공유·복사에 쓰는 텍스트 (PRD §3.3 표준 템플릿) */
function buildShareText(state: QuizState) {
  const targetWords = Array.from(
    new Set(state.questions.map((q) => q.targetWord)),
  ).join(', ')
  const total = state.questions.length
  const score = state.questions.filter(
    (question, index) => state.answers[index] === question.answer,
  ).length

  // 출제된 문항의 유형별 정오 요약
  const typeSummary = state.questions
    .map((q, idx) => {
      const correct = state.answers[idx] === q.answer
      return `${QUESTION_TYPE_LABEL[q.type]} ${correct ? 'O' : 'X'}`
    })
    .join(' · ')

  const serviceUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://toeic-weak-words.app'

  return `취약 단어 ${targetWords}로 토익 문제 ${total}개 풀었어요! 정답 ${score}/${total} (${typeSummary}) — 나도 풀어보기: ${serviceUrl}`
}

export function QuizApp() {
  const [state, dispatch] = useReducer(quizReducer, initialState)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const parsed = useMemo(() => parseWords(state.rawInput), [state.rawInput])

  // 상태가 바뀌면 새 콘텐츠의 시작점으로 포커스를 옮긴다.
  useEffect(() => {
    headingRef.current?.focus()
  }, [state.focusToken])

  // AI 문제 생성 및 4단계 로딩 타이머 (EX-10) + 자동 1회 재시도 (EX-4, EX-5, EX-6, EX-9)
  useEffect(() => {
    if (state.phase !== 'loading' || state.loadingFrozen) return

    const controller = new AbortController()
    abortControllerRef.current = controller

    // 단계별 UI 문구 변경 타이머
    const timerStage1 = window.setTimeout(() => {
      dispatch({ type: 'loading/stage', stage: 1 })
    }, STAGE_1_MS)

    const timerStage2 = window.setTimeout(() => {
      dispatch({ type: 'loading/stage', stage: 2 })
    }, STAGE_2_MS)

    const timerTimeout = window.setTimeout(() => {
      controller.abort()
      dispatch({ type: 'generate/fail', kind: 'timeout' })
    }, TIMEOUT_MS)

    async function fetchQuestionsWithRetry() {
      const payload = {
        words: parsed.used,
        difficulty: state.difficulty,
      }

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })

          if (!res.ok) {
            if (res.status === 422) {
              const errData = await res.json().catch(() => ({}))
              if (errData.error === 'invalid_word') {
                dispatch({ type: 'generate/fail', kind: 'invalid_word' })
                return
              }
              if (errData.error === 'generation_quality') {
                dispatch({ type: 'generate/fail', kind: 'generation_quality' })
                return
              }
            }
            if (res.status === 500) {
              const errData = await res.json().catch(() => ({}))
              if (errData.error === 'api_key_missing') {
                dispatch({ type: 'generate/fail', kind: 'api_key_missing' })
                return
              }
            }
            if (res.status === 429) {
              if (attempt === 0) continue // 1회 재시도
              dispatch({ type: 'generate/fail', kind: 'busy' })
              return
            }
            if (attempt === 0) continue // 1회 재시도
            dispatch({ type: 'generate/fail', kind: 'generic' })
            return
          }

          const data = await res.json()
          if (!data.questions || data.questions.length === 0) {
            if (attempt === 0) continue // EX-4(0개) / EX-5(전량폐기) 1회 재시도
            dispatch({ type: 'generate/fail', kind: 'generic' })
            return
          }

          // EX-6: 3문항 동일 유형인 경우 1회 자동 재시도
          if (data.isHomogeneous && attempt === 0) {
            continue
          }

          // 성공
          dispatch({
            type: 'generate/success',
            questions: data.questions,
          })
          return
        } catch (err: unknown) {
          if (controller.signal.aborted) {
            return
          }
          if (attempt === 0) continue // 네트워크 오류 등 1회 재시도
          if (
            err instanceof TypeError &&
            (err.message.includes('fetch') || err.message.includes('network'))
          ) {
            dispatch({ type: 'generate/fail', kind: 'network' })
          } else {
            dispatch({ type: 'generate/fail', kind: 'generic' })
          }
          return
        }
      }
    }

    fetchQuestionsWithRetry()

    return () => {
      window.clearTimeout(timerStage1)
      window.clearTimeout(timerStage2)
      window.clearTimeout(timerTimeout)
      controller.abort()
    }
  }, [state.phase, state.loadingFrozen, parsed.used, state.difficulty])

  const shareText = useMemo(() => buildShareText(state), [state])

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
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: '토익 문제 결과', text: shareText })
        return
      } catch (err: unknown) {
        // 사용자가 공유 시트를 취소(AbortError)한 경우 아무 동작도 하지 않음 (EX-11)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        // 기타 공유 오류인 경우 클립보드 복사 대체로 이동
      }
    }

    // 공유 미지원 환경 또는 실패 시 자동으로 클립보드 복사로 대체 (EX-11)
    try {
      await navigator.clipboard.writeText(shareText)
      dispatch({ type: 'toast/show', message: '복사했어요!' })
    } catch {
      // 클립보드도 차단된 경우 화면에 수동 복사 텍스트 영역 표시 (EX-11)
      dispatch({ type: 'share/fallback' })
    }
  }, [shareText])

  const showInput = state.phase === 'input' || state.phase === 'loading'

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-[50rem] px-5 py-8 sm:py-12">
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
