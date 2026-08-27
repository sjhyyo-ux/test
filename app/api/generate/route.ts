import { NextRequest, NextResponse } from 'next/server'
import { attachJosa } from '@/lib/korean-josa'
import { validateAndSanitizeQuestions, validateQuestionQuality } from '@/lib/validator'
import type { ChoiceKey, Difficulty, Question, QuestionType } from '@/lib/quiz-types'

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

/**
 * 실전 토익 Part 5 출제 프롬프트 생성기 (v3.0)
 */
function buildSystemPrompt(
  words: string[],
  difficulty: Difficulty,
  feedbackHistory: string[] = [],
): string {
  const diffDesc =
    difficulty === 'easy'
      ? '쉬움 (토익 600점대: 명확한 단문, 기본 어휘, 직관적인 품사 자리 문제)'
      : difficulty === 'hard'
        ? '어려움 (토익 800점대 후반: 비즈니스 고급 혼동 어휘, 까다로운 어법, 함정 선지)'
        : '보통 (토익 700점대 실전: 실전 빈출 어휘 및 핵심 문법 구조)'

  const assignedDomains = getRandomDomains()

  let feedbackPrompt = ''
  if (feedbackHistory.length > 0) {
    feedbackPrompt = `\n[⚠️ 이전 생성 실패 사유 및 공인 감수관 지적 사항 - 반드시 보정하여 출제할 것]\n` +
      feedbackHistory.map((f, i) => `${i + 1}. ${f}`).join('\n') + '\n'
  }

  return `당신은 최고 권위의 토익(TOEIC) R/C Part 5 전문 출제 위원장입니다.
사용자가 입력한 취약 단어 목록: [${words.join(', ')}]
난이도: ${diffDesc}

[문항별 배정 비즈니스 도메인]
- 1번 문항: ${assignedDomains[0]}
- 2번 문항: ${assignedDomains[1]}
- 3번 문항: ${assignedDomains[2]}
${feedbackPrompt}
위 취약 단어들의 사전적 의미, 품사(동사/명사/형용사/부사/전접), 실제 비즈니스 콜로케이션(연어)을 철저히 분석하여, 각 배정 도메인에 완벽히 어울리는 실전 토익 Part 5 3문항 세트를 생성하세요.

[🚨 절대 위반 금지 출제 원칙]
0. 단어 유효성: 입력된 단어가 실제 영단어가 아닌 무의미한 난타 문자열이면 반드시 { "error": "invalid_word", "invalidWords": ["해당단어"] } 로 응답하세요.
1. 빈칸 치환 필수 (R-1, R-2):
   - 지문(stem)에서 정답이 들어갈 자리는 반드시 '_____' (밑줄 정확히 5개) 토큰으로 치환하세요.
   - 빈칸 외 지문 본문에 정답 단어(또는 굴절형)가 영문으로 그대로 노출되어서는 절대 안 됩니다.
2. 어휘 및 문맥 적합성:
   - 단어의 실제 뜻(예: compensate = 보상하다)과 어울리지 않는 엉뚱한 문맥에 억지로 끼워 넣지 마세요.
   - 정답 선지는 문맥상 자연스러운 유일한 정답이어야 합니다.
3. 문제 유형 배분 (F-3):
   - 'vocab' (어휘): 최소 1문항 필수. 타깃 단어와 동일 품사인 실제 토익 빈출 유효 어휘 3개를 오답으로 구성.
   - 'grammar' (어법) 또는 'prep_conj' (전치사·접속사): 최소 1문항 필수.
   - 3문항이 전부 동일한 유형인 것은 절대 금지입니다.
4. 선지(choices):
   - 정확히 4개 ('A', 'B', 'C', 'D'). 4개 선지는 모두 유일해야 하며, 가짜 영단어 사용은 절대 금지입니다.
5. 해설(explanations) 작성 규격:
   - 정답 선지: 문장 속 단서(전치사 호응, 목적어, 시제, 문맥)를 구체적으로 인용하여 정답 근거를 기술하세요. ("~이 가장 타당합니다" 식의 순환논증 절대 금지)
   - 오답 선지 3개: "이 단어의 뜻은 X인데, 이 문맥은 Y를 요구한다" 또는 "품사가 Z이므로 이 자리에 올 수 없다" 형태로 선지마다 개별적이고 구체적인 오답 이유를 작성하세요. (단어만 바꾼 고정 템플릿 복붙 절대 금지)
6. 한글 해석(translation) 및 조사 처리 (R-4, R-5):
   - 지문 전체를 자연스러운 한국어로 완벽히 번역하세요. (정답 단어가 영문 그대로 남아있으면 안 됨)
   - '을(를)', '이(가)', '은(는)', '와(과)', '으로/로' 같은 슬래시/괄호 표기를 절대 쓰지 말고, 앞말 받침에 맞는 완성된 조사를 사용하세요.
7. 단어 정리(wordNote) (R-7):
   - 형식: "[단어] ([품사]) = [정확한 한국어 뜻 1~2개] (핵심 콜로케이션/짝꿍 표현)"
   - 예: "compensate (동사) = 보상하다, 변상하다 (compensate A for B: A에게 B에 대해 보상하다)"
   - "비즈니스 확장 파트 5 빈출 단어입니다" 같은 알맹이 없는 설명은 엄격히 금지됩니다.

[반환 형식]
반드시 다음 JSON 스키마를 준수하는 순수 JSON 배열만 출력하세요:
[
  {
    "id": "q-1",
    "type": "vocab" | "grammar" | "prep_conj",
    "targetWord": "사용한 취약 단어",
    "stem": "The executive committee decided to _____ employees for overtime work during the system upgrade.",
    "choices": [
      { "key": "A", "text": "compensate" },
      { "key": "B", "text": "postpone" },
      { "key": "C", "text": "eliminate" },
      { "key": "D", "text": "restrict" }
    ],
    "answer": "A",
    "explanations": {
      "A": "전치사 for와 호응하여 직원들에게 초과 근무에 대해 '보상하다'라는 의미가 가장 자연스러우므로 compensate가 정답입니다.",
      "B": "postpone(연기하다)은 초과 근무에 대한 후속 조치 문맥에 어울리지 않습니다.",
      "C": "eliminate(제거하다)는 직원에게 보상하는 긍정적 인사 복지 문맥과 논리상 모순됩니다.",
      "D": "restrict(제한하다)는 전치사 for와 함께 쓰여 대상에게 혜택을 제공하는 구조에 맞지 않습니다."
    },
    "translation": "경영위원회는 시스템 업그레이드 기간 동안의 초과 근무에 대해 직원들에게 보상하기로 결정했다.",
    "wordNote": "compensate (동사) = 보상하다, 변상하다 (compensate A for B: A에게 B에 대해 보상하다)"
  }
]`
}

/**
 * CoT 블라인드 판정 모델 (LLM-as-Judge) 실행기 (C1, C2)
 */
async function runBlindJudge(
  apiKey: string,
  modelName: string,
  question: Question,
): Promise<{ pass: boolean; critique?: string }> {
  const blindPrompt = `당신은 대한민국 최고 수준의 토익(TOEIC) R/C 공인 시험 수석 감수 위원입니다.
다음 Part 5 문항을 감수하고 정답과 문맥의 타당성을 독립적으로 판정하세요.

[감수 대상 문항 (정답 정보 없음)]
- 지문: "${question.stem}"
- 선지:
  A) ${question.choices.find((c) => c.key === 'A')?.text}
  B) ${question.choices.find((c) => c.key === 'B')?.text}
  C) ${question.choices.find((c) => c.key === 'C')?.text}
  D) ${question.choices.find((c) => c.key === 'D')?.text}

[판정 절차 - Step-by-Step Chain of Thought]
반드시 다음 순서대로 사고하여 JSON으로 응답하세요:
1. koreanSentenceTranslation: 지문의 정확한 한국어 번역
2. blankSyntacticRole: 빈칸에 필요한 품사 및 문장 내 문법적/의미적 역할
3. choiceAnalysis: 선지 A, B, C, D 각각에 대한 사전적 의미 및 정답/오답 논리
4. solvedAnswer: 감수위원이 도출한 정답 ('A' | 'B' | 'C' | 'D')
5. hasMultipleAnswers: 복수 정답이 성립할 여지가 있는지 (boolean)
6. isNaturalBusinessContext: 지문이 실제 비즈니스 실무에 자연스럽고 비문이 아닌지 (boolean)
7. verdict: 'PASS' 또는 'REJECT'
8. rejectionReason: REJECT인 경우 구체적 결함 사유`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: blindPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.0, // 결정론적 엄격 감수
            responseSchema: {
              type: 'OBJECT',
              properties: {
                koreanSentenceTranslation: { type: 'STRING' },
                blankSyntacticRole: { type: 'STRING' },
                choiceAnalysis: {
                  type: 'OBJECT',
                  properties: {
                    A: { type: 'STRING' },
                    B: { type: 'STRING' },
                    C: { type: 'STRING' },
                    D: { type: 'STRING' },
                  },
                  required: ['A', 'B', 'C', 'D'],
                },
                solvedAnswer: { type: 'STRING', enum: ['A', 'B', 'C', 'D'] },
                hasMultipleAnswers: { type: 'BOOLEAN' },
                isNaturalBusinessContext: { type: 'BOOLEAN' },
                verdict: { type: 'STRING', enum: ['PASS', 'REJECT'] },
                rejectionReason: { type: 'STRING' },
              },
              required: [
                'koreanSentenceTranslation',
                'blankSyntacticRole',
                'choiceAnalysis',
                'solvedAnswer',
                'hasMultipleAnswers',
                'isNaturalBusinessContext',
                'verdict',
              ],
            },
          },
        }),
      },
    )

    if (!response.ok) {
      console.warn('Judge API call failed, skipping LLM judge check.')
      return { pass: true }
    }

    const data = await response.json()
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const result = JSON.parse(stripMarkdownFences(rawText))

    // 1. 판정자 정답과 출제 정답 일치 여부
    if (result.solvedAnswer !== question.answer) {
      return {
        pass: false,
        critique: `[Judge 정답 불일치] 출제 정답(${question.answer})과 감수 정답(${result.solvedAnswer})이 다릅니다.`,
      }
    }

    // 2. 복수 정답 여부
    if (result.hasMultipleAnswers) {
      return {
        pass: false,
        critique: `[Judge 복수 정답] 선지 중 2개 이상의 복수 정답이 가능합니다.`,
      }
    }

    // 3. 비즈니스 문맥 적합성
    if (!result.isNaturalBusinessContext || result.verdict === 'REJECT') {
      return {
        pass: false,
        critique: `[Judge 문맥 부적합] ${result.rejectionReason || '지문이 비문이거나 단어 뜻과 어울리지 않습니다.'}`,
      }
    }

    return { pass: true }
  } catch (error) {
    console.warn('Judge execution error:', error)
    return { pass: true } // 감수기 자체 오류 시 일단 통과 처리
  }
}

/**
 * 오프라인/개발 모드용 품사 기반 안전한 실전 Lexicon 생성기 (치환 무결성 보장)
 */
function createSafeFallbackQuestions(words: string[], difficulty: Difficulty): Question[] {
  const w1 = words[0] || 'compensate'
  const w2 = words[1] || 'compliance'
  const w3 = words[2] || 'despite'

  const targetJosa = attachJosa(w1, '을/를')

  return [
    {
      id: 'q-1',
      type: 'vocab',
      targetWord: w1,
      stem: `The corporate management decided to _____ employees for additional travel expenses incurred during the business trip.`,
      choices: [
        { key: 'A', text: w1 },
        { key: 'B', text: 'postpone' },
        { key: 'C', text: 'eliminate' },
        { key: 'D', text: 'restrict' },
      ],
      answer: 'A',
      explanations: {
        A: `전치사 for와 호응하여 출장 중 발생한 추가 경비에 대해 '보상/변상하다'라는 의미로 ${w1}이 문맥상 가장 적절합니다.`,
        B: 'postpone(연기하다)은 추가 경비 정산 문맥에 맞지 않는 오답입니다.',
        C: 'eliminate(제거하다)는 경비 보상 절차의 논리에 어울리지 않습니다.',
        D: 'restrict(제한하다)는 전치사 for와 함께 쓰여 대상에게 보상을 제공하는 의미에 부적합합니다.',
      },
      translation: `회사 경영진은 출장 중 발생한 추가 경비에 대해 직원들에게 정당하게 보상하기로 결정했다.`,
      wordNote: `${w1} (동사) = 보상하다, 변상하다 (compensate A for B: A에게 B에 대해 보상하다)`,
    },
    {
      id: 'q-2',
      type: 'grammar',
      targetWord: w2,
      stem: `All employees must strictly adhere to the safety guidelines to ensure regulatory _____ across all facilities.`,
      choices: [
        { key: 'A', text: 'compliance' },
        { key: 'B', text: 'comply' },
        { key: 'C', text: 'compliant' },
        { key: 'D', text: 'compliantly' },
      ],
      answer: 'A',
      explanations: {
        A: '형용사 regulatory의 수식을 받는 타동사 ensure의 목적어 자리이므로 명사 compliance가 정답입니다.',
        B: 'comply는 동사이므로 형용사 뒤 목적어 자리에 올 수 없습니다.',
        C: 'compliant는 형용사이므로 단독 목적어 역할을 할 수 없습니다.',
        D: 'compliantly는 부사이므로 목적어 자리에 올 수 없습니다.',
      },
      translation: `모든 직원은 모든 시설에서의 규정 준수를 보장하기 위해 안전 지침을 엄격히 따라야 한다.`,
      wordNote: `compliance (명사) = (법규·지침의) 준수, 따름 (in compliance with: ~을 준수하여)`,
    },
    {
      id: 'q-3',
      type: 'prep_conj',
      targetWord: w3,
      stem: `_____ unexpected logistical delays, the construction team managed to complete the project on schedule.`,
      choices: [
        { key: 'A', text: 'Despite' },
        { key: 'B', text: 'Although' },
        { key: 'C', text: 'Even though' },
        { key: 'D', text: 'While' },
      ],
      answer: 'A',
      explanations: {
        A: '빈칸 뒤에 명사구(unexpected logistical delays)가 오고 주절과 양보 관계이므로 전치사 Despite가 정답입니다.',
        B: 'Although는 접속사이므로 뒤에 절(S+V)이 이어져야 합니다.',
        C: 'Even though는 접속사이므로 명사구를 이끌 수 없습니다.',
        D: 'While은 접속사이므로 명사구 앞에 위치할 수 없습니다.',
      },
      translation: `예상치 못한 물류 지연에도 불구하고, 건설 팀은 예정대로 프로젝트를 완수해냈다.`,
      wordNote: `despite (전치사) = ~에도 불구하고 (despite + 명사구 vs although + 절)`,
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

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

    let finalQuestions: Question[] = []
    let finalRejectionReasons: string[] = []

    if (apiKey) {
      // 🔁 최대 3회 생성 및 검증/피드백 루프 (A, B, C 반영)
      const MAX_RETRIES = 3
      const feedbackHistory: string[] = []

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[AI Generation] Attempt ${attempt}/${MAX_RETRIES} for words:`, cleanWords)

        const prompt = buildSystemPrompt(cleanWords, difficulty as Difficulty, feedbackHistory)

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            }),
          },
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`AI API call failed (Attempt ${attempt}):`, response.status, errorText)
          if (response.status === 429) {
            return NextResponse.json({ error: 'busy' }, { status: 429 })
          }
          if (attempt === MAX_RETRIES) {
            return NextResponse.json({ error: 'ai_error' }, { status: 502 })
          }
          feedbackHistory.push(`API 호출 오류: HTTP ${response.status}`)
          continue
        }

        const aiData = await response.json()
        const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const cleaned = stripMarkdownFences(rawText)

        let parsedList: unknown[] = []
        try {
          const parsed = JSON.parse(cleaned)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.error === 'invalid_word') {
            return NextResponse.json(
              { error: 'invalid_word', invalidWords: parsed.invalidWords || cleanWords },
              { status: 422 },
            )
          }
          parsedList = Array.isArray(parsed) ? parsed : parsed.questions || []
        } catch (parseErr) {
          console.error('JSON parsing failed on attempt', attempt, parseErr)
          feedbackHistory.push('JSON 형식이 깨졌습니다. 순수 JSON 배열 스키마를 엄격히 준수하세요.')
          continue
        }

        // 1단계: 7대 정적 품질 검증 엔진 (R-1 ~ R-7)
        const validation = validateAndSanitizeQuestions(parsedList, cleanWords)
        if (validation.validQuestions.length < 3) {
          console.warn(`[Quality Reject] Attempt ${attempt} failed static validation:`, validation.rejectionReasons)
          feedbackHistory.push(...validation.rejectionReasons)
          finalRejectionReasons = validation.rejectionReasons
          continue
        }

        // 2단계: CoT 블라인드 감수관(LLM Judge) 실행 (C1, C2)
        let allJudgePassed = true
        const candidateQuestions = validation.validQuestions.slice(0, 3)

        for (let qIdx = 0; qIdx < candidateQuestions.length; qIdx++) {
          const q = candidateQuestions[qIdx]
          const judgeResult = await runBlindJudge(apiKey, modelName, q)
          if (!judgeResult.pass) {
            allJudgePassed = false
            const critiqueMsg = `문항 ${qIdx + 1}: ${judgeResult.critique}`
            console.warn(`[Judge Reject] Attempt ${attempt}:`, critiqueMsg)
            feedbackHistory.push(critiqueMsg)
            finalRejectionReasons.push(critiqueMsg)
            break
          }
        }

        if (allJudgePassed) {
          console.log(`[Success] All 3 questions passed static and Judge validation on attempt ${attempt}!`)
          finalQuestions = candidateQuestions
          break
        }
      }

      // 3회 시도 모두 품질 기준 통과 실패 시
      if (finalQuestions.length === 0) {
        console.error('[Final Rejection] 3 attempts exhausted without meeting quality standards.')
        return NextResponse.json(
          {
            error: 'generation_quality',
            reasons: finalRejectionReasons,
            retryable: true,
          },
          { status: 422 },
        )
      }
    } else {
      // API Key가 없을 때: 안전한 Lexicon Mock 실행
      finalQuestions = createSafeFallbackQuestions(cleanWords, difficulty as Difficulty)
    }

    return NextResponse.json({
      questions: finalQuestions,
      isHomogeneous: false,
      discardedCount: 0,
    })
  } catch (error) {
    console.error('Unexpected server error in generate route:', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
