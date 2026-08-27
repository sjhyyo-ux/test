import { hasForbiddenJosaPattern } from './korean-josa'
import type { Choice, ChoiceKey, Question, QuestionType } from './quiz-types'

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
 * 타깃 단어의 어간 정규화 및 굴절형(Inflections) 목록 생성 엔진 (B2, D1 반영)
 * - 묵음 e 삭제: compensate -> compensated, compensating, compensation, compensatory
 * - 자음 중복: refer -> referred, referring, referral
 * - y -> i: apply -> applied, applies, applying, application
 * - 다단어 구동사: prior to, provided that
 */
export function generateInflections(rawWord: string): string[] {
  const word = rawWord.trim().toLowerCase()
  if (!word) return []

  // 다단어 구문 처리 (공백 포함)
  if (word.includes(' ') || word.includes('-')) {
    const normalized = word.replace(/[\s-]+/g, '[\\s-]+')
    return [word, normalized]
  }

  const results = new Set<string>()
  results.add(word)

  // 1. 기본 어간 및 규칙형 생성
  if (word.endsWith('e')) {
    const stem = word.slice(0, -1) // compensate -> compensat
    results.add(`${stem}ed`) // compensated
    results.add(`${stem}ing`) // compensating
    results.add(`${stem}ion`) // compensation
    results.add(`${stem}ions`) // compensations
    results.add(`${stem}ive`) // compensative
    results.add(`${stem}ory`) // compensatory
    results.add(`${stem}able`) // compensatable
    results.add(`${word}s`) // compensates
    results.add(`${word}d`) // compensated
  } else if (word.endsWith('y') && word.length > 2 && !/[aeiou]y$/.test(word)) {
    const stem = word.slice(0, -1) // apply -> appl
    results.add(`${stem}ies`) // applies
    results.add(`${stem}ied`) // applied
    results.add(`${stem}ying`) // applying
    results.add(`${stem}ication`) // application
    results.add(`${stem}icant`) // applicant
    results.add(`${stem}icants`) // applicants
    results.add(`${stem}icable`) // applicable
  } else if (/[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnprtz]$/.test(word) && word.length <= 5) {
    // 자음 중복 (단모음+단자음): refer, run, stop, plan
    const lastChar = word.slice(-1)
    results.add(`${word}${lastChar}ed`) // referred
    results.add(`${word}${lastChar}ing`) // referring
    results.add(`${word}${lastChar}al`) // referral
    results.add(`${word}s`)
  } else {
    results.add(`${word}s`)
    results.add(`${word}es`)
    results.add(`${word}ed`)
    results.add(`${word}ing`)
    results.add(`${word}tion`)
    results.add(`${word}sion`)
    results.add(`${word}ment`)
    results.add(`${word}ance`)
    results.add(`${word}ence`)
    results.add(`${word}able`)
    results.add(`${word}ive`)
    results.add(`${word}ly`)
  }

  return Array.from(results).filter((w) => w.length >= 2)
}

/**
 * 지문 내 정답 단어 누출 탐지기 (R-2)
 * 지문에서 '_____'를 공백으로 치환 후, 단어 경계(\b) 기준으로 정답 단어/굴절형이 노출되었는지 전수 검사
 */
export function checkStemLeakage(
  stem: string,
  targetWord: string,
  answerChoiceText?: string,
): { leaked: boolean; leakedWord?: string } {
  if (!stem) return { leaked: false }

  // 지문에서 밑줄 마커 제거
  const stemWithoutBlank = stem.replace(/_+/g, ' ')

  // 검사 대상 단어 (타깃 단어 + 정답 선지 텍스트)
  const wordsToCheck = new Set<string>()
  if (targetWord) {
    generateInflections(targetWord).forEach((inf) => wordsToCheck.add(inf))
  }
  if (answerChoiceText) {
    generateInflections(answerChoiceText).forEach((inf) => wordsToCheck.add(inf))
  }

  for (const word of wordsToCheck) {
    // 다단어 구문 대응 정규식
    const pattern = word.includes('[\\s-]')
      ? new RegExp(`\\b${word}\\b`, 'i')
      : new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i')

    if (pattern.test(stemWithoutBlank)) {
      return { leaked: true, leakedWord: word }
    }
  }

  return { leaked: false }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 문자 3-gram(Tri-gram) 생성기 (R-6)
 */
function getChar3Grams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, '')
  const grams = new Set<string>()
  for (let i = 0; i <= normalized.length - 3; i++) {
    grams.add(normalized.slice(i, i + 3))
  }
  return grams
}

/**
 * 두 문자열 간의 3-gram Jaccard 유사도 계산 (0.0 ~ 1.0)
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
  const g1 = getChar3Grams(text1)
  const g2 = getChar3Grams(text2)
  if (g1.size === 0 || g2.size === 0) return 0

  let intersection = 0
  for (const item of g1) {
    if (g2.has(item)) intersection++
  }
  const union = g1.size + g2.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * 해설 템플릿 중복 복붙 탐지기 (R-6)
 * 4개 선지 해설에서 선지 텍스트와 키를 [CHOICE]로 마스킹 후 쌍별 3-gram Jaccard 유사도가 0.70 이상인지 검사
 */
export function checkExplanationTemplateDuplication(
  explanations: Record<string, string>,
  choices?: { key: ChoiceKey; text: string }[],
): { isDuplicate: boolean; maxSimilarity: number } {
  const keys: ChoiceKey[] = ['A', 'B', 'C', 'D']
  const maskedTexts: string[] = []

  for (const k of keys) {
    let exp = explanations[k] || ''
    // 선지 키와 텍스트를 마스킹
    exp = exp.replace(new RegExp(`\\b${k}\\b`, 'gi'), '[CHOICE]')
    if (choices) {
      for (const c of choices) {
        if (c.text) {
          exp = exp.replace(new RegExp(escapeRegExp(c.text), 'gi'), '[CHOICE]')
        }
      }
    }
    maskedTexts.push(exp)
  }

  let maxSimilarity = 0
  for (let i = 0; i < maskedTexts.length; i++) {
    for (let j = i + 1; j < maskedTexts.length; j++) {
      const sim = calculateJaccardSimilarity(maskedTexts[i], maskedTexts[j])
      if (sim > maxSimilarity) {
        maxSimilarity = sim
      }
    }
  }

  return {
    isDuplicate: maxSimilarity >= 0.7,
    maxSimilarity,
  }
}

/**
 * 단어 정리(wordNote) 무결성 검증기 (R-7)
 */
export function validateWordNoteQuality(
  wordNote: string,
  targetWord: string,
): { isValid: boolean; reason?: string } {
  if (!wordNote || typeof wordNote !== 'string' || wordNote.trim().length < 5) {
    return { isValid: false, reason: 'wordNote가 비어있거나 너무 짧습니다.' }
  }

  // 타깃 단어 포함 여부 검사
  const targetStem = getWordStem(targetWord)
  if (!wordNote.toLowerCase().includes(targetStem)) {
    return { isValid: false, reason: 'wordNote에 타깃 단어가 포함되지 않았습니다.' }
  }

  // 한글 의미(한글 문자 2글자 이상) 포함 여부 검사
  const koreanMatches = wordNote.match(/[가-힣]{2,}/g)
  if (!koreanMatches || koreanMatches.length === 0) {
    return { isValid: false, reason: 'wordNote에 한글 뜻이 포함되지 않았습니다.' }
  }

  // 껍데기 템플릿 문구만 있는 경우 탐지
  const genericClichés = [
    '비즈니스 확장 및 전략 수립 파트 5 빈출 단어입니다',
    '비즈니스 확장 및 전략 수립',
    '토익 빈출 단어입니다',
    '파트 5 빈출 단어입니다',
    '핵심 표현입니다',
  ]
  const matchedCliche = genericClichés.find((cliche) => wordNote.includes(cliche))
  if (matchedCliche) {
    const textWithoutCliche = wordNote.replace(matchedCliche, '').replace(/[=,.\s]/g, '')
    const remainingKorean = textWithoutCliche.match(/[가-힣]{2,}/g)
    if (!remainingKorean || remainingKorean.length === 0) {
      return { isValid: false, reason: 'wordNote가 단어의 실제 뜻 없이 템플릿 설명만 포함하고 있습니다.' }
    }
  }

  return { isValid: true }
}

/**
 * 7대 정적 품질 검증 엔진 (R-1 ~ R-7)
 */
export function validateQuestionQuality(
  question: Partial<Question>,
  targetWords: string[] = [],
): { isValid: boolean; ruleId?: string; reason?: string } {
  // R-1: 빈칸 마커 정밀 검사
  if (!question.stem || typeof question.stem !== 'string') {
    return { isValid: false, ruleId: 'R-1', reason: '지문(stem)이 없습니다.' }
  }
  const underlineMatches = question.stem.match(/_+/g)
  if (!underlineMatches || underlineMatches.length !== 1 || underlineMatches[0] !== '_____') {
    return {
      isValid: false,
      ruleId: 'R-1',
      reason: `빈칸 마커는 정확히 '_____' (밑줄 5개) 1개여야 합니다. (발견: ${underlineMatches?.join(', ') || '없음'})`,
    }
  }

  // R-3: 선지 무결성 검증
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    return { isValid: false, ruleId: 'R-3', reason: '선지는 정확히 4개여야 합니다.' }
  }
  const choiceKeys = new Set<string>()
  const choiceTexts = new Set<string>()
  for (const c of question.choices) {
    if (!c || !c.key || !c.text || !c.text.trim()) {
      return { isValid: false, ruleId: 'R-3', reason: '선지 key 또는 text가 비어있습니다.' }
    }
    if (!VALID_CHOICE_KEYS.includes(c.key)) {
      return { isValid: false, ruleId: 'R-3', reason: `유효하지 않은 선지 key: ${c.key}` }
    }
    if (choiceKeys.has(c.key)) {
      return { isValid: false, ruleId: 'R-3', reason: `선지 key 중복: ${c.key}` }
    }
    if (choiceTexts.has(c.text.trim().toLowerCase())) {
      return { isValid: false, ruleId: 'R-3', reason: `선지 text 중복: ${c.text}` }
    }
    choiceKeys.add(c.key)
    choiceTexts.add(c.text.trim().toLowerCase())
  }
  if (!question.answer || !choiceKeys.has(question.answer)) {
    return { isValid: false, ruleId: 'R-3', reason: `정답 key(${question.answer})가 선지에 없습니다.` }
  }

  const answerChoice = question.choices.find((c) => c.key === question.answer)
  const targetWord = question.targetWord || targetWords[0] || ''

  // R-2: 지문 내 정답 누출 방지
  const leakage = checkStemLeakage(question.stem, targetWord, answerChoice?.text)
  if (leakage.leaked) {
    return {
      isValid: false,
      ruleId: 'R-2',
      reason: `지문에 정답/타깃 단어 '${leakage.leakedWord}'가 그대로 노출되었습니다.`,
    }
  }

  // R-4: 한글 해석 내 정답 영단어 잔존 금지 (CEO, HR 등 일반 약어는 허용)
  if (!question.translation || typeof question.translation !== 'string') {
    return { isValid: false, ruleId: 'R-4', reason: '한글 해석(translation)이 없습니다.' }
  }
  const wordsToCheckInTranslation = [targetWord, answerChoice?.text || '']
  for (const w of wordsToCheckInTranslation) {
    if (!w) continue
    const inflections = generateInflections(w)
    for (const inf of inflections) {
      const pattern = new RegExp(`\\b${escapeRegExp(inf)}\\b`, 'i')
      if (pattern.test(question.translation)) {
        return {
          isValid: false,
          ruleId: 'R-4',
          reason: `한글 해석에 영단어 '${inf}'가 번역되지 않고 영문 그대로 남아있습니다.`,
        }
      }
    }
  }

  // R-5: 미처리 슬래시/괄호 조사 패턴 금지
  if (
    hasForbiddenJosaPattern(question.translation) ||
    (question.wordNote && hasForbiddenJosaPattern(question.wordNote))
  ) {
    return {
      isValid: false,
      ruleId: 'R-5',
      reason: '한글 해석 또는 단어 정리에 을(를), 은/는 등의 미처리 조사 패턴이 포함되어 있습니다.',
    }
  }

  // R-6: 해설 무결성 및 템플릿 복붙 탐지
  if (!question.explanations || typeof question.explanations !== 'object') {
    return { isValid: false, ruleId: 'R-6', reason: '해설(explanations)이 없습니다.' }
  }
  for (const k of VALID_CHOICE_KEYS) {
    if (!question.explanations[k] || !question.explanations[k].trim()) {
      return { isValid: false, ruleId: 'R-6', reason: `선지 ${k}의 해설이 비어있습니다.` }
    }
  }
  const duplication = checkExplanationTemplateDuplication(
    question.explanations as Record<string, string>,
    question.choices as { key: ChoiceKey; text: string }[],
  )
  if (duplication.isDuplicate) {
    return {
      isValid: false,
      ruleId: 'R-6',
      reason: `해설 간 문자 3-gram 유사도(${duplication.maxSimilarity.toFixed(2)})가 너무 높아 템플릿 복붙으로 판정되었습니다.`,
    }
  }

  // R-7: 단어 정리 무결성 검증
  const wordNoteCheck = validateWordNoteQuality(question.wordNote || '', targetWord)
  if (!wordNoteCheck.isValid) {
    return { isValid: false, ruleId: 'R-7', reason: wordNoteCheck.reason }
  }

  return { isValid: true }
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
 */
export function validateChoices(question: {
  choices?: { key?: string; text?: string }[]
  answer?: string
}): boolean {
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    return false
  }

  const keys = new Set<string>()
  const texts = new Set<string>()
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
    if (texts.has(choice.text.trim().toLowerCase())) {
      return false // 중복 선지 텍스트
    }
    keys.add(choice.key)
    texts.add(choice.text.trim().toLowerCase())
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
  rejectionReasons: string[]
}

/**
 * AI 원본 응답 문항 배열을 7대 품질 검증 엔진(R-1 ~ R-7)으로 정제
 */
export function validateAndSanitizeQuestions(
  rawList: unknown[],
  targetWords: string[],
): ValidationResult {
  if (!Array.isArray(rawList)) {
    return { validQuestions: [], discardedCount: 0, isHomogeneous: false, rejectionReasons: ['응답이 배열 형식이 아닙니다.'] }
  }

  const validQuestions: Question[] = []
  const rejectionReasons: string[] = []
  let discardedCount = 0

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i] as Partial<Question>
    if (!raw || typeof raw !== 'object') {
      discardedCount++
      rejectionReasons.push(`문항 ${i + 1}: 객체 형식이 아닙니다.`)
      continue
    }

    // 7대 정적 품질 검증 엔진 실행
    const quality = validateQuestionQuality(raw, targetWords)
    if (!quality.isValid) {
      discardedCount++
      rejectionReasons.push(`문항 ${i + 1} [${quality.ruleId}]: ${quality.reason}`)
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
      stem: raw.stem!,
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

  const finalQuestions = validQuestions.slice(0, 3)

  return {
    validQuestions: finalQuestions,
    discardedCount: discardedCount + Math.max(0, validQuestions.length - 3),
    isHomogeneous: hasHomogeneousTypes(finalQuestions),
    rejectionReasons,
  }
}
