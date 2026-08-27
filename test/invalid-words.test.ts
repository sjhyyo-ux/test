import { describe, expect, it } from 'vitest'
import { isPlausibleEnglishWord, parseWords } from '@/lib/parse-words'
import { ERROR_MESSAGE, initialState, quizReducer } from '@/lib/quiz-reducer'

describe('단어 유효성 검사 및 가짜 단어 차단 가드레일', () => {
  describe('isPlausibleEnglishWord 휴리스틱 검사', () => {
    it('실제 영어 단어들은 유효하다고 판정해야 한다', () => {
      const validWords = [
        'comprehensive',
        'implement',
        'despite',
        'state-of-the-art',
        "client's",
        'look forward to',
        'a',
        'I',
        'sky',
        'rhythm',
      ]
      for (const word of validWords) {
        expect(isPlausibleEnglishWord(word)).toBe(true)
      }
    })

    it('자음만 있는 무작위 난타 문자열(asdf, qwrty, zzzz 등)은 무효 처리해야 한다', () => {
      const gibberishWords = [
        'asdf',
        'qwrty',
        'zzzz',
        'bcdfgh',
        'sdfghj',
        'qwer',
        'hjkl',
      ]
      for (const word of gibberishWords) {
        expect(isPlausibleEnglishWord(word)).toBe(false)
      }
    })

    it('동일 문자 3회 이상 연속 단어는 무효 처리해야 한다', () => {
      expect(isPlausibleEnglishWord('aaaa')).toBe(false)
      expect(isPlausibleEnglishWord('zzzz')).toBe(false)
      expect(isPlausibleEnglishWord('gooddd')).toBe(false)
    })

    it('a, i 외의 1글자 단어는 무효 처리해야 한다', () => {
      expect(isPlausibleEnglishWord('b')).toBe(false)
      expect(isPlausibleEnglishWord('z')).toBe(false)
      expect(isPlausibleEnglishWord('x')).toBe(false)
    })
  })

  describe('parseWords 통합 동작', () => {
    it('가짜 단어가 입력되면 excluded로 분류되고 used에서 제외되어야 한다', () => {
      const parsed = parseWords('asdfgh, comprehensive, qwrty')
      expect(parsed.used).toEqual(['comprehensive'])
      expect(parsed.excluded).toEqual(['asdfgh', 'qwrty'])
    })

    it('모든 입력 단어가 가짜 단어인 경우 used는 비어있고 호출이 차단되어야 한다', () => {
      const parsed = parseWords('asdfgh, qwrty, zzzzz')
      expect(parsed.used).toHaveLength(0)
      expect(parsed.excluded).toEqual(['asdfgh', 'qwrty', 'zzzzz'])
    })
  })

  describe('AI 무효 단어 에러 상태 처리 (invalid_word)', () => {
    it('invalid_word 오류 발생 시 적절한 사용자 메시지를 표시하고 입력을 수정할 수 있어야 한다', () => {
      const errorState = quizReducer(initialState, { type: 'generate/fail', kind: 'invalid_word' })
      expect(errorState.phase).toBe('error')
      expect(errorState.errorKind).toBe('invalid_word')
      expect(ERROR_MESSAGE.invalid_word).toBe(
        '입력하신 단어 중 실제 영단어가 아닌 단어가 있어요. 단어를 확인해 주세요.',
      )

      const editState = quizReducer(errorState, { type: 'error/edit' })
      expect(editState.phase).toBe('input')
    })
  })
})
