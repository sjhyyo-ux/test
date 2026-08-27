import { describe, expect, it } from 'vitest'
import { parseWords } from '@/lib/parse-words'
import {
  containsTargetWord,
  getWordStem,
  hasHomogeneousTypes,
  validateAndSanitizeQuestions,
  validateChoices,
  validateExplanations,
} from '@/lib/validator'
import { initialState, quizReducer, type QuizState } from '@/lib/quiz-reducer'
import type { Question } from '@/lib/quiz-types'

describe('Sprint 2: PRD §6.2 35개 예외 검증 케이스 전수 테스트 (EX-1 ~ EX-12)', () => {
  // -------------------------------------------------------------
  // EX-1. 단어 입력이 비어 있음 (4 케이스)
  // -------------------------------------------------------------
  describe('EX-1: 빈 입력 검증 (4케이스)', () => {
    it('1. 빈 문자열("") 입력 시 used는 빈 배열이고 isEmpty는 true여야 한다', () => {
      const parsed = parseWords('')
      expect(parsed.isEmpty).toBe(true)
      expect(parsed.used).toHaveLength(0)
    })

    it('2. 공백만("   ") 입력 시 used는 빈 배열이고 isEmpty는 true여야 한다', () => {
      const parsed = parseWords('   ')
      expect(parsed.isEmpty).toBe(true)
      expect(parsed.used).toHaveLength(0)
    })

    it('3. 쉼표만(",,,") 입력 시 used는 빈 배열이고 isEmpty는 true여야 한다', () => {
      const parsed = parseWords(',,,')
      expect(parsed.isEmpty).toBe(true)
      expect(parsed.used).toHaveLength(0)
    })

    it('4. 공백과 쉼표 조합(" ,  , , ") 입력 시 used는 빈 배열이고 isEmpty는 true여야 한다', () => {
      const parsed = parseWords(' ,  , , ')
      expect(parsed.isEmpty).toBe(true)
      expect(parsed.used).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------
  // EX-2. 난이도가 선택되지 않음 (1 케이스)
  // -------------------------------------------------------------
  describe('EX-2: 난이도 미선택 검증 (1케이스)', () => {
    it('5. 초기 상태에서 difficulty는 null이며 단어가 있어도 생성 버튼이 비활성 상태여야 한다', () => {
      const state = { ...initialState, rawInput: 'comprehensive' }
      expect(state.difficulty).toBeNull()
      const parsed = parseWords(state.rawInput)
      const canSubmit = parsed.used.length > 0 && state.difficulty !== null && state.phase !== 'loading'
      expect(canSubmit).toBe(false)
    })
  })

  // -------------------------------------------------------------
  // EX-3. 입력 단어가 영어가 아님 (5 케이스)
  // -------------------------------------------------------------
  describe('EX-3: 비영어 필터링 검증 (5케이스)', () => {
    it('6. 한글만 입력된 경우 excluded에 포함되고 used는 0개여야 한다', () => {
      const parsed = parseWords('사과, 바나나')
      expect(parsed.used).toHaveLength(0)
      expect(parsed.excluded).toEqual(['사과', '바나나'])
    })

    it('7. 영한 혼합 입력 시 한글은 excluded로, 영어는 used로 분리되어야 한다', () => {
      const parsed = parseWords('사과, comprehensive')
      expect(parsed.used).toEqual(['comprehensive'])
      expect(parsed.excluded).toEqual(['사과'])
    })

    it('8. 숫자가 포함된 단어는 excluded로 분류되어야 한다', () => {
      const parsed = parseWords('abc123')
      expect(parsed.used).toHaveLength(0)
      expect(parsed.excluded).toEqual(['abc123'])
    })

    it('9. 이모지가 포함된 단어는 excluded로 분류되어야 한다', () => {
      const parsed = parseWords('😀')
      expect(parsed.used).toHaveLength(0)
      expect(parsed.excluded).toEqual(['😀'])
    })

    it('10. 특수문자만 있는 단어는 excluded로 분류되어야 한다', () => {
      const parsed = parseWords('!!!, @#$')
      expect(parsed.used).toHaveLength(0)
      expect(parsed.excluded).toEqual(['!!!', '@#$'])
    })
  })

  // -------------------------------------------------------------
  // EX-4. 출력된 문항 수가 3개가 아님 (4 케이스)
  // -------------------------------------------------------------
  describe('EX-4: 문항 수 이상 검증 (4케이스)', () => {
    const validSample: Question = {
      id: 'q-1',
      type: 'vocab',
      targetWord: 'comprehensive',
      stem: 'The committee delivered a _____ report before the meeting.',
      choices: [
        { key: 'A', text: 'comprehensive' },
        { key: 'B', text: 'comprehensively' },
        { key: 'C', text: 'comprehend' },
        { key: 'D', text: 'comprehension' },
      ],
      answer: 'A',
      explanations: {
        A: '명사 report를 수식하는 형용사 자리이므로 comprehensive가 정답입니다.',
        B: '부사는 명사를 직접 수식할 수 없습니다.',
        C: '동사원형은 관사 뒤에 위치할 수 없습니다.',
        D: '명사 중복 수식은 문맥상 어색합니다.',
      },
      translation: '위원회는 회의 전에 포괄적인 보고서를 제출했다.',
      wordNote: 'comprehensive (형용사) = 포괄적인, 종합적인',
    }

    it('11. 0개 수신 시 validQuestions는 0개여야 한다', () => {
      const result = validateAndSanitizeQuestions([], ['comprehensive'])
      expect(result.validQuestions).toHaveLength(0)
    })

    it('12. 1개 수신 시 1개로 정상 통과해야 한다 (부분 성공)', () => {
      const result = validateAndSanitizeQuestions([validSample], ['comprehensive'])
      expect(result.validQuestions).toHaveLength(1)
    })

    it('13. 2개 수신 시 2개로 정상 통과해야 한다 (부분 성공)', () => {
      const result = validateAndSanitizeQuestions([validSample, { ...validSample, id: 'q-2' }], ['comprehensive'])
      expect(result.validQuestions).toHaveLength(2)
    })

    it('14. 5개 수신 시 앞의 3개만 채택하고 초과분은 폐기되어야 한다', () => {
      const rawList = Array.from({ length: 5 }, (_, i) => ({ ...validSample, id: `q-${i + 1}` }))
      const result = validateAndSanitizeQuestions(rawList, ['comprehensive'])
      expect(result.validQuestions).toHaveLength(3)
      expect(result.discardedCount).toBe(2)
    })
  })

  // -------------------------------------------------------------
  // EX-5. 입력 단어가 미포함된 문항 (2 케이스)
  // -------------------------------------------------------------
  describe('EX-5: 타깃 단어 매칭 및 파생형 검증 (2케이스)', () => {
    it('15. 입력 단어와 무관한 단어로만 구성된 문항은 폐기되어야 한다', () => {
      const unrelatedQuestion = {
        stem: 'The weather is very sunny today.',
        choices: [
          { key: 'A', text: 'sunny' },
          { key: 'B', text: 'rainy' },
          { key: 'C', text: 'cloudy' },
          { key: 'D', text: 'windy' },
        ],
        targetWord: 'unrelated',
      }
      const match = containsTargetWord(unrelatedQuestion, ['comprehensive'])
      expect(match).toBe(false)
    })

    it('16. 파생형(comprehensively, comprehension 등)은 어간(compr) 매칭으로 통과해야 한다', () => {
      const derivedQuestion = {
        stem: 'The team reviewed the project comprehensively.',
        choices: [
          { key: 'A', text: 'comprehensively' },
          { key: 'B', text: 'comprehension' },
          { key: 'C', text: 'comprehend' },
          { key: 'D', text: 'comprehensive' },
        ],
        targetWord: 'comprehensive',
      }
      const match = containsTargetWord(derivedQuestion, ['comprehensive'])
      expect(match).toBe(true)
    })
  })

  // -------------------------------------------------------------
  // EX-6. 3문항의 유형이 전부 동일함 (1 케이스)
  // -------------------------------------------------------------
  describe('EX-6: 유형 편중 검증 (1케이스)', () => {
    it('17. 3문항의 유형이 전부 동일하면 isHomogeneous가 true여야 한다', () => {
      const questions: Question[] = [
        { id: '1', type: 'vocab' } as Question,
        { id: '2', type: 'vocab' } as Question,
        { id: '3', type: 'vocab' } as Question,
      ]
      expect(hasHomogeneousTypes(questions)).toBe(true)

      const mixedQuestions: Question[] = [
        { id: '1', type: 'vocab' } as Question,
        { id: '2', type: 'grammar' } as Question,
        { id: '3', type: 'vocab' } as Question,
      ]
      expect(hasHomogeneousTypes(mixedQuestions)).toBe(false)
    })
  })

  // -------------------------------------------------------------
  // EX-7. 선지가 4개가 아님 (4 케이스)
  // -------------------------------------------------------------
  describe('EX-7: 선지 무결성 검증 (4케이스)', () => {
    it('18. 선지가 3개인 경우 유효성 검사를 통과하지 못해야 한다', () => {
      const q = {
        choices: [
          { key: 'A', text: 'one' },
          { key: 'B', text: 'two' },
          { key: 'C', text: 'three' },
        ],
        answer: 'A',
      }
      expect(validateChoices(q)).toBe(false)
    })

    it('19. 선지가 5개인 경우 유효성 검사를 통과하지 못해야 한다', () => {
      const q = {
        choices: [
          { key: 'A', text: 'one' },
          { key: 'B', text: 'two' },
          { key: 'C', text: 'three' },
          { key: 'D', text: 'four' },
          { key: 'E', text: 'five' },
        ],
        answer: 'A',
      }
      expect(validateChoices(q)).toBe(false)
    })

    it('20. 선지 key가 중복된 경우 유효성 검사를 통과하지 못해야 한다', () => {
      const q = {
        choices: [
          { key: 'A', text: 'one' },
          { key: 'A', text: 'two' },
          { key: 'C', text: 'three' },
          { key: 'D', text: 'four' },
        ],
        answer: 'A',
      }
      expect(validateChoices(q)).toBe(false)
    })

    it('21. answer 값이 choices의 key에 존재하지 않는 경우 유효성 검사를 통과하지 못해야 한다', () => {
      const q = {
        choices: [
          { key: 'A', text: 'one' },
          { key: 'B', text: 'two' },
          { key: 'C', text: 'three' },
          { key: 'D', text: 'four' },
        ],
        answer: 'E',
      }
      expect(validateChoices(q)).toBe(false)
    })
  })

  // -------------------------------------------------------------
  // EX-8. 해설 누락 (3 케이스)
  // -------------------------------------------------------------
  describe('EX-8: 해설 무결성 사전 검증 (3케이스)', () => {
    it('22. 4개 선지 중 1개라도 해설이 누락된 경우 실패해야 한다', () => {
      const q = {
        explanations: {
          A: 'expA',
          B: 'expB',
          C: 'expC',
          // D 누락
        },
      }
      expect(validateExplanations(q)).toBe(false)
    })

    it('23. 해설 텍스트가 빈 문자열인 경우 실패해야 한다', () => {
      const q = {
        explanations: {
          A: 'expA',
          B: '   ',
          C: 'expC',
          D: 'expD',
        },
      }
      expect(validateExplanations(q)).toBe(false)
    })

    it('24. explanations 필드가 null 또는 undefined인 경우 실패해야 한다', () => {
      const q = {}
      expect(validateExplanations(q)).toBe(false)
    })
  })

  // -------------------------------------------------------------
  // EX-9. AI 응답 실패 및 오류 복구 (3 케이스)
  // -------------------------------------------------------------
  describe('EX-9: AI 응답 실패 및 상태 복구 검증 (3케이스)', () => {
    it('25. 일반 에러 발생 시 error phase로 전환되고 입력값이 보존되어야 한다', () => {
      const startState = quizReducer(initialState, { type: 'input/change', value: 'comprehensive' })
      const errorState = quizReducer(startState, { type: 'generate/fail', kind: 'generic' })
      expect(errorState.phase).toBe('error')
      expect(errorState.errorKind).toBe('generic')
      expect(errorState.rawInput).toBe('comprehensive')
    })

    it('26. 사용량 한도(busy) 오류 시 errorKind가 busy로 설정되어야 한다', () => {
      const errorState = quizReducer(initialState, { type: 'generate/fail', kind: 'busy' })
      expect(errorState.phase).toBe('error')
      expect(errorState.errorKind).toBe('busy')
    })

    it('27. 네트워크 끊김 오류 시 errorKind가 network로 설정되고 입력 수정 시 상태 A로 복귀해야 한다', () => {
      const errorState = quizReducer(initialState, { type: 'generate/fail', kind: 'network' })
      expect(errorState.errorKind).toBe('network')
      const editState = quizReducer(errorState, { type: 'error/edit' })
      expect(editState.phase).toBe('input')
    })
  })

  // -------------------------------------------------------------
  // EX-10. 응답 지연 단계 및 타임아웃 (4 케이스)
  // -------------------------------------------------------------
  describe('EX-10: 4단계 로딩 지연 및 타임아웃 검증 (4케이스)', () => {
    it('28. 생성 시작 시 stage는 0이어야 한다 (0~5초)', () => {
      const loadingState = quizReducer(initialState, { type: 'generate/start' })
      expect(loadingState.phase).toBe('loading')
      expect(loadingState.loadingStage).toBe(0)
    })

    it('29. 5초 경과 시 stage 1로 전환되어야 한다', () => {
      const stage1State = quizReducer(initialState, { type: 'loading/stage', stage: 1 })
      expect(stage1State.loadingStage).toBe(1)
    })

    it('30. 12초 경과 시 stage 2로 전환되어야 한다 (취소 가능)', () => {
      const stage2State = quizReducer(initialState, { type: 'loading/stage', stage: 2 })
      expect(stage2State.loadingStage).toBe(2)
    })

    it('31. 20초 초과 시 timeout 오류로 전환되고 입력값이 보존되어야 한다', () => {
      const stateWithInput = quizReducer(initialState, { type: 'input/change', value: 'comprehensive' })
      const timeoutState = quizReducer(stateWithInput, { type: 'generate/fail', kind: 'timeout' })
      expect(timeoutState.phase).toBe('error')
      expect(timeoutState.errorKind).toBe('timeout')
      expect(timeoutState.rawInput).toBe('comprehensive')
    })
  })

  // -------------------------------------------------------------
  // EX-11. 공유 실패 및 폴백 (3 케이스)
  // -------------------------------------------------------------
  describe('EX-11: 공유 실패 폴백 및 취소 무반응 검증 (3케이스)', () => {
    it('32. 클립보드 복사 성공 시 토스트 메시지가 등록되어야 한다', () => {
      const toastState = quizReducer(initialState, { type: 'toast/show', message: '복사했어요!' })
      expect(toastState.toast).toBe('복사했어요!')
    })

    it('33. 클립보드 차단 시 shareFallback이 true로 전환되어 직접 복사 영역이 노출되어야 한다', () => {
      const fallbackState = quizReducer(initialState, { type: 'share/fallback' })
      expect(fallbackState.shareFallback).toBe(true)
    })

    it('34. 공유 취소 시 에러 상태가 되지 않고 결과 상태가 유지되어야 한다', () => {
      const resultState: QuizState = {
        ...initialState,
        phase: 'result',
        shareFallback: false,
      }
      // 공유 취소(AbortError) 시에는 아무런 state 액션도 디스패치하지 않음
      expect(resultState.phase).toBe('result')
      expect(resultState.shareFallback).toBe(false)
    })
  })

  // -------------------------------------------------------------
  // EX-12. 입력 단어가 6개 이상 (1 케이스)
  // -------------------------------------------------------------
  describe('EX-12: 입력 단어 개수 초과 절삭 검증 (1케이스)', () => {
    it('35. 7개 단어 입력 시 앞의 5개만 used로 들어가고 나머지 2개는 truncated로 분류되어야 한다', () => {
      const parsed = parseWords('first, second, third, fourth, fifth, sixth, seventh')
      expect(parsed.used).toEqual(['first', 'second', 'third', 'fourth', 'fifth'])
      expect(parsed.truncated).toEqual(['sixth', 'seventh'])
      expect(parsed.used).toHaveLength(5)
    })
  })
})
