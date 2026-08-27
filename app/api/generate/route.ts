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

function buildSystemPrompt(words: string[], difficulty: Difficulty): string {
  const diffDesc =
    difficulty === 'easy'
      ? '쉬움 (토익 600점대 수준, 기본 어휘 및 기초 문법 구조)'
      : difficulty === 'hard'
        ? '어려움 (토익 800점대 후반 이상 수준, 까다로운 혼동 어휘, 고급 어법 및 함정 선지)'
        : '보통 (토익 700점대 실전 수준, 실전 빈출 문법 및 어휘)'

  return `당신은 최고 수준의 토익(TOEIC) R/C Part 5 전문 출제 위원입니다.
사용자가 입력한 취약 단어 목록: [${words.join(', ')}]
난이도: ${diffDesc}

위 취약 단어들을 반드시 지문(stem) 또는 선지(choices)에 직접 활용하여 실전 토익 Part 5 3문항 세트를 생성하세요.

[핵심 출제 규칙 - 위반 절대 금지]
0. 단어 유효성 검사: 입력된 취약 단어가 실제 영어 단어가 아니거나 무의미한 난타 문자열(예: asdfgh, qwrty, zzzzz 등)인 경우, 억지로 가짜 문제를 만들지 말고 반드시 다음 JSON 형태로만 응답하세요:
   { "error": "invalid_word", "invalidWords": ["해당단어"] }
1. 문항 수: 반드시 정확히 3문항을 생성하세요.
2. 문제 유형 (3문항 유형이 전부 동일하면 안 됨):
   - 'vocab' (어휘): 최소 1문항 필수. 타깃 단어와 혼동되는 유의어/파생어 중 문맥에 맞는 것 고르기.
   - 'grammar' (어법) 또는 'prep_conj' (전치사·접속사): 최소 1문항 필수.
   - 3문항의 유형이 전부 동일한 것은 절대 금지입니다 (최소 2개 이상 유형 혼합).
3. 지문(stem): 빈칸은 반드시 '_____' (밑줄 5개) 토큰으로 표기하세요.
4. 선지(choices): 정확히 4개 ('A', 'B', 'C', 'D')로 구성하며, 정답은 단 하나만 성립해야 합니다.
5. 해설(explanations): 4개 선지 각각에 대한 한글 해설을 모두 작성하세요 (정답 선지는 정답 근거, 오답 3개는 각 오답이 틀린 구체적 이유).
6. 한글 해석(translation) 및 단어 정리(wordNote): 각 문항마다 충실하게 작성하세요.

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
      "A": "to부정사 뒤에는 동사원형이 와야 하므로 implement가 정답입니다.",
      "B": "명사이므로 to 뒤에 바로 올 수 없습니다.",
      "C": "현재분사/동명사는 to부정사 구조에 맞지 않습니다.",
      "D": "과거분사는 올 수 없습니다."
    },
    "translation": "회사는 새로운 정책을 시행하기로 결정했다.",
    "wordNote": "implement = 시행하다, 실행하다 (토익 파트 5 최빈출 동사)"
  }
]`
}

/**
 * API 키가 없을 때 동작하는 지능형 개발용 폴백 생성기
 */
function createFallbackQuestions(words: string[], difficulty: Difficulty): Question[] {
  const w1 = words[0] || 'comprehensive'
  const w2 = words[1] || w1
  const w3 = words[2] || w1

  return [
    {
      id: 'q-1',
      type: 'vocab',
      targetWord: w1,
      stem: `The executive committee requested a _____ evaluation regarding ${w1} before the final decision.`,
      choices: [
        { key: 'A', text: w1 },
        { key: 'B', text: `${w1}-looking` },
        { key: 'C', text: `${w1}ness` },
        { key: 'D', text: `un${w1}` },
      ],
      answer: 'A',
      explanations: {
        A: `문맥상 평가를 수식하는 가장 적절한 어휘로 '${w1}'이 올바릅니다.`,
        B: '실제 토익에서 쓰이지 않는 어색한 복합어입니다.',
        C: '명사 형태로 뒤의 명사 evaluation을 자연스럽게 수식할 수 없습니다.',
        D: '문맥의 논리에 맞지 않는 반의어 형태입니다.',
      },
      translation: `경영위원회는 최종 결정 전에 ${w1}에 관한 면밀한 평가를 요청했다.`,
      wordNote: `${w1} = 토익 빈출 단어. 문맥상의 의미와 수식 관계를 정확히 파악하세요.`,
    },
    {
      id: 'q-2',
      type: 'grammar',
      targetWord: w2,
      stem: `All employees are strongly advised to review the safety procedures _____ for better compliance.`,
      choices: [
        { key: 'A', text: `${w2}ly` },
        { key: 'B', text: `${w2}` },
        { key: 'C', text: `${w2}tion` },
        { key: 'D', text: `${w2}able` },
      ],
      answer: 'A',
      explanations: {
        A: '동사구 review the safety procedures를 뒤에서 수식하는 부사 자리가 적절합니다.',
        B: '원형은 이 위치에서 동사구를 적절히 수식할 수 없습니다.',
        C: '명사 형태는 목적어 뒤에 중복으로 올 수 없습니다.',
        D: '형용사는 동사구를 수식할 수 없습니다.',
      },
      translation: `모든 직원은 규정 준수를 위해 안전 절차를 ${w2}하게 검토할 것을 강력히 권고받는다.`,
      wordNote: `${w2}의 품사 변형 = 문장 구조(동사 수식 부사 자리)를 먼저 확인하세요.`,
    },
    {
      id: 'q-3',
      type: 'prep_conj',
      targetWord: w3,
      stem: `_____ the implementation of ${w3} was challenging, the overall performance improved significantly.`,
      choices: [
        { key: 'A', text: 'Although' },
        { key: 'B', text: 'Despite' },
        { key: 'C', text: 'In spite of' },
        { key: 'D', text: 'Because of' },
      ],
      answer: 'A',
      explanations: {
        A: '빈칸 뒤에 절(the implementation was challenging)이 이어지고 주절과 양보 관계이므로 접속사 Although가 정답입니다.',
        B: '전치사이므로 뒤에 절이 올 수 없습니다.',
        C: '전치사구이므로 절을 이끌 수 없습니다.',
        D: '원인을 나타내는 전치사구로 문맥과 구조에 맞지 않습니다.',
      },
      translation: `${w3}의 시행이 어려웠음에도 불구하고, 전반적인 성과는 크게 향상되었다.`,
      wordNote: `빈칸 뒤가 절(S+V)이면 접속사, 명사(구)면 전치사를 고르는 것이 Part 5의 핵심입니다.`,
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
      process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY

    let parsedQuestions: unknown[] = []

    if (apiKey) {
      const prompt = buildSystemPrompt(cleanWords, difficulty as Difficulty)
      
      // Google Gemini API 호출
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
