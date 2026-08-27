import { describe, expect, it } from 'vitest'
import { findLexiconQuestions, LEXICON_QUESTIONS } from '@/lib/lexicon-database'
import { validateQuestionQuality } from '@/lib/validator'

describe('Sprint 5: 하이브리드 문제은행 (Lexicon Cache) 및 0ms 캐시 라우팅 검증', () => {
  it('사전 검증된 문제은행(LEXICON_QUESTIONS)의 모든 문항은 7대 정적 가드레일을 100% 통과해야 한다', () => {
    const allWords = Object.keys(LEXICON_QUESTIONS)
    expect(allWords.length).toBeGreaterThanOrEqual(10)

    for (const word of allWords) {
      const questions = LEXICON_QUESTIONS[word]
      for (const q of questions) {
        const quality = validateQuestionQuality(q, [word])
        expect(quality.isValid, `단어 ${word}의 문제 검증 실패: ${quality.reason}`).toBe(true)
      }
    }
  })

  it('타깃 단어 검색(findLexiconQuestions)이 정확히 매칭되어 반환되어야 한다', () => {
    const matched = findLexiconQuestions(['compensate', 'compliance', 'despite'])
    expect(matched).toHaveLength(3)
    expect(matched[0].targetWord).toBe('compensate')
    expect(matched[1].targetWord).toBe('compliance')
    expect(matched[2].targetWord).toBe('despite')
  })

  it('중복 단어 입력 시 중복 없이 단일 문제만 반환되어야 한다', () => {
    const matched = findLexiconQuestions(['compensate', 'compensate', 'COMPENSATE'])
    expect(matched).toHaveLength(1)
  })

  it('문제은행에 없는 단어는 빈 배열로 반환되어 AI 실시간 생성 파이프라인으로 포워딩되어야 한다', () => {
    const matched = findLexiconQuestions(['unregistered_word_xyz'])
    expect(matched).toHaveLength(0)
  })
})
