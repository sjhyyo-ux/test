import type { ChoiceKey, Question, QuestionType } from './quiz-types'

const VALID_CHOICE_KEYS: ChoiceKey[] = ['A', 'B', 'C', 'D']

/**
 * 타깃 단어 어간(Stem) 추출:
 * 단어의 앞 4~5글자를 소문자로 추출하여 파생형(어법/어휘 변형)을 매칭할 수 있도록 한다. (PRD §5.1 EX-5)
 */
export function getWordStem(word: string): string {
  const cleaned = word.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (cleaned.length <= 4) {
    return cleaned
  }
  return cleaned.slice(0, 5)
}

/**
 * EX-5: 지문(stem) 또는 선지(choices)에 입력 단어(또는 파생형)가 포함되어 있는지 검증
 */
export function containsTargetWord(
  question: { stem?: string; choices?: { text?: string }[]; targetWord?: string },
  targetWords: string[],
): boolean {
  if (!question.stem) return false

  const allWordsToCheck = question.targetWord
    ? [question.targetWord, ...targetWords]
    : targetWords

  const stems = allWordsToCheck
    .map(getWordStem)
    .filter((stem) => stem.length >= 2)

  if (stems.length === 0) return true

  const fullText = (
    question.stem +
    ' ' +
    (question.choices?.map((c) => c.text || '').join(' ') || '')
  ).toLowerCase()

  return stems.some((stem) => fullText.includes(stem))
}

/**
 * EX-7: 선지 정합성 검증
 * - choices 배열 길이가 정확히 4개
 * - key가 A, B, C, D로 중복 없이 구성
 * - answer 값이 choices의 key 중에 존재
 * - 선지 텍스트가 비어있지 않음
 */
export function validateChoices(question: {
  choices?: { key?: string; text?: string }[]
  answer?: string
}): boolean {
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    return false
  }

  const keys = new Set<string>()
  for (const choice of question.choices) {
    if (!choice || !choice.key || typeof choice.text !== 'string' || !choice.text.trim()) {
      return false
    }
    if (!VALID_CHOICE_KEYS.includes(choice.key as ChoiceKey)) {
      return false
    }
    if (keys.has(choice.key)) {
      return false // 중복 키
    }
    keys.add(choice.key)
  }

  if (keys.size !== 4) return false
  if (!question.answer || !keys.has(question.answer)) return false

  return true
}

/**
 * EX-8: 4개 선지 각각의 해설 존재 여부 사전 검증
 */
export function validateExplanations(question: {
  explanations?: Record<string, string>
}): boolean {
  if (!question.explanations || typeof question.explanations !== 'object') {
    return false
  }

  for (const key of VALID_CHOICE_KEYS) {
    const explanation = question.explanations[key]
    if (typeof explanation !== 'string' || !explanation.trim()) {
      return false
    }
  }

  return true
}

/**
 * EX-6: 3문항의 유형이 전부 동일한지 검증
 */
export function hasHomogeneousTypes(questions: Question[]): boolean {
  if (questions.length < 2) return false
  const firstType = questions[0].type
  return questions.every((q) => q.type === firstType)
}

export interface ValidationResult {
  validQuestions: Question[]
  discardedCount: number
  isHomogeneous: boolean
}

/**
 * AI 원본 응답 문항 배열을 PRD 우선순위(EX-7 -> EX-8 -> EX-5 -> EX-4)에 따라 검증 및 정제
 */
export function validateAndSanitizeQuestions(
  rawList: unknown[],
  targetWords: string[],
): ValidationResult {
  if (!Array.isArray(rawList)) {
    return { validQuestions: [], discardedCount: 0, isHomogeneous: false }
  }

  const validQuestions: Question[] = []
  let discardedCount = 0

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i] as Partial<Question>
    if (!raw || typeof raw !== 'object') {
      discardedCount++
      continue
    }

    // 1. 필수 필드 존재 여부 (stem, targetWord)
    if (!raw.stem || typeof raw.stem !== 'string' || !raw.stem.trim()) {
      discardedCount++
      continue
    }

    // 2. EX-7 선지 무결성 검증
    if (!validateChoices(raw)) {
      discardedCount++
      continue
    }

    // 3. EX-8 해설 4종 무결성 검증
    if (!validateExplanations(raw)) {
      discardedCount++
      continue
    }

    // 4. EX-5 타깃 단어 매칭 검증
    if (!containsTargetWord(raw, targetWords)) {
      discardedCount++
      continue
    }

    // 통과 문항 정규화
    const type: QuestionType =
      raw.type === 'grammar' || raw.type === 'prep_conj' ? raw.type : 'vocab'

    const targetWord =
      typeof raw.targetWord === 'string' && raw.targetWord.trim()
        ? raw.targetWord.trim()
        : targetWords[i % targetWords.length] || 'Target'

    validQuestions.push({
      id: raw.id ? String(raw.id) : `q-${i + 1}`,
      type,
      targetWord,
      stem: raw.stem,
      choices: (raw.choices as { key: ChoiceKey; text: string }[]).map((c) => ({
        key: c.key,
        text: c.text.trim(),
      })),
      answer: raw.answer as ChoiceKey,
      explanations: {
        A: raw.explanations?.A?.trim() || '',
        B: raw.explanations?.B?.trim() || '',
        C: raw.explanations?.C?.trim() || '',
        D: raw.explanations?.D?.trim() || '',
      },
      translation: raw.translation?.trim() || '',
      wordNote: raw.wordNote?.trim() || '',
    })
  }

  // EX-4: 4개 이상이면 앞에서부터 3개만 취함
  const finalQuestions = validQuestions.slice(0, 3)

  return {
    validQuestions: finalQuestions,
    discardedCount: discardedCount + Math.max(0, validQuestions.length - 3),
    isHomogeneous: hasHomogeneousTypes(finalQuestions),
  }
}
