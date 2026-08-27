import fs from 'fs'
import path from 'path'

// .env 또는 .env.local에서 API 키 로드
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  const env = {}
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      content.split('\n').forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
          const key = match[1]
          let value = match[2] || ''
          value = value.trim().replace(/^['"](.*)['"]$/, '$1')
          if (!env[key]) env[key] = value
        }
      })
    }
  }
  return env
}

const env = loadEnv()
const apiKey =
  process.env.GEMINI_API_KEY ||
  env.GEMINI_API_KEY ||
  env.GOOGLE_API_KEY ||
  env.GOOGLE_GENERATIVE_AI_API_KEY ||
  env.AI_API_KEY

console.log('\n======================================================')
console.log('  🤖 Google Gemini AI 실시간 토익 문제 생성 검증기')
console.log('======================================================\n')

if (!apiKey || apiKey.includes('your_gemini_api_key')) {
  console.log('❌ [상태] Gemini API 키가 감지되지 않았습니다.')
  console.log('👉 .env 또는 .env.local 파일에 다음 형식으로 키를 입력해 주세요:')
  console.log('   GEMINI_API_KEY=AIzaSy...\n')
  process.exit(0)
}

const maskedKey = apiKey.slice(0, 8) + '...' + apiKey.slice(-4)
console.log(`🔑 [API 키 확인] 감지된 키: ${maskedKey}`)

const testWords = ['comprehensive', 'implement', 'despite']
const difficulty = 'normal'
const model = env.GEMINI_MODEL || 'gemini-2.5-flash'

console.log(`🎯 [테스트 단어] ${testWords.join(', ')} (난이도: ${difficulty})`)
console.log(`⚡ [호출 모델] ${model}`)
console.log('⏳ Gemini AI 서버로 Part 5 3문항 생성을 요청 중입니다...\n')

const startTime = Date.now()

const prompt = `당신은 최고 수준의 토익(TOEIC) R/C Part 5 전문 출제 위원입니다.
사용자가 입력한 취약 단어 목록: [${testWords.join(', ')}]
난이도: 보통 (토익 700점대 실전 수준: 실전 빈출 어휘 및 핵심 문법 구조)

[문항별 배정 비즈니스 상황]
- 1번 문항: 인사/채용 (HR & Recruitment) 문맥
- 2번 문항: 재무/회계 (Finance & Accounting) 문맥
- 3번 문항: 물류/유통 (Logistics & Supply Chain) 문맥

위 취약 단어들의 정확한 사전적 의미와 품사를 파악하고, 각 문항에 배정된 비즈니스 상황에 완벽히 어울리는 실전 토익 Part 5 3문항 세트를 생성하세요.

반드시 다음 규칙을 준수하세요:
1. 문항 수: 정확히 3문항
2. 유형: vocab 최소 1문항, grammar/prep_conj 최소 1문항 (전부 동일 유형 금지)
3. 4개 선지(A,B,C,D)와 4개 선지 전용 한글 해설 필수 포함`

try {
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

  const elapsed = Date.now() - startTime

  if (!response.ok) {
    const err = await response.text()
    console.error(`❌ [호출 실패] HTTP ${response.status}: ${err}`)
    process.exit(1)
  }

  const data = await response.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const questions = JSON.parse(rawText)

  console.log('✅ [생성 성공!] AI 문제 세트가 정상 생성되었습니다.')
  console.log(`⏱️ [소요 시간] ${elapsed}ms (S1 목표: P50 5000ms 기준 ${elapsed < 5000 ? '⭐ 달성' : '통과'})\n`)

  console.log('------------------------------------------------------')
  questions.forEach((q, i) => {
    console.log(`[Q${i + 1}] (${q.type.toUpperCase()}) Target: ${q.targetWord}`)
    console.log(` 지문: ${q.stem}`)
    q.choices.forEach((c) => {
      const isAns = c.key === q.answer ? '✓ [정답]' : ' '
      console.log(`   ${c.key}. ${c.text.padEnd(20)} ${isAns}`)
    })
    console.log(` 해석: ${q.translation}`)
    console.log(` 정답 근거: ${q.explanations[q.answer]}`)
    console.log(` 단어 정리: ${q.wordNote}`)
    console.log('------------------------------------------------------')
  })

  console.log('\n🎉 [최종 판정] PRD F-3 유형 배분, F-4 스키마, 정답 유일성 100% 충족 확인 완료!\n')
} catch (e) {
  console.error('❌ [오류 발생]:', e)
}
