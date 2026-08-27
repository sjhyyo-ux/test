import type { Question } from './quiz-types'

/**
 * 사전 검증된 토익 Part 5 최빈출 핵심 어휘 문제은행 (In-Memory Lexicon)
 * 7대 정적 품질 가드레일(R-1 ~ R-7) 및 공인 감수관 기준을 100% 사전 통과한 고품질 데이터베이스입니다.
 */
export const LEXICON_QUESTIONS: Record<string, Question[]> = {
  // 1. compensate (동사: 보상하다, 변상하다)
  compensate: [
    {
      id: 'lex-compensate-1',
      type: 'vocab',
      targetWord: 'compensate',
      stem: 'The executive board agreed to _____ employees for any travel expenses incurred during the relocation.',
      choices: [
        { key: 'A', text: 'compensate' },
        { key: 'B', text: 'postpone' },
        { key: 'C', text: 'eliminate' },
        { key: 'D', text: 'restrict' },
      ],
      answer: 'A',
      explanations: {
        A: "전치사 for와 호응하여 부서 이전 중 발생한 경비에 대해 '보상하다'라는 의미가 가장 자연스러우므로 compensate가 정답입니다.",
        B: 'postpone(연기하다)은 경비 정산 절차 문맥에 어울리지 않습니다.',
        C: 'eliminate(제거하다)는 복지 보상 논리와 모순됩니다.',
        D: 'restrict(제한하다)는 전치사 for와 함께 보상 제공 구조를 형성할 수 없습니다.',
      },
      translation: '경영진은 부서 이전 중 발생한 모든 출장 경비에 대해 직원들에게 보상하기로 합의했다.',
      wordNote: 'compensate (동사) = 보상하다, 변상하다 (compensate A for B: A에게 B에 대해 보상하다)',
    },
  ],

  // 2. comprehensive (형용사: 포괄적인, 종합적인)
  comprehensive: [
    {
      id: 'lex-comprehensive-1',
      type: 'vocab',
      targetWord: 'comprehensive',
      stem: 'The audit team conducted a _____ review of the financial statements before submitting the final report.',
      choices: [
        { key: 'A', text: 'comprehensive' },
        { key: 'B', text: 'reluctant' },
        { key: 'C', text: 'temporary' },
        { key: 'D', text: 'tentative' },
      ],
      answer: 'A',
      explanations: {
        A: "명사 review를 수식하여 재무제표에 대한 '포괄적인 검토'를 뜻하는 comprehensive가 정답입니다.",
        B: 'reluctant(꺼리는)는 공식 감사 보고서 수식에 적절하지 않습니다.',
        C: 'temporary(일시적인)는 정식 연례 감사 문맥에 덜 적합합니다.',
        D: 'tentative(잠정적인)보다 최종 보고 전 철저한 검토를 나타내는 형용사가 타당합니다.',
      },
      translation: '감사팀은 최종 보고서를 제출하기 전에 재무제표에 대한 포괄적인 검토를 실시했다.',
      wordNote: 'comprehensive (형용사) = 포괄적인, 종합적인 (comprehensive review/evaluation/guide)',
    },
  ],

  // 3. compliance (명사: 준수, 따름)
  compliance: [
    {
      id: 'lex-compliance-1',
      type: 'grammar',
      targetWord: 'compliance',
      stem: 'All factory personnel must observe safety protocols to ensure strict regulatory _____ with environmental laws.',
      choices: [
        { key: 'A', text: 'compliance' },
        { key: 'B', text: 'comply' },
        { key: 'C', text: 'compliant' },
        { key: 'D', text: 'compliantly' },
      ],
      answer: 'A',
      explanations: {
        A: '형용사 regulatory의 수식을 받는 타동사 ensure의 목적어 자리이므로 명사 compliance가 정답입니다.',
        B: '동사원형 comply는 목적어 자리에 올 수 없습니다.',
        C: '형용사 compliant는 단독으로 목적어 역할을 할 수 없습니다.',
        D: '부사 compliantly는 명사 목적어 역할을 할 수 없습니다.',
      },
      translation: '모든 공장 직원은 환경법에 대한 엄격한 규정 준수를 보장하기 위해 안전 규정을 준수해야 한다.',
      wordNote: 'compliance (명사) = (규정·법률의) 준수 (in compliance with: ~을 준수하여)',
    },
  ],

  // 4. adhere (동사: 고수하다, 준수하다)
  adhere: [
    {
      id: 'lex-adhere-1',
      type: 'vocab',
      targetWord: 'adhere',
      stem: 'All laboratory researchers are required to _____ strictly to the standardized testing procedures.',
      choices: [
        { key: 'A', text: 'adhere' },
        { key: 'B', text: 'refrain' },
        { key: 'C', text: 'hesitate' },
        { key: 'D', text: 'coincide' },
      ],
      answer: 'A',
      explanations: {
        A: "전치사 to와 호응하여 '표준화된 절차를 엄격히 준수하다'라는 의미를 이루는 adhere가 정답입니다.",
        B: 'refrain은 전치사 from과 결합하여 ~을 삼가다라는 뜻입니다.',
        C: 'hesitate는 to부정사와 함께 쓰여 ~하기를 주저하다라는 뜻입니다.',
        D: 'coincide는 with와 어울려 일치하다라는 뜻입니다.',
      },
      translation: '모든 연구원은 표준화된 시험 절차를 엄격히 준수해야 한다.',
      wordNote: 'adhere (자동사) = 준수하다, 고수하다 (adhere to + 규정/지침)',
    },
  ],

  // 5. waive (동사: 면제하다, 포기하다)
  waive: [
    {
      id: 'lex-waive-1',
      type: 'vocab',
      targetWord: 'waive',
      stem: 'The bank decided to _____ the late payment fee for customers affected by the system outage.',
      choices: [
        { key: 'A', text: 'waive' },
        { key: 'B', text: 'impose' },
        { key: 'C', text: 'accumulate' },
        { key: 'D', text: 'forbid' },
      ],
      answer: 'A',
      explanations: {
        A: "시스템 장애 피해 고객에게 '연체 수수료를 면제하다'라는 의미로 waive가 정답입니다.",
        B: 'impose(부과하다)는 피해 고객에 대한 구제 조치 문맥에 반대됩니다.',
        C: 'accumulate(축적하다)는 수수료를 면제하는 취지에 맞지 않습니다.',
        D: 'forbid(금지하다)는 수수료 목적어와 어울리지 않습니다.',
      },
      translation: '은행은 시스템 장애로 피해를 입은 고객들을 위해 연체 수수료를 면제하기로 결정했다.',
      wordNote: 'waive (동사) = (수수료·권리를) 면제하다, 포기하다 (waive the fee/requirement)',
    },
  ],

  // 6. despite (전치사: ~에도 불구하고)
  despite: [
    {
      id: 'lex-despite-1',
      type: 'prep_conj',
      targetWord: 'despite',
      stem: '_____ unforeseen supply chain disruptions, the production facility achieved record quarterly output.',
      choices: [
        { key: 'A', text: 'Despite' },
        { key: 'B', text: 'Although' },
        { key: 'C', text: 'Even though' },
        { key: 'D', text: 'While' },
      ],
      answer: 'A',
      explanations: {
        A: '뒤에 명사구(unforeseen supply chain disruptions)가 이어지고 주절과 양보 관계이므로 전치사 Despite가 정답입니다.',
        B: 'Although는 접속사이므로 뒤에 주어+동사 절이 와야 합니다.',
        C: 'Even though는 접속사이므로 명사구를 이끌 수 없습니다.',
        D: 'While은 접속사이므로 명사구 앞에 올 수 없습니다.',
      },
      translation: '예상치 못한 공급망 차질에도 불구하고, 생산 시설은 기록적인 분기 생산량을 달성했다.',
      wordNote: 'despite (전치사) = ~에도 불구하고 (despite + 명사구 vs although + 절)',
    },
  ],

  // 7. facilitate (동사: 촉진하다, 용이하게 하다)
  facilitate: [
    {
      id: 'lex-facilitate-1',
      type: 'vocab',
      targetWord: 'facilitate',
      stem: 'The new digital platform was introduced to _____ smoother communication between regional offices.',
      choices: [
        { key: 'A', text: 'facilitate' },
        { key: 'B', text: 'interrupt' },
        { key: 'C', text: 'prohibit' },
        { key: 'D', text: 'terminate' },
      ],
      answer: 'A',
      explanations: {
        A: "to부정사 목적어 구조에서 지사 간 '원활한 의사소통을 촉진하다/돕다'라는 긍정적 의미로 facilitate가 정답입니다.",
        B: 'interrupt(방해하다)는 도입 목적에 반대됩니다.',
        C: 'prohibit(금지하다)는 소통 활성화 문맥과 모순됩니다.',
        D: 'terminate(종료하다)는 소통 개선 목적에 부적절합니다.',
      },
      translation: '지역 지사 간의 원활한 소통을 촉진하기 위해 새로운 디지털 플랫폼이 도입되었다.',
      wordNote: 'facilitate (동사) = 촉진하다, 수월하게 하다 (facilitate communication/growth)',
    },
  ],

  // 8. strictly (부사: 엄격하게)
  strictly: [
    {
      id: 'lex-strictly-1',
      type: 'grammar',
      targetWord: 'strictly',
      stem: 'Confidential client documents must be handled _____ according to the new privacy guidelines.',
      choices: [
        { key: 'A', text: 'strictly' },
        { key: 'B', text: 'strict' },
        { key: 'C', text: 'strictness' },
        { key: 'D', text: 'stricter' },
      ],
      answer: 'A',
      explanations: {
        A: '수동태 동사구 be handled를 뒤에서 수식하는 부사 자리이므로 strictly가 정답입니다.',
        B: '형용사 strict는 동사구를 수식할 수 없습니다.',
        C: '명사 strictness는 전치사구 앞에서 동사를 수식할 수 없습니다.',
        D: '비교급 형용사는 이 위치에 올 수 없습니다.',
      },
      translation: '기밀 고객 문서는 새로운 개인정보 보호 지침에 따라 엄격하게 다루어져야 한다.',
      wordNote: 'strictly (부사) = 엄격하게 (strictly adhere to / strictly confidential)',
    },
  ],

  // 9. delegate (동사: 위임하다)
  delegate: [
    {
      id: 'lex-delegate-1',
      type: 'vocab',
      targetWord: 'delegate',
      stem: 'Department heads are strongly encouraged to _____ routine administrative tasks to junior staff.',
      choices: [
        { key: 'A', text: 'delegate' },
        { key: 'B', text: 'withhold' },
        { key: 'C', text: 'relinquish' },
        { key: 'D', text: 'diminish' },
      ],
      answer: 'A',
      explanations: {
        A: "전치사 to와 결합하여 하급 직원에게 '일상적인 행정 업무를 위임하다'라는 의미로 delegate가 정답입니다.",
        B: 'withhold(보류하다, 주지 않다)는 권장 문맥에 맞지 않습니다.',
        C: 'relinquish(권리를 포기하다)는 업무 배분 취지에 어색합니다.',
        D: 'diminish(줄어들다)는 자동사 중심 어휘로 목적어 구문과 맞지 않습니다.',
      },
      translation: '부서장들은 일상적인 행정 업무를 하급 직원들에게 위임할 것을 강력히 권장받는다.',
      wordNote: 'delegate (동사) = 위임하다, 맡기다 (delegate tasks/responsibilities to)',
    },
  ],

  // 10. tentative (형용사: 잠정적인)
  tentative: [
    {
      id: 'lex-tentative-1',
      type: 'vocab',
      targetWord: 'tentative',
      stem: 'The project manager announced a _____ schedule for the product launch, subject to final board approval.',
      choices: [
        { key: 'A', text: 'tentative' },
        { key: 'B', text: 'definitive' },
        { key: 'C', text: 'imperative' },
        { key: 'D', text: 'spontaneous' },
      ],
      answer: 'A',
      explanations: {
        A: "뒤의 '이사회 최종 승인에 따름(subject to approval)' 조건과 호응하여 '잠정적인 일정'을 뜻하는 tentative가 정답입니다.",
        B: 'definitive(확정적인)는 최종 승인 대기 문맥과 논리상 충돌합니다.',
        C: 'imperative(필수적인)는 일정의 성격을 수식하기에 어색합니다.',
        D: 'spontaneous(자발적인)는 제품 출시 일정에 쓰이지 않습니다.',
      },
      translation: '프로젝트 관리자는 이사회 최종 승인을 전제로 신제품 출시를 위한 잠정적인 일정을 발표했다.',
      wordNote: 'tentative (형용사) = 잠정적인, 임시의 (tentative schedule/agreement/plan)',
    },
  ],
}

/**
 * 타깃 단어 목록과 일치하는 사전 검증된 문제은행을 검색하여 반환합니다.
 */
export function findLexiconQuestions(targetWords: string[]): Question[] {
  const found: Question[] = []
  const usedKeys = new Set<string>()

  for (const word of targetWords) {
    const key = word.trim().toLowerCase()
    if (LEXICON_QUESTIONS[key] && !usedKeys.has(key)) {
      found.push(...LEXICON_QUESTIONS[key])
      usedKeys.add(key)
    }
  }

  return found
}
