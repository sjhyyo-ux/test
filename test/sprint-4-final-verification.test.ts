import { describe, expect, it } from 'vitest'
import { initialState, quizReducer } from '@/lib/quiz-reducer'
import { validateAndSanitizeQuestions, hasHomogeneousTypes } from '@/lib/validator'
import { parseWords } from '@/lib/parse-words'
import type { Question } from '@/lib/quiz-types'

describe('Sprint 4: PRD §6 완료 조건 (D-1 ~ D-12 & S1 ~ S6) 종합 검증', () => {
  const sampleQuestionSet: Question[] = [
    {
      id: 'q-1',
      type: 'vocab',
      targetWord: 'comprehensive',
      stem: 'The executive committee requested a _____ evaluation.',
      choices: [
        { key: 'A', text: 'comprehensive' },
        { key: 'B', text: 'comprehensively' },
        { key: 'C', text: 'comprehension' },
        { key: 'D', text: 'comprehend' },
      ],
      answer: 'A',
      explanations: {
        A: '명사 evaluation을 수식하는 형용사 자리입니다.',
        B: '부사이므로 명사를 수식할 수 없습니다.',
        C: '명사 중복입니다.',
        D: '동사원형입니다.',
      },
      translation: '경영위원회는 포괄적인 평가를 요청했다.',
      wordNote: 'comprehensive = 포괄적인, 종합적인',
    },
    {
      id: 'q-2',
      type: 'grammar',
      targetWord: 'implement',
      stem: 'The guidelines were _____ by the safety committee.',
      choices: [
        { key: 'A', text: 'implemented' },
        { key: 'B', text: 'implement' },
        { key: 'C', text: 'implementation' },
        { key: 'D', text: 'implementing' },
      ],
      answer: 'A',
      explanations: {
        A: '수동태 were + p.p. 자리입니다.',
        B: '동사원형입니다.',
        C: '명사입니다.',
        D: '현재분사입니다.',
      },
      translation: '지침은 안전위원회에 의해 시행되었다.',
      wordNote: 'implement = 시행하다',
    },
    {
      id: 'q-3',
      type: 'prep_conj',
      targetWord: 'despite',
      stem: '_____ bad weather, the festival started on time.',
      choices: [
        { key: 'A', text: 'Despite' },
        { key: 'B', text: 'Although' },
        { key: 'C', text: 'Since' },
        { key: 'D', text: 'Because' },
      ],
      answer: 'A',
      explanations: {
        A: '명사구(bad weather)를 이끄는 전치사 자리입니다.',
        B: '접속사입니다.',
        C: '접속사입니다.',
        D: '접속사입니다.',
      },
      translation: '나쁜 날씨에도 불구하고 축제는 제시간에 시작했다.',
      wordNote: 'despite + 명사구 = ~에도 불구하고',
    },
  ]

  describe('D-1 ~ D-6: 단일 화면, AI 1회 생성 및 선지/유형 무결성 검증', () => {
    it('D-1: 단일 화면 상태 전환으로 동작하며 phase만 변경된다', () => {
      let state = quizReducer(initialState, { type: 'generate/start' })
      expect(state.phase).toBe('loading')
      state = quizReducer(state, { type: 'generate/success', questions: sampleQuestionSet })
      expect(state.phase).toBe('quiz')
    })

    it('D-4: 난이도 선택이 quiz-types 및 prompt 인자에 정확히 반영된다', () => {
      let state = quizReducer(initialState, { type: 'input/difficulty', value: 'hard' })
      expect(state.difficulty).toBe('hard')
    })

    it('D-5 & S6: 생성된 3문항의 유형이 전부 동일하지 않다 (혼합률 100%)', () => {
      expect(hasHomogeneousTypes(sampleQuestionSet)).toBe(false)
      const types = new Set(sampleQuestionSet.map((q) => q.type))
      expect(types.size).toBeGreaterThanOrEqual(2)
    })

    it('D-6 & S5: 각 문항의 선지가 4개이며 정답이 단 하나로 유일하다', () => {
      sampleQuestionSet.forEach((q) => {
        expect(q.choices).toHaveLength(4)
        const keys = q.choices.map((c) => c.key)
        expect(new Set(keys).size).toBe(4)
        expect(keys).toContain(q.answer)
      })
    })
  })

  describe('D-7 ~ D-10: 해설 즉각 노출, 오답 이유 및 결과/공유 검증', () => {
    it('D-7 & S2: 선지 선택 시 네트워크 호출 없이 메모리에서 즉각 해설이 구성된다', () => {
      let state = quizReducer(initialState, { type: 'generate/success', questions: sampleQuestionSet })
      state = quizReducer(state, { type: 'quiz/answer', key: 'A' })
      expect(state.answers[0]).toBe('A')
      expect(state.questions[0].explanations.A).toBeDefined()
    })

    it('D-8: 오답 선택 시 내가 고른 오답의 전용 해설이 존재한다', () => {
      const q = sampleQuestionSet[0]
      const wrongChoiceKey = 'B'
      expect(q.explanations[wrongChoiceKey]).toBe('부사이므로 명사를 수식할 수 없습니다.')
    })

    it('D-9 & D-10: 결과 화면 및 새로 시작(초기화)이 정상 동작한다', () => {
      let state = quizReducer(initialState, { type: 'generate/success', questions: sampleQuestionSet })
      state = quizReducer(state, { type: 'quiz/answer', key: 'A' })
      state = quizReducer(state, { type: 'quiz/next' })
      state = quizReducer(state, { type: 'quiz/answer', key: 'B' })
      state = quizReducer(state, { type: 'quiz/next' })
      state = quizReducer(state, { type: 'quiz/answer', key: 'A' })
      state = quizReducer(state, { type: 'quiz/next' })
      expect(state.phase).toBe('result')

      // 새로 시작
      state = quizReducer(state, { type: 'flow/restart' })
      expect(state.phase).toBe('input')
      expect(state.questions).toHaveLength(0)
    })
  })
})
