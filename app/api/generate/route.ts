import { NextRequest, NextResponse } from 'next/server'
import { validateAndSanitizeQuestions } from '@/lib/validator'
import type { Difficulty, Question, QuestionType } from '@/lib/quiz-types'

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

const BUSINESS_DOMAINS = [
  '인사/채용 (HR & Recruitment)',
  '재무/회계 (Finance & Accounting)',
  '고객응대 (Customer Relations)',
  '물류/유통 (Logistics & Supply Chain)',
  'IT/시스템 (IT & Infrastructure)',
  '마케팅/홍보 (Marketing & Advertising)',
  '계약/법률 (Contract & Legal Compliance)',
  '시설/안전 (Facilities & Workplace Safety)',
  '경영전략 (Corporate Strategy & Planning)',
  '연구개발 (R&D & Product Launch)',
]

function getRandomDomains(): string[] {
  const shuffled = [...BUSINESS_DOMAINS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function buildSystemPrompt(words: string[], difficulty: Difficulty): string {
  const diffDesc =
    difficulty === 'easy'
      ? '쉬움 (토익 600점대 수준: 기본 어휘, 명확한 단문 구조, 직관적인 품사 자리 문제)'
      : difficulty === 'hard'
        ? '어려움 (토익 800점대 후반 수준: 까다로운 비즈니스 혼동 어휘, 복합문 구조, 고급 어법 및 매력적인 함정 선지)'
        : '보통 (토익 700점대 실전 수준: 실전 빈출 어휘 및 핵심 문법 구조)'

  const assignedDomains = getRandomDomains()

  return `당신은 최고 수준의 토익(TOEIC) R/C Part 5 전문 출제 위원입니다.
사용자가 입력한 취약 단어 목록: [${words.join(', ')}]
난이도: ${diffDesc}

[문항별 배정 비즈니스 상황]
- 1번 문항: ${assignedDomains[0]} 문맥
- 2번 문항: ${assignedDomains[1]} 문맥
- 3번 문항: ${assignedDomains[2]} 문맥

위 취약 단어들의 정확한 사전적 의미와 품사(동사/명사/형용사/부사 등)를 파악하고, 각 문항에 배정된 비즈니스 상황에 완벽히 어울리는 실전 토익 Part 5 3문항 세트를 생성하세요.

[핵심 출제 규칙 - 위반 절대 금지]
0. 단어 유효성 검사: 입력된 취약 단어가 실제 영어 단어가 아니거나 무의미한 난타 문자열(예: asdfgh, qwrty, zzzzz 등)인 경우, 억지로 가짜 문제를 만들지 말고 반드시 다음 JSON 형태로만 응답하세요:
   { "error": "invalid_word", "invalidWords": ["해당단어"] }
1. 문맥의 자연스러움: 입력 단어가 문장 안에서 부자연스럽게 끼워 맞춰지지 않도록, 단어의 실제 뜻과 비즈니스 콜로케이션(연어 관계)을 반영한 고품질 실전문장을 작성하세요.
2. 문항 수: 반드시 정확히 3문항을 생성하세요.
3. 문제 유형 (3문항 유형이 전부 동일하면 안 됨):
   - 'vocab' (어휘): 최소 1문항 필수. 타깃 단어와 문맥상 경쟁하는 실제 유효한 토익 빈출 유의어/혼동어 3개를 오답으로 구성.
   - 'grammar' (어법) 또는 'prep_conj' (전치사·접속사): 최소 1문항 필수.
   - 3문항의 유형이 전부 동일한 것은 절대 금지입니다 (최소 2개 이상 유형 혼합).
4. 지문(stem): 빈칸은 반드시 '_____' (밑줄 5개) 토큰으로 표기하세요.
5. 선지(choices): 정확히 4개 ('A', 'B', 'C', 'D')로 구성하며, 오답 선지는 절대로 가짜 단어가 아닌 실제 존재하는 영어 단어여야 합니다. 정답은 문맥상 오직 하나만 성립해야 합니다.
6. 해설(explanations): 4개 선지 각각에 대한 한글 해설을 모두 작성하세요 (정답 선지는 정답 근거, 오답 3개는 각 오답이 틀린 구체적 문법/문맥 이유).
7. 한글 해석(translation) 및 단어 정리(wordNote): 각 문항마다 충실하게 작성하세요.

[반환 형식]
반드시 다음 JSON 스키마를 준수하는 순수 JSON 배열만 출력하세요 (마크다운 설명문 금지):
[
  {
    "id": "q-1",
    "type": "vocab" | "grammar" | "prep_conj",
    "targetWord": "사용한 취약 단어",
    "stem": "The company decided to _____ the new policy.",
    "choices": [
      { "key": "A", "text": "implement" },
      { "key": "B", "text": "implementation" },
      { "key": "C", "text": "implementing" },
      { "key": "D", "text": "implemented" }
    ],
    "answer": "A",
    "explanations": {
      "A": "to부정사 뒤 동사원형 자리로 implement가 정답입니다.",
      "B": "명사이므로 to 뒤에 바로 올 수 없습니다.",
      "C": "동명사는 to부정사 목적어 구조에 맞지 않습니다.",
      "D": "과거분사는 올 수 없습니다."
    },
    "translation": "회사는 새로운 정책을 시행하기로 결정했다.",
    "wordNote": "implement = 시행하다, 실행하다 (토익 파트 5 최빈출 동사)"
  }
]`
}

type PartOfSpeech = 'verb' | 'noun' | 'adjective' | 'adverb' | 'prep_conj'

function guessPartOfSpeech(word: string): PartOfSpeech {
  const lower = word.toLowerCase().trim()
  const PREP_CONJ_WORDS = new Set([
    'despite', 'although', 'because', 'during', 'since', 'unless', 'without',
    'regarding', 'concerning', 'throughout', 'while', 'whereas', 'besides', 'upon',
  ])
  if (PREP_CONJ_WORDS.has(lower)) return 'prep_conj'
  if (lower.endsWith('ly')) return 'adverb'
  if (
    lower.endsWith('tion') ||
    lower.endsWith('sion') ||
    lower.endsWith('ment') ||
    lower.endsWith('ance') ||
    lower.endsWith('ence') ||
    lower.endsWith('ity') ||
    lower.endsWith('ness')
  ) {
    return 'noun'
  }
  if (
    lower.endsWith('able') ||
    lower.endsWith('ible') ||
    lower.endsWith('ive') ||
    lower.endsWith('al') ||
    lower.endsWith('ous') ||
    lower.endsWith('ful') ||
    lower.endsWith('ic')
  ) {
    return 'adjective'
  }
  if (
    lower.endsWith('ate') ||
    lower.endsWith('ize') ||
    lower.endsWith('ise') ||
    lower.endsWith('ify')
  ) {
    return 'verb'
  }
  return 'verb'
}

/**
 * API 키가 없을 때 동작하는 품사/문맥 추론 기반 지능형 다이나믹 Mock 생성기
 */
function createFallbackQuestions(words: string[], difficulty: Difficulty): Question[] {
  const w1 = words[0] || 'comprehensive'
  const w2 = words[1] || w1
  const w3 = words[2] || (words[0] === w2 ? 'strictly' : w1)

  const pos1 = guessPartOfSpeech(w1)
  const pos2 = guessPartOfSpeech(w2)

  // 1번 문항: 어휘(vocab) - 비즈니스 시나리오 다양화
  const vocabTemplates = [
    {
      stem: `Due to recent regulatory changes, the compliance officer emphasized the need to _____ ${w1} in all operational procedures.`,
      targetWord: w1,
      choices: [
        { key: 'A', text: w1 },
        { key: 'B', text: 'postpone' },
        { key: 'C', text: 'eliminate' },
        { key: 'D', text: 'overlook' },
      ],
      answer: 'A' as const,
      explanations: {
        A: `문맥상 규정 준수를 위해 업무 절차에서 '${w1}'의 의미가 가장 자연스럽게 어울립니다.`,
        B: 'postpone(연기하다)은 규정 준수 강화 문맥의 긍정적 논리에 맞지 않습니다.',
        C: 'eliminate(제거하다)는 운영 절차 적용 문맥에 부적절합니다.',
        D: 'overlook(간과하다, 눈감아주다)은 반대 의미의 오답입니다.',
      },
      translation: `최근 규정 변경으로 인해 준법감시인은 모든 운영 절차에서 ${w1}의 필요성을 강조했다.`,
      wordNote: `${w1} = 토익 실전 빈출 어휘. 비즈니스 규정 및 운영 문맥에서의 핵심 의미를 숙지하세요.`,
    },
    {
      stem: `The regional director presented a _____ proposal regarding ${w1} to the board of directors this morning.`,
      targetWord: w1,
      choices: [
        { key: 'A', text: w1 },
        { key: 'B', text: 'reluctant' },
        { key: 'C', text: 'temporary' },
        { key: 'D', text: 'tentative' },
      ],
      answer: 'A' as const,
      explanations: {
        A: `이사회에 제출된 제안서의 성격을 나타내는 적절한 어휘로 '${w1}'이 가장 적합합니다.`,
        B: 'reluctant(꺼리는)는 제안서를 수식하기에 어색합니다.',
        C: 'temporary(일시적인)는 정식 이사회 안건 문맥에 덜 적합합니다.',
        D: 'tentative(잠정적인)보다 문맥상 완성도 높은 제안을 나타내는 정답이 적절합니다.',
      },
      translation: `지역 총괄 이사는 오늘 아침 이사회에 ${w1}에 관한 제안서를 발표했다.`,
      wordNote: `${w1} = 제안서(proposal), 보고서(report) 등과 자주 호응하는 핵심 토익 표현입니다.`,
    },
    {
      stem: `Our marketing department is actively seeking innovative ways to _____ ${w1} across emerging global markets.`,
      targetWord: w1,
      choices: [
        { key: 'A', text: w1 },
        { key: 'B', text: 'terminate' },
        { key: 'C', text: 'restrict' },
        { key: 'D', text: 'hesitate' },
      ],
      answer: 'A' as const,
      explanations: {
        A: `신흥 글로벌 시장 공략 문맥에서 '${w1}'의 활용이 가장 타당합니다.`,
        B: 'terminate(종료하다)는 적극적 마케팅 확장 취지에 반합니다.',
        C: 'restrict(제한하다)는 부정적 의미로 문맥상 부적절합니다.',
        D: 'hesitate(망설이다)는 자동사로 목적어를 바로 취할 수 없습니다.',
      },
      translation: `우리 마케팅 부서는 신흥 글로벌 시장에서 ${w1}을(를) 달성하기 위한 혁신적인 방안을 적극 모색하고 있다.`,
      wordNote: `${w1} = 비즈니스 확장 및 전략 수립 파트 5 빈출 단어입니다.`,
    },
  ]

  const selectedVocab = vocabTemplates[Math.floor(Math.random() * vocabTemplates.length)]

  // 2번 문항: 어법(grammar) - 형태 변형 및 문법 구조 문제
  const grammarStemBase = w2.replace(/(ing|ed|tion|ment|able|ive|ly)$/i, '')
  const nounForm = `${grammarStemBase}tion`
  const adjForm = `${grammarStemBase}able`
  const advForm = `${grammarStemBase}ly`
  const verbForm = grammarStemBase

  const grammarTemplates = [
    {
      stem: `The technical support team conducted the quarterly system maintenance _____ to minimize user disruption.`,
      targetWord: w2,
      choices: [
        { key: 'A', text: advForm },
        { key: 'B', text: verbForm },
        { key: 'C', text: nounForm },
        { key: 'D', text: adjForm },
      ],
      answer: 'A' as const,
      explanations: {
        A: `완전한 절(conducted the maintenance) 뒤에서 동사구를 수식하는 부사 자리이므로 ${advForm}가 정답입니다.`,
        B: '동사원형은 이미 본동사 conducted가 있으므로 위치할 수 없습니다.',
        C: '명사는 목적어 뒤에 불필요하게 겹치므로 오답입니다.',
        D: '형용사는 동사구를 수식할 수 없습니다.',
      },
      translation: `기술 지원팀은 사용자 불편을 최소화하기 위해 분기별 시스템 점검을 철저하게 수행했다.`,
      wordNote: `${w2}의 품사 변형 = 문장의 필수 성분(S+V+O)이 완벽할 때 빈칸은 부사(-ly) 자리입니다.`,
    },
    {
      stem: `All employees who wish to participate in the seminar must obtain managerial _____ before the deadline.`,
      targetWord: w2,
      choices: [
        { key: 'A', text: nounForm },
        { key: 'B', text: verbForm },
        { key: 'C', text: advForm },
        { key: 'D', text: adjForm },
      ],
      answer: 'A' as const,
      explanations: {
        A: `형용사 managerial의 수식을 받는 타동사 obtain의 목적어 자리이므로 명사(${nounForm})가 정답입니다.`,
        B: '동사원형은 타동사의 목적어 자리에 올 수 없습니다.',
        C: '부사는 명사 자리에 올 수 없습니다.',
        D: '형용사는 목적어 역할을 단독으로 할 수 없습니다.',
      },
      translation: `세미나 참가를 희망하는 모든 직원은 마감일 전에 관리자의 승인을 받아야 한다.`,
      wordNote: `형용사 + [명사 빈칸] = Part 5에서 매달 출제되는 1초 정답 공식입니다.`,
    },
  ]

  const selectedGrammar = grammarTemplates[Math.floor(Math.random() * grammarTemplates.length)]

  // 3번 문항: 전치사/접속사(prep_conj)
  const prepConjTemplates = [
    {
      stem: `_____ unexpected supply chain delays, the construction project was completed within budget.`,
      targetWord: w3,
      choices: [
        { key: 'A', text: 'Despite' },
        { key: 'B', text: 'Although' },
        { key: 'C', text: 'Even though' },
        { key: 'D', text: 'While' },
      ],
      answer: 'A' as const,
      explanations: {
        A: '빈칸 뒤에 명사구(unexpected supply chain delays)가 오고 주절과 양보 관계이므로 전치사 Despite가 정답입니다.',
        B: 'Although는 접속사이므로 뒤에 절(S+V)이 와야 합니다.',
        C: 'Even though는 접속사이므로 명사구를 이끌 수 없습니다.',
        D: 'While은 접속사이므로 뒤에 절이 와야 합니다.',
      },
      translation: `예상치 못한 공급망 지연에도 불구하고, 건설 프로젝트는 예산 범위 내에서 완료되었다.`,
      wordNote: `Despite / In spite of + 명사(구) vs Although / Even though + 절(S+V) 구분이 핵심입니다.`,
    },
    {
      stem: `_____ the new software update is installed, all workstations must be restarted immediately.`,
      targetWord: w3,
      choices: [
        { key: 'A', text: 'Once' },
        { key: 'B', text: 'During' },
        { key: 'C', text: 'Despite' },
        { key: 'D', text: 'Prior to' },
      ],
      answer: 'A' as const,
      explanations: {
        A: '빈칸 뒤에 절(the software update is installed)이 이어져 조건을 나타내는 접속사 Once(~하자마자, 일단 ~하면)가 정답입니다.',
        B: 'During은 전치사이므로 뒤에 절이 올 수 없습니다.',
        C: 'Despite는 전치사이므로 절을 이끌 수 없습니다.',
        D: 'Prior to는 전치사구이므로 명사(구)와 결합해야 합니다.',
      },
      translation: `새 소프트웨어 업데이트가 설치되는 즉시, 모든 워크스테이션을 재부팅해야 한다.`,
      wordNote: `Once + S + V = 일단 ~하면 (토익 빈출 조건/시간 접속사)`,
    },
  ]

  const selectedPrepConj = prepConjTemplates[Math.floor(Math.random() * prepConjTemplates.length)]

  return [
    {
      id: 'q-1',
      type: 'vocab',
      ...selectedVocab,
    },
    {
      id: 'q-2',
      type: 'grammar',
      ...selectedGrammar,
    },
    {
      id: 'q-3',
      type: 'prep_conj',
      ...selectedPrepConj,
    },
  ]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { words, difficulty = 'normal' } = body

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: '단어를 1개 이상 전달해야 합니다.' },
        { status: 400 },
      )
    }

    const cleanWords = words.slice(0, 5).map((w: string) => String(w).trim())
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY

    let parsedQuestions: unknown[] = []

    if (apiKey) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      
      // Google Gemini API 호출 (Structured JSON Schema 적용)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
              responseSchema: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    type: { type: 'STRING', enum: ['vocab', 'grammar', 'prep_conj'] },
                    targetWord: { type: 'STRING' },
                    stem: { type: 'STRING' },
                    choices: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          key: { type: 'STRING', enum: ['A', 'B', 'C', 'D'] },
                          text: { type: 'STRING' },
                        },
                        required: ['key', 'text'],
                      },
                    },
                    answer: { type: 'STRING', enum: ['A', 'B', 'C', 'D'] },
                    explanations: {
                      type: 'OBJECT',
                      properties: {
                        A: { type: 'STRING' },
                        B: { type: 'STRING' },
                        C: { type: 'STRING' },
                        D: { type: 'STRING' },
                      },
                      required: ['A', 'B', 'C', 'D'],
                    },
                    translation: { type: 'STRING' },
                    wordNote: { type: 'STRING' },
                  },
                  required: [
                    'id',
                    'type',
                    'targetWord',
                    'stem',
                    'choices',
                    'answer',
                    'explanations',
                    'translation',
                    'wordNote',
                  ],
                },
              },
            },
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('AI API call failed:', response.status, errorText)
        if (response.status === 429) {
          return NextResponse.json({ error: 'rate_limit' }, { status: 429 })
        }
        return NextResponse.json({ error: 'ai_error' }, { status: 502 })
      }

      const aiData = await response.json()
      const rawText =
        aiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleaned = stripMarkdownFences(rawText)

      try {
        const parsed = JSON.parse(cleaned)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.error === 'invalid_word') {
          return NextResponse.json(
            { error: 'invalid_word', invalidWords: parsed.invalidWords || cleanWords },
            { status: 422 },
          )
        }
        parsedQuestions = Array.isArray(parsed) ? parsed : parsed.questions || []
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError, cleaned)
        return NextResponse.json({ error: 'parse_error' }, { status: 502 })
      }
    } else {
      // API Key가 없으면 지능형 개발용 Mock 데이터 생성
      parsedQuestions = createFallbackQuestions(cleanWords, difficulty as Difficulty)
    }

    // EX-4, EX-5, EX-6, EX-7, EX-8 검증 파이프라인 수행
    const validation = validateAndSanitizeQuestions(parsedQuestions, cleanWords)

    if (validation.validQuestions.length === 0) {
      return NextResponse.json(
        { error: 'no_valid_questions', retryable: true },
        { status: 502 },
      )
    }

    return NextResponse.json({
      questions: validation.validQuestions,
      isHomogeneous: validation.isHomogeneous,
      discardedCount: validation.discardedCount,
    })
  } catch (error) {
    console.error('Unexpected server error in generate route:', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
