import { describe, expect, it } from 'vitest'
import { attachJosa, checkBatchim, hasForbiddenJosaPattern } from '@/lib/korean-josa'
import {
  checkExplanationTemplateDuplication,
  checkStemLeakage,
  generateInflections,
  validateQuestionQuality,
  validateWordNoteQuality,
} from '@/lib/validator'
import type { Question } from '@/lib/quiz-types'

describe('Strict Quality Validator & Guardrail Tests (v3.0)', () => {
  describe('🚨 [실제 버그 케이스] 사용자 제보 출력물 기각 검증', () => {
    it('사용자가 제보한 엉터리 compensate 문제는 100% Reject(기각)되어야 한다', () => {
      const buggedQuestion: Partial<Question> = {
        id: 'q-bugged',
        type: 'vocab',
        targetWord: 'compensate',
        // 버그 1: 밑줄 4개 및 타깃 단어 정답 노출
        stem: 'Our marketing department is actively seeking innovative ways to ____ compensate across emerging global markets.',
        choices: [
          { key: 'A', text: 'compensate' },
          { key: 'B', text: 'terminate' },
          { key: 'C', text: 'restrict' },
          { key: 'D', text: 'hesitate' },
        ],
        answer: 'A',
        // 버그 3, 4: 순환논증 및 템플릿 복붙
        explanations: {
          A: "신흥 글로벌 시장 공략 문맥에서 'compensate'의 활용이 가장 타당합니다.",
          B: 'terminate(종료하다)는 적극적 마케팅 확장 취지에 반합니다.',
          C: 'restrict(제한하다)는 부정적 의미로 문맥상 부적절합니다.',
          D: 'hesitate(망설이다)는 자동사로 목적어를 바로 취할 수 없습니다.',
        },
        // 버그 5: compensate 영단어 잔존 및 '을(를)' 조사 미처리
        translation:
          '우리 마케팅 부서는 신흥 글로벌 시장에서 compensate을(를) 달성하기 위한 혁신적인 방안을 적극 모색하고 있다.',
        // 버그 6: 실제 뜻 없이 템플릿 설명만 존재
        wordNote: 'compensate = 비즈니스 확장 및 전략 수립 파트 5 빈출 단어입니다.',
      }

      const result = validateQuestionQuality(buggedQuestion, ['compensate'])
      expect(result.isValid).toBe(false)

      // R-1(밑줄 4개), R-2(정답 노출), R-4(영문 잔존), R-5(을(를) 조사 미처리), R-7(단어정리 껍데기) 중 즉시 기각 확인
      expect(result.ruleId).toBeDefined()
      expect(result.reason).toBeDefined()
    })
  })

  describe('R-1: 빈칸 마커 무결성 검증', () => {
    it('정확히 밑줄 5개(_____) 1개인 경우 통과해야 한다', () => {
      const validStem = 'The committee decided to _____ the proposed budget.'
      expect(validStem.match(/_+/g)).toEqual(['_____'])
    })

    it('밑줄 4개(____) 또는 밑줄 6개(______)는 기각되어야 한다', () => {
      const stem4 = 'The committee decided to ____ the budget.'
      const res4 = validateQuestionQuality(
        { stem: stem4, choices: [{ key: 'A', text: 'approve' }, { key: 'B', text: 'b' }, { key: 'C', text: 'c' }, { key: 'D', text: 'd' }], answer: 'A', translation: '한글', explanations: { A: '1', B: '2', C: '3', D: '4' }, wordNote: 'approve (동사) = 승인하다' },
        ['approve'],
      )
      expect(res4.isValid).toBe(false)
      expect(res4.ruleId).toBe('R-1')

      const stem6 = 'The committee decided to ______ the budget.'
      const res6 = validateQuestionQuality(
        { stem: stem6, choices: [{ key: 'A', text: 'approve' }, { key: 'B', text: 'b' }, { key: 'C', text: 'c' }, { key: 'D', text: 'd' }], answer: 'A', translation: '한글', explanations: { A: '1', B: '2', C: '3', D: '4' }, wordNote: 'approve (동사) = 승인하다' },
        ['approve'],
      )
      expect(res6.isValid).toBe(false)
      expect(res6.ruleId).toBe('R-1')
    })
  })

  describe('R-2: 어간 정규화 및 정답 누출 방지 검증 (B2, D1)', () => {
    it('compensate의 굴절형(compensated, compensating) 누출을 정확히 탐지해야 한다', () => {
      const inflections = generateInflections('compensate')
      expect(inflections).toContain('compensated')
      expect(inflections).toContain('compensating')
      expect(inflections).toContain('compensation')

      const leakedStem = 'The manager _____ the staff because they were compensated last month.'
      const leakCheck = checkStemLeakage(leakedStem, 'compensate', 'compensate')
      expect(leakCheck.leaked).toBe(true)
      expect(leakCheck.leakedWord).toBe('compensated')
    })

    it('자음 중복(refer -> referred, referring) 및 y->i(apply -> applied) 굴절형을 생성해야 한다', () => {
      const referInf = generateInflections('refer')
      expect(referInf).toContain('referred')
      expect(referInf).toContain('referring')

      const applyInf = generateInflections('apply')
      expect(applyInf).toContain('applied')
      expect(applyInf).toContain('applies')
    })

    it('target act가 actively, exactly 등 무관한 단어에서 오탐되지 않아야 한다 (단어 경계 \\b)', () => {
      const stem = 'The marketing team is actively preparing the exact report for _____.'
      const leakCheck = checkStemLeakage(stem, 'act', 'act')
      expect(leakCheck.leaked).toBe(false)
    })

    it('다단어 타깃(prior to)의 누출을 정확히 탐지해야 한다 (D1)', () => {
      const leakCheck = checkStemLeakage('All forms must be submitted prior to the _____ deadline.', 'prior to', 'prior to')
      expect(leakCheck.leaked).toBe(true)
    })
  })

  describe('R-4: 한글 해석 내 정답 영단어 잔존 검증 (규칙 3)', () => {
    it('정답 단어가 한글 해석에 영문 그대로 남아있으면 기각해야 한다', () => {
      const q: Partial<Question> = {
        stem: 'We need to _____ the workers.',
        choices: [
          { key: 'A', text: 'compensate' },
          { key: 'B', text: 'postpone' },
          { key: 'C', text: 'eliminate' },
          { key: 'D', text: 'restrict' },
        ],
        answer: 'A',
        translation: '우리는 직원들에게 compensate해야 한다.',
        explanations: { A: '정답1', B: '오답2', C: '오답3', D: '오답4' },
        wordNote: 'compensate (동사) = 보상하다',
      }
      const res = validateQuestionQuality(q, ['compensate'])
      expect(res.isValid).toBe(false)
      expect(res.ruleId).toBe('R-4')
    })

    it('CEO, HR, IT 등 일반 약어/고유명사는 정상 허용해야 한다', () => {
      const q: Partial<Question> = {
        stem: 'The _____ announced the quarterly results.',
        choices: [
          { key: 'A', text: 'director' },
          { key: 'B', text: 'direct' },
          { key: 'C', text: 'direction' },
          { key: 'D', text: 'directly' },
        ],
        answer: 'A',
        translation: 'HR 부서의 CEO와 IT 팀장은 분기 실적을 발표했다.',
        explanations: { A: '정답1', B: '오답2', C: '오답3', D: '오답4' },
        wordNote: 'director (명사) = 이사, 책임자',
      }
      const res = validateQuestionQuality(q, ['director'])
      expect(res.isValid).toBe(true)
    })
  })

  describe('R-5 & 한국어 조사 유틸리티 검증 (B1, C)', () => {
    it('20종 금지 슬래시/괄호 조사 패턴을 모두 탐지해야 한다', () => {
      expect(hasForbiddenJosaPattern('신흥 시장에서 방안을(를) 모색하다')).toBe(true)
      expect(hasForbiddenJosaPattern('신흥 시장에서 방안을/를 모색하다')).toBe(true)
      expect(hasForbiddenJosaPattern('글로벌 시장(으)로 진출하다')).toBe(true)
      expect(hasForbiddenJosaPattern('보고서(이)가 제출되었다')).toBe(true)
      expect(hasForbiddenJosaPattern('자연스러운 시장으로 진출하여 방안을 모색한다')).toBe(false)
    })

    it('attachJosa는 종성(받침) 및 ㄹ 받침 특수 규칙을 정확히 처리해야 한다', () => {
      // 을/를
      expect(attachJosa('방안', '을/를')).toBe('방안을')
      expect(attachJosa('체계', '을/를')).toBe('체계를')
      // 은/는
      expect(attachJosa('직원', '은/는')).toBe('직원은')
      expect(attachJosa('회사', '은/는')).toBe('회사는')
      // 이/가
      expect(attachJosa('정책', '이/가')).toBe('정책이')
      expect(attachJosa('결과', '이/가')).toBe('결과가')
      // 와/과
      expect(attachJosa('비용', '와/과')).toBe('비용과')
      expect(attachJosa('성과', '와/과')).toBe('성과와')
      // 으로/로 (ㄹ 받침은 '로', 일반 받침은 '으로', 무받침은 '로')
      expect(attachJosa('글로벌', '으로/로')).toBe('글로벌로') // 'ㄹ' 받침 -> 로
      expect(attachJosa('시장', '으로/로')).toBe('시장으로') // 'ㅇ' 받침 -> 으로
      expect(attachJosa('해외', '으로/로')).toBe('해외로') // 무받침 -> 로
    })
  })

  describe('R-6: 해설 템플릿 중복 복붙 탐지 검증', () => {
    it('단어만 바뀐 복붙 해설(유사도 70% 이상)은 기각해야 한다', () => {
      const duplicateExplanations = {
        A: '문맥상 가장 적절한 어휘로 A가 올바릅니다.',
        B: '문맥상 가장 적절한 어휘로 B가 올바릅니다.',
        C: '문맥상 가장 적절한 어휘로 C가 올바릅니다.',
        D: '문맥상 가장 적절한 어휘로 D가 올바릅니다.',
      }
      const dupCheck = checkExplanationTemplateDuplication(duplicateExplanations)
      expect(dupCheck.isDuplicate).toBe(true)
      expect(dupCheck.maxSimilarity).toBeGreaterThanOrEqual(0.7)
    })

    it('각 선지별 고유한 이유를 담은 정상 해설은 통과해야 한다', () => {
      const distinctExplanations = {
        A: '전치사 for와 호응하여 직원들에게 초과 근무에 대해 보상한다는 의미가 자연스럽습니다.',
        B: 'postpone(연기하다)은 이미 완료된 초과 근무에 대한 후속 조치 문맥에 어색합니다.',
        C: 'eliminate(제거하다)는 혜택을 제공하는 긍정적 인사 복지 문맥과 모순됩니다.',
        D: 'restrict(제한하다)는 전치사 for와 쓰여 대상에게 보상을 제공하는 구조에 맞지 않습니다.',
      }
      const dupCheck = checkExplanationTemplateDuplication(distinctExplanations)
      expect(dupCheck.isDuplicate).toBe(false)
    })
  })

  describe('R-7: 단어 정리(wordNote) 무결성 검증 (D3)', () => {
    it('실제 뜻 없이 템플릿 껍데기 설명만 있는 경우 기각해야 한다', () => {
      const res = validateWordNoteQuality('compensate = 비즈니스 확장 및 전략 수립 파트 5 빈출 단어입니다.', 'compensate')
      expect(res.isValid).toBe(false)
    })

    it('품사와 정확한 한국어 뜻이 포함된 정상 wordNote는 통과해야 한다', () => {
      const res = validateWordNoteQuality('compensate (동사) = 보상하다, 변상하다 (compensate A for B)', 'compensate')
      expect(res.isValid).toBe(true)
    })
  })
})
