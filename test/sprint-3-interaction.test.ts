import { describe, expect, it } from 'vitest'
import { initialState, quizReducer, type QuizState } from '@/lib/quiz-reducer'
import type { Question } from '@/lib/quiz-types'

describe('Sprint 3: UI/UX 인터랙션 및 상태 머신 전수 검증', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'q-1',
      type: 'vocab',
      targetWord: 'comprehensive',
      stem: 'The report is _____.',
      choices: [
        { key: 'A', text: 'comprehensive' },
        { key: 'B', text: 'comprehensively' },
        { key: 'C', text: 'comprehend' },
        { key: 'D', text: 'comprehension' },
      ],
      answer: 'A',
      explanations: {
        A: '형용사 자리입니다.',
        B: '부사입니다.',
        C: '동사입니다.',
        D: '명사입니다.',
      },
      translation: '보고서는 종합적이다.',
      wordNote: 'comprehensive = 종합적인',
    },
    {
      id: 'q-2',
      type: 'grammar',
      targetWord: 'implement',
      stem: 'They will _____ the plan.',
      choices: [
        { key: 'A', text: 'implement' },
        { key: 'B', text: 'implementation' },
        { key: 'C', text: 'implementing' },
        { key: 'D', text: 'implemented' },
      ],
      answer: 'A',
      explanations: {
        A: '조동사 will 뒤 동사원형입니다.',
        B: '명사입니다.',
        C: '현재분사입니다.',
        D: '과거형입니다.',
      },
      translation: '그들은 계획을 실행할 것이다.',
      wordNote: 'implement = 실행하다',
    },
  ]

  describe('단일 화면 상태 머신 전환 (Phase Transition)', () => {
    it('input -> loading -> quiz -> next -> result -> restart 전체 라이프사이클이 정상 작동해야 한다', () => {
      // 1. 입력 상태
      let state = quizReducer(initialState, { type: 'input/change', value: 'comprehensive, implement' })
      state = quizReducer(state, { type: 'input/difficulty', value: 'normal' })
      expect(state.phase).toBe('input')

      // 2. 생성 시작 (loading)
      state = quizReducer(state, { type: 'generate/start' })
      expect(state.phase).toBe('loading')

      // 3. 생성 성공 (quiz 진입)
      state = quizReducer(state, { type: 'generate/success', questions: sampleQuestions })
      expect(state.phase).toBe('quiz')
      expect(state.current).toBe(0)
      expect(state.answers).toEqual([null, null])

      // 4. 1번 문항 답안 선택 (정답)
      state = quizReducer(state, { type: 'quiz/answer', key: 'A' })
      expect(state.answers[0]).toBe('A')

      // 5. 다음 문항 이동
      state = quizReducer(state, { type: 'quiz/next' })
      expect(state.current).toBe(1)
      expect(state.phase).toBe('quiz')

      // 6. 2번 문항 답안 선택 (오답)
      state = quizReducer(state, { type: 'quiz/answer', key: 'B' })
      expect(state.answers[1]).toBe('B')

      // 7. 마지막 문항 후 결과 보기 (result)
      state = quizReducer(state, { type: 'quiz/next' })
      expect(state.phase).toBe('result')

      // 8. 새로 시작 (restart) - 입력값은 보존되며 phase는 input으로 초기화
      state = quizReducer(state, { type: 'flow/restart' })
      expect(state.phase).toBe('input')
      expect(state.rawInput).toBe('comprehensive, implement')
      expect(state.difficulty).toBe('normal')
      expect(state.questions).toHaveLength(0)
      expect(state.answers).toHaveLength(0)
    })
  })

  describe('선지 1회 선택 강제 (불변성)', () => {
    it('이미 선지를 선택한 후에는 다시 선택해도 상태가 변경되지 않아야 한다', () => {
      let state = quizReducer(initialState, { type: 'generate/success', questions: sampleQuestions })
      
      // 첫 번째 선택 (A)
      state = quizReducer(state, { type: 'quiz/answer', key: 'A' })
      expect(state.answers[0]).toBe('A')

      // 두 번째 선택 시도 (B) -> 무시되어야 함
      state = quizReducer(state, { type: 'quiz/answer', key: 'B' })
      expect(state.answers[0]).toBe('A')
    })
  })

  describe('결과 집계 및 채점 로직 (D-9)', () => {
    it('점수 및 틀린 단어 목록을 정확하게 집계해야 한다', () => {
      let state = quizReducer(initialState, { type: 'generate/success', questions: sampleQuestions })
      // 1번 정답 (A), 2번 오답 (B)
      state = quizReducer(state, { type: 'quiz/answer', key: 'A' })
      state = quizReducer(state, { type: 'quiz/next' })
      state = quizReducer(state, { type: 'quiz/answer', key: 'B' })
      state = quizReducer(state, { type: 'quiz/next' })

      const results = state.questions.map((q, idx) => ({
        q,
        correct: state.answers[idx] === q.answer,
      }))
      const score = results.filter((r) => r.correct).length
      const wrongWords = results.filter((r) => !r.correct).map((r) => r.q.targetWord)

      expect(score).toBe(1)
      expect(state.questions.length).toBe(2)
      expect(wrongWords).toEqual(['implement'])
    })
  })
})
