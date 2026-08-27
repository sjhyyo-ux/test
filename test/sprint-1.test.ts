import { describe, expect, it } from 'vitest'
import { validateAndSanitizeQuestions } from '@/lib/validator'

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  return cleaned.trim()
}

describe('Sprint 1: AI 응답 파싱 및 생성 파이프라인 검증', () => {
  describe('마크다운 코드펜스 제거 (stripMarkdownFences)', () => {
    it('```json ... ``` 형태의 마크다운 블록을 순수 JSON으로 추출해야 한다', () => {
      const raw = '```json\n[{"id":"q-1","stem":"test"}]\n```'
      const cleaned = stripMarkdownFences(raw)
      expect(cleaned).toBe('[{"id":"q-1","stem":"test"}]')
      expect(JSON.parse(cleaned)).toEqual([{ id: 'q-1', stem: 'test' }])
    })

    it('``` ... ``` 형태의 마크다운 블록도 정상 처리해야 한다', () => {
      const raw = '```\n[{"id":"q-2"}]\n```'
      const cleaned = stripMarkdownFences(raw)
      expect(cleaned).toBe('[{"id":"q-2"}]')
    })

    it('마크다운 블록이 없는 순수 JSON 문자열도 정상 처리해야 한다', () => {
      const raw = '  [{"id":"q-3"}]  '
      const cleaned = stripMarkdownFences(raw)
      expect(cleaned).toBe('[{"id":"q-3"}]')
    })
  })

  describe('F-3 & F-4: 생성된 데이터 스키마 및 유형 혼합 검증', () => {
    it('정상적인 3문항(유형 혼합) 응답을 검증 및 통과시켜야 한다', () => {
      const mockAiResponse = [
        {
          id: 'q-1',
          type: 'vocab',
          targetWord: 'comprehensive',
          stem: 'The report provides a _____ overview of the financial results.',
          choices: [
            { key: 'A', text: 'comprehensive' },
            { key: 'B', text: 'comprehensively' },
            { key: 'C', text: 'comprehend' },
            { key: 'D', text: 'comprehension' },
          ],
          answer: 'A',
          explanations: {
            A: '형용사 자리로 overview를 수식하므로 comprehensive가 정답입니다.',
            B: '부사이므로 명사를 직접 수식할 수 없습니다.',
            C: '동사원형은 관사 a 뒤에 올 수 없습니다.',
            D: '명사이지만 문맥상 "포괄적인 개요"라는 형용사가 적절합니다.',
          },
          translation: '그 보고서는 재무 결과에 대한 포괄적인 개요를 제공한다.',
          wordNote: 'comprehensive = 포괄적인, 종합적인',
        },
        {
          id: 'q-2',
          type: 'grammar',
          targetWord: 'implement',
          stem: 'The new safety guidelines were _____ across all branches yesterday.',
          choices: [
            { key: 'A', text: 'implemented' },
            { key: 'B', text: 'implementation' },
            { key: 'C', text: 'implementing' },
            { key: 'D', text: 'implement' },
          ],
          answer: 'A',
          explanations: {
            A: '수동태 were + p.p. 구조가 되어야 하므로 implemented가 정답입니다.',
            B: '명사이므로 be동사 뒤에서 수동 의미를 형성할 수 없습니다.',
            C: '능동 진행형은 목적어가 필요합니다.',
            D: '동사원형은 were 뒤에 직접 올 수 없습니다.',
          },
          translation: '새로운 안전 지침이 어제 전 지점에 시행되었다.',
          wordNote: 'implement = 시행하다, 실행하다',
        },
        {
          id: 'q-3',
          type: 'prep_conj',
          targetWord: 'despite',
          stem: '_____ heavy rain, the outdoor promotional event proceeded as planned.',
          choices: [
            { key: 'A', text: 'Despite' },
            { key: 'B', text: 'Although' },
            { key: 'C', text: 'Even though' },
            { key: 'D', text: 'While' },
          ],
          answer: 'A',
          explanations: {
            A: '뒤에 명사구(heavy rain)가 오므로 양보의 전치사 Despite가 정답입니다.',
            B: 'Although는 접속사이므로 뒤에 주어+동사 절이 와야 합니다.',
            C: 'Even though는 접속사이므로 명사구를 바로 이끌 수 없습니다.',
            D: 'While은 대조를 나타내는 접속사로 명사구 앞에 쓸 수 없습니다.',
          },
          translation: '폭우에도 불구하고, 야외 홍보 행사는 계획대로 진행되었다.',
          wordNote: 'despite + 명사구 = ~에도 불구하고 (Part 5 빈출 전치사)',
        },
      ]

      const result = validateAndSanitizeQuestions(mockAiResponse, [
        'comprehensive',
        'implement',
        'despite',
      ])

      expect(result.validQuestions).toHaveLength(3)
      expect(result.discardedCount).toBe(0)
      expect(result.isHomogeneous).toBe(false)
      expect(result.validQuestions[0].type).toBe('vocab')
      expect(result.validQuestions[1].type).toBe('grammar')
      expect(result.validQuestions[2].type).toBe('prep_conj')
    })
  })
})
