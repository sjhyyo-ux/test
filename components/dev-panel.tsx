'use client'

import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { QuizState } from '@/lib/quiz-reducer'
import type { ChoiceKey, Question } from '@/lib/quiz-types'
import { cn } from '@/lib/utils'

const DEV_PREVIEW_QUESTIONS: Question[] = [
  {
    id: 'q-dev-1',
    type: 'vocab',
    targetWord: 'compensate',
    stem: 'The company decided to _____ employees for additional travel expenses.',
    choices: [
      { key: 'A', text: 'compensate' },
      { key: 'B', text: 'postpone' },
      { key: 'C', text: 'eliminate' },
      { key: 'D', text: 'restrict' },
    ],
    answer: 'A',
    explanations: {
      A: '출장 경비에 대해 보상한다는 의미로 compensate가 정답입니다.',
      B: 'postpone은 연기하다의 뜻입니다.',
      C: 'eliminate는 제거하다의 뜻입니다.',
      D: 'restrict는 제한하다의 뜻입니다.',
    },
    translation: '회사는 추가 출장 경비에 대해 직원들에게 보상하기로 결정했다.',
    wordNote: 'compensate (동사) = 보상하다 (compensate A for B)',
  },
  {
    id: 'q-dev-2',
    type: 'grammar',
    targetWord: 'compliance',
    stem: 'All employees must ensure regulatory _____ across all facilities.',
    choices: [
      { key: 'A', text: 'compliance' },
      { key: 'B', text: 'comply' },
      { key: 'C', text: 'compliant' },
      { key: 'D', text: 'compliantly' },
    ],
    answer: 'A',
    explanations: {
      A: '타동사 ensure의 목적어 자리이므로 명사 compliance가 정답입니다.',
      B: '동사원형입니다.',
      C: '형용사입니다.',
      D: '부사입니다.',
    },
    translation: '모든 직원은 모든 시설에서 규정 준수를 보장해야 한다.',
    wordNote: 'compliance (명사) = 준수',
  },
  {
    id: 'q-dev-3',
    type: 'prep_conj',
    targetWord: 'despite',
    stem: '_____ unexpected logistical delays, the project was completed on schedule.',
    choices: [
      { key: 'A', text: 'Despite' },
      { key: 'B', text: 'Although' },
      { key: 'C', text: 'Even though' },
      { key: 'D', text: 'While' },
    ],
    answer: 'A',
    explanations: {
      A: '명사구를 이끄는 양보 전치사 Despite가 정답입니다.',
      B: '접속사입니다.',
      C: '접속사입니다.',
      D: '접속사입니다.',
    },
    translation: '예상치 못한 물류 지연에도 불구하고 프로젝트는 예정대로 완료되었다.',
    wordNote: 'despite (전치사) = ~에도 불구하고',
  },
]

interface Scenario {
  id: string
  label: string
  patch: (state: QuizState) => Partial<QuizState>
}

/** 정답이 아닌 첫 번째 선지 키 */
function wrongKeyOf(questions: Question[], index: number) {
  const question = questions[index]
  return question.choices.find((choice) => choice.key !== question.answer)!.key
}

function quizPatch(state: QuizState, index: number): Partial<QuizState> {
  const questions = state.questions.length > 0 ? state.questions : DEV_PREVIEW_QUESTIONS
  const safeIndex = Math.min(index, questions.length - 1)
  return {
    phase: 'quiz',
    questions,
    current: safeIndex,
    answers: questions.map(() => null),
    explanationBroken: false,
    shareFallback: false,
  }
}

function resultPatch(state: QuizState): Partial<QuizState> {
  const questions = state.questions.length > 0 ? state.questions : DEV_PREVIEW_QUESTIONS
  return {
    phase: 'result',
    questions,
    answers: questions.map((question, index) =>
      index === questions.length - 1
        ? wrongKeyOf(questions, index)
        : question.answer,
    ),
    shareFallback: false,
  }
}

const STATE_SCENARIOS: Scenario[] = [
  { id: 'A', label: 'A 입력', patch: () => ({ phase: 'input' }) },
  {
    id: 'A1-0',
    label: 'A-1 0~5초',
    patch: () => ({ phase: 'loading', loadingStage: 0, loadingFrozen: true }),
  },
  {
    id: 'A1-1',
    label: 'A-1 5~12초',
    patch: () => ({ phase: 'loading', loadingStage: 1, loadingFrozen: true }),
  },
  {
    id: 'A1-2',
    label: 'A-1 12~20초',
    patch: () => ({ phase: 'loading', loadingStage: 2, loadingFrozen: true }),
  },
  { id: 'B1', label: 'B 1문항', patch: (state) => quizPatch(state, 0) },
  { id: 'B2', label: 'B 2문항', patch: (state) => quizPatch(state, 1) },
  { id: 'B3', label: 'B 3문항', patch: (state) => quizPatch(state, 2) },
  { id: 'C', label: 'C 결과', patch: resultPatch },
]

const GRADE_SCENARIOS: Scenario[] = [
  {
    id: 'correct',
    label: '정답 선택',
    patch: (state) => {
      const questions = QUESTION_SETS[state.setKey]
      const answers = [...state.answers]
      answers[state.current] = questions[state.current].answer
      return { phase: 'quiz', questions, answers, explanationBroken: false }
    },
  },
  {
    id: 'wrong',
    label: '오답 선택',
    patch: (state) => {
      const questions = QUESTION_SETS[state.setKey]
      const answers = [...state.answers]
      answers[state.current] = wrongKeyOf(state, state.current)
      return { phase: 'quiz', questions, answers, explanationBroken: false }
    },
  },
]

const EDGE_SCENARIOS: Scenario[] = [
  {
    id: 'E1',
    label: 'E1 단어 미입력',
    patch: () => ({ phase: 'input', rawInput: ' , , ', difficulty: null }),
  },
  {
    id: 'E2',
    label: 'E2 난이도 미선택',
    patch: () => ({
      phase: 'input',
      rawInput: 'comprehensive',
      difficulty: null,
    }),
  },
  {
    id: 'E3a',
    label: 'E3 일부 비영어',
    patch: () => ({
      phase: 'input',
      rawInput: '사과, comprehensive',
      difficulty: 'normal',
    }),
  },
  {
    id: 'E3b',
    label: 'E3 전부 비영어',
    patch: () => ({
      phase: 'input',
      rawInput: '사과, 배',
      difficulty: 'normal',
    }),
  },
  {
    id: 'E4',
    label: 'E4 6개 초과',
    patch: () => ({
      phase: 'input',
      rawInput:
        'comprehensive, comprehensible, concise, consistent, considerable, consecutive',
      difficulty: 'normal',
    }),
  },
  {
    id: 'E5',
    label: 'E5 2문항 세트',
    patch: () => ({
      setKey: 'two',
      phase: 'quiz',
      questions: QUESTION_SETS.two,
      current: 0,
      answers: QUESTION_SETS.two.map(() => null),
      explanationBroken: false,
    }),
  },
  {
    id: 'E6a',
    label: 'E6 생성 실패',
    patch: () => ({ phase: 'error', errorKind: 'generic' }),
  },
  {
    id: 'E6b',
    label: 'E6 요청 많음',
    patch: () => ({ phase: 'error', errorKind: 'busy' }),
  },
  {
    id: 'E6c',
    label: 'E6 연결 확인',
    patch: () => ({ phase: 'error', errorKind: 'network' }),
  },
  {
    id: 'E7',
    label: 'E7 타임아웃',
    patch: () => ({ phase: 'error', errorKind: 'timeout' }),
  },
  {
    id: 'E8',
    label: 'E8 해설 실패',
    patch: (state) => {
      const questions = QUESTION_SETS[state.setKey]
      const answers: (ChoiceKey | null)[] = questions.map(() => null)
      answers[0] = questions[0].answer
      return {
        phase: 'quiz',
        questions,
        current: 0,
        answers,
        explanationBroken: true,
      }
    },
  },
  {
    id: 'E9',
    label: 'E9 공유 실패',
    patch: (state) => ({ ...resultPatch(state), shareFallback: true }),
  },
]

function Row({
  title,
  scenarios,
  state,
  onApply,
}: {
  title: string
  scenarios: Scenario[]
  state: QuizState
  onApply: (patch: Partial<QuizState>) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-micro font-semibold tracking-wide text-background/60 uppercase">
        {title}
      </p>
      <div className="flex flex-wrap gap-1">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onApply(scenario.patch(state))}
            className="rounded-md border border-background/25 px-2 py-1 text-micro font-medium text-background transition-colors hover:bg-background/15 focus-visible:ring-2 focus-visible:ring-background/60 focus-visible:outline-none"
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function DevPanel({
  state,
  onApply,
}: {
  state: QuizState
  onApply: (patch: Partial<QuizState>) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {open && (
        <div className="flex w-80 max-w-full flex-col gap-3 rounded-xl bg-foreground p-3 text-background shadow-xl">
          <p className="text-micro text-background/60">
            현재: {state.phase} · {state.setKey === 'three' ? '3문항' : '2문항'}{' '}
            세트 · {state.current + 1}번째
          </p>
          <Row
            title="표시 상태"
            scenarios={STATE_SCENARIOS}
            state={state}
            onApply={onApply}
          />
          <Row
            title="채점"
            scenarios={GRADE_SCENARIOS}
            state={state}
            onApply={onApply}
          />
          <Row
            title="예외 상태"
            scenarios={EDGE_SCENARIOS}
            state={state}
            onApply={onApply}
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-micro font-semibold tracking-wide text-background/60 uppercase">
              문항 세트
            </p>
            <div className="flex gap-1">
              {(['three', 'two'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    onApply({
                      setKey: key,
                      questions: QUESTION_SETS[key],
                      current: 0,
                      answers: QUESTION_SETS[key].map(() => null),
                      explanationBroken: false,
                    })
                  }
                  className={cn(
                    'rounded-md border px-2 py-1 text-micro font-medium transition-colors focus-visible:ring-2 focus-visible:ring-background/60 focus-visible:outline-none',
                    state.setKey === key
                      ? 'border-background bg-background text-foreground'
                      : 'border-background/25 text-background hover:bg-background/15',
                  )}
                >
                  {key === 'three' ? '3문항 세트' : '2문항 세트'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-11 items-center gap-1.5 rounded-full bg-foreground px-4 text-caption font-semibold text-background shadow-lg focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown aria-hidden="true" className="size-4" />
        ) : (
          <SlidersHorizontal aria-hidden="true" className="size-4" />
        )}
        상태 전환
      </button>
    </div>
  )
}
