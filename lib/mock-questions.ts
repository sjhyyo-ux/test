// 하드코딩된 목(mock) 문제 세트
// 실제 데이터로 교체할 때는 이 파일만 갈아끼우면 된다.

import type { Question } from './quiz-types'

/** 3문항 세트 — 어휘 / 어법 / 전치사·접속사 각 1문항 */
export const THREE_QUESTION_SET: Question[] = [
  {
    id: 'q-vocab-1',
    type: 'vocab',
    targetWord: 'comprehensive',
    sentence:
      'The consulting firm delivered a _____ review of every department before the merger was finalized.',
    choices: [
      {
        key: 'A',
        text: 'comprehensive',
        rationale:
          '"모든 부서를 빠짐없이 다룬 검토"라는 뜻이 필요합니다. comprehensive는 "포괄적인, 빠짐없는"이므로 every department와 자연스럽게 이어집니다.',
      },
      {
        key: 'B',
        text: 'comprehensible',
        rationale:
          'comprehensible은 "이해할 수 있는"입니다. 검토의 범위가 아니라 난이도를 말하게 되어 every department와 논리가 맞지 않습니다.',
      },
      {
        key: 'C',
        text: 'compressed',
        rationale:
          'compressed는 "압축된"입니다. 오히려 범위를 줄였다는 뜻이 되어 "모든 부서"와 정반대의 의미가 됩니다.',
      },
      {
        key: 'D',
        text: 'competitive',
        rationale:
          'competitive는 "경쟁력 있는"입니다. 사람이나 가격에 쓰는 표현이며 review를 수식하면 의미가 성립하지 않습니다.',
      },
    ],
    answer: 'A',
    translation:
      '그 컨설팅 회사는 합병이 마무리되기 전에 모든 부서에 대한 포괄적인 검토 결과를 제출했다.',
    targetNote:
      'comprehensive = 포괄적인(범위가 넓다) / comprehensible = 이해하기 쉬운(난이도). 시험에서 이 둘은 거의 항상 짝으로 나옵니다.',
  },
  {
    id: 'q-grammar-1',
    type: 'grammar',
    targetWord: 'comprehensible',
    sentence:
      'The new manual makes the safety procedures _____ even to first-week employees.',
    choices: [
      {
        key: 'A',
        text: 'comprehension',
        rationale:
          '명사입니다. make + 목적어 + 목적격 보어 구조에서 보어 자리에 명사가 오면 "절차 = 이해력"이라는 어색한 의미가 됩니다.',
      },
      {
        key: 'B',
        text: 'comprehensible',
        rationale:
          'make + 목적어 + 형용사 구조이므로 보어 자리에는 형용사가 와야 합니다. comprehensible이 procedures의 상태를 설명합니다.',
      },
      {
        key: 'C',
        text: 'comprehensibly',
        rationale:
          '부사입니다. 목적격 보어 자리에는 부사가 올 수 없어 make ... 구조가 깨집니다.',
      },
      {
        key: 'D',
        text: 'comprehend',
        rationale:
          '동사 원형입니다. 이미 makes라는 본동사가 있어 한 절에 동사가 두 개가 됩니다.',
      },
    ],
    answer: 'B',
    translation:
      '새 매뉴얼은 입사 첫 주 직원에게도 안전 절차를 이해할 수 있게 만들어 준다.',
    targetNote:
      'comprehensible은 형용사. make A comprehensible = A를 이해할 수 있게 만들다. 품사 자리로 먼저 답을 좁히세요.',
  },
  {
    id: 'q-prepconj-1',
    type: 'prepconj',
    targetWord: 'comprehensive',
    sentence:
      '_____ the report was comprehensive, the board asked for one additional cost breakdown.',
    choices: [
      {
        key: 'A',
        text: 'Despite',
        rationale:
          '전치사이므로 뒤에 명사(구)가 와야 합니다. 여기서는 the report was...라는 절이 오므로 쓸 수 없습니다.',
      },
      {
        key: 'B',
        text: 'Nevertheless',
        rationale:
          '접속부사입니다. 두 절을 직접 연결할 수 없고 앞 문장과 세미콜론·마침표로 이어져야 합니다.',
      },
      {
        key: 'C',
        text: 'Although',
        rationale:
          '뒤에 절(the report was comprehensive)이 오고, 주절과 양보 관계이므로 접속사 Although가 정답입니다.',
      },
      {
        key: 'D',
        text: 'In spite of',
        rationale:
          'Despite와 같은 전치사구입니다. 뒤에 절이 아니라 명사(구)만 올 수 있습니다.',
      },
    ],
    answer: 'C',
    translation:
      '보고서가 포괄적이었음에도, 이사회는 비용 항목 분석을 하나 더 요청했다.',
    targetNote:
      'comprehensive는 형용사로 be동사 뒤 보어 자리에도 자주 옵니다. 빈칸 뒤가 절이면 접속사, 명사면 전치사를 고르세요.',
  },
]

/** E5(2문항만 생성된 경우) 확인용 세트 */
export const TWO_QUESTION_SET: Question[] = [
  {
    id: 'q-vocab-2',
    type: 'vocab',
    targetWord: 'comprehensive',
    sentence:
      'Applicants must submit a _____ list of prior employers along with the signed form.',
    choices: [
      {
        key: 'A',
        text: 'comprehensive',
        rationale:
          '"이전 고용주 전체가 담긴 목록"이라는 의미가 필요하므로 "빠짐없는"을 뜻하는 comprehensive가 정답입니다.',
      },
      {
        key: 'B',
        text: 'comprehensive-looking',
        rationale:
          '실제 시험에 쓰이지 않는 어색한 조합이며, 목록의 범위가 아니라 겉모습을 말하게 됩니다.',
      },
      {
        key: 'C',
        text: 'comprehending',
        rationale:
          '"이해하고 있는"이라는 뜻으로 사람의 상태에 쓰입니다. list를 수식할 수 없습니다.',
      },
      {
        key: 'D',
        text: 'comprehensibly',
        rationale:
          '부사이므로 명사 list를 수식할 수 없습니다. 명사 앞자리는 형용사입니다.',
      },
    ],
    answer: 'A',
    translation:
      '지원자는 서명된 양식과 함께 이전 고용주 전체가 포함된 목록을 제출해야 한다.',
    targetNote:
      'comprehensive + list / review / report 조합으로 자주 출제됩니다. "빠짐없는"으로 외우세요.',
  },
  {
    id: 'q-prepconj-2',
    type: 'prepconj',
    targetWord: 'comprehensible',
    sentence:
      'The training video was rewritten _____ the instructions would be comprehensible to new hires.',
    choices: [
      {
        key: 'A',
        text: 'so that',
        rationale:
          '목적("~하도록")을 나타내는 접속사입니다. 뒤에 would가 있는 절이 오므로 so that이 정답입니다.',
      },
      {
        key: 'B',
        text: 'in order to',
        rationale:
          '뒤에 동사원형이 와야 합니다. 여기서는 주어가 있는 절이 오므로 쓸 수 없습니다.',
      },
      {
        key: 'C',
        text: 'because of',
        rationale:
          '전치사구로 뒤에 명사(구)만 올 수 있고, 의미도 목적이 아니라 원인이 됩니다.',
      },
      {
        key: 'D',
        text: 'whereas',
        rationale:
          '대조를 나타내는 접속사입니다. 문장은 대조가 아니라 목적을 말하고 있어 논리가 맞지 않습니다.',
      },
    ],
    answer: 'A',
    translation:
      '신입 직원이 지침을 이해할 수 있도록 그 교육 영상은 다시 작성되었다.',
    targetNote:
      'comprehensible to + 사람 = ~가 이해할 수 있는. to 뒤에 대상이 온다는 점을 함께 기억하세요.',
  },
]
