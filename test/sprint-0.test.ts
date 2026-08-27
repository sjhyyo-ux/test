import { describe, expect, it } from 'vitest'
import { parseWords, MAX_WORDS } from '@/lib/parse-words'
import { getWordStem } from '@/lib/validator'

describe('Sprint 0: 단어 파싱 및 어간 추출 검증', () => {
  describe('EX-1: 빈 입력 검증', () => {
    it('빈 문자열 입력 시 isEmpty가 true여야 한다', () => {
      const res = parseWords('')
      expect(res.isEmpty).toBe(true)
      expect(res.used).toHaveLength(0)
    })

    it('공백만 입력 시 isEmpty가 true여야 한다', () => {
      const res = parseWords('   ')
      expect(res.isEmpty).toBe(true)
      expect(res.used).toHaveLength(0)
    })

    it('쉼표만 입력 시 isEmpty가 true여야 한다', () => {
      const res = parseWords(',,,')
      expect(res.isEmpty).toBe(true)
      expect(res.used).toHaveLength(0)
    })

    it('공백과 쉼표 조합 입력 시 isEmpty가 true여야 한다', () => {
      const res = parseWords(' ,  , , ')
      expect(res.isEmpty).toBe(true)
      expect(res.used).toHaveLength(0)
    })
  })

  describe('EX-3: 허용 문자 및 비영어 필터링 검증', () => {
    it('영문 단어를 정상 인식해야 한다', () => {
      const res = parseWords('comprehensive, accurate')
      expect(res.used).toEqual(['comprehensive', 'accurate'])
      expect(res.excluded).toHaveLength(0)
    })

    it('하이픈(-), 어퍼스트로피(\'), 내부 공백(구동사)을 정상 허용해야 한다', () => {
      const res = parseWords('state-of-the-art, client\'s, look forward to')
      expect(res.used).toEqual(['state-of-the-art', "client's", 'look forward to'])
      expect(res.excluded).toHaveLength(0)
    })

    it('한글 단어를 제외(excluded)해야 한다', () => {
      const res = parseWords('사과, comprehensive')
      expect(res.used).toEqual(['comprehensive'])
      expect(res.excluded).toEqual(['사과'])
    })

    it('숫자가 포함된 단어를 제외해야 한다', () => {
      const res = parseWords('abc123, word')
      expect(res.used).toEqual(['word'])
      expect(res.excluded).toEqual(['abc123'])
    })

    it('이모지가 포함된 단어를 제외해야 한다', () => {
      const res = parseWords('😀, test')
      expect(res.used).toEqual(['test'])
      expect(res.excluded).toEqual(['😀'])
    })

    it('특수문자만 있는 단어를 제외해야 한다', () => {
      const res = parseWords('!!!, @@, success')
      expect(res.used).toEqual(['success'])
      expect(res.excluded).toEqual(['!!!', '@@'])
    })

    it('전부 비영어인 경우 used가 비어있어야 한다', () => {
      const res = parseWords('사과, 바나나, 1234')
      expect(res.used).toHaveLength(0)
      expect(res.excluded).toEqual(['사과', '바나나', '1234'])
    })
  })

  describe('F-1 & EX-12: 중복 제거 및 5개 초과 절삭 검증', () => {
    it('대소문자 무시하고 중복 단어를 제거해야 한다', () => {
      const res = parseWords('apple, Apple, APPLE, banana')
      expect(res.used).toEqual(['apple', 'banana'])
      expect(res.duplicates).toEqual(['Apple', 'APPLE'])
    })

    it('5개 초과 입력 시 앞의 5개만 used로 들어가고 나머지는 truncated로 분류되어야 한다', () => {
      const res = parseWords('wordone, wordtwo, wordthree, wordfour, wordfive, wordsix, wordseven')
      expect(res.used).toHaveLength(MAX_WORDS)
      expect(res.used).toEqual(['wordone', 'wordtwo', 'wordthree', 'wordfour', 'wordfive'])
      expect(res.truncated).toEqual(['wordsix', 'wordseven'])
    })
  })

  describe('어간 추출(getWordStem) 검증', () => {
    it('4글자 이하 단어는 그대로 반환해야 한다', () => {
      expect(getWordStem('plan')).toBe('plan')
      expect(getWordStem('run')).toBe('run')
    })

    it('5글자 이상 단어는 앞 5글자를 소문자로 반환해야 한다', () => {
      expect(getWordStem('Comprehensive')).toBe('compr')
      expect(getWordStem('Implementation')).toBe('imple')
      expect(getWordStem('significantly')).toBe('signi')
    })
  })
})
