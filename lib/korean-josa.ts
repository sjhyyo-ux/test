/**
 * 한국어 조사 자동 결합 유틸리티
 * 한글 유니코드의 종성(받침) 여부를 판별하여 자연스러운 조사를 선택합니다.
 */

export type JosaType = '을/를' | '은/는' | '이/가' | '와/과' | '으로/로'

/**
 * 주어진 한글 문자의 받침 유무 및 종성 인덱스를 판별합니다.
 * @returns { hasBatchim: boolean, isRieul: boolean }
 */
export function checkBatchim(char: string): { hasBatchim: boolean; isRieul: boolean } {
  if (!char) return { hasBatchim: false, isRieul: false }
  const code = char.charCodeAt(0)
  // 한글 음절 범위: AC00 ~ D7A3
  if (code < 0xac00 || code > 0xd7a3) {
    return { hasBatchim: false, isRieul: false }
  }
  const jongseongIndex = (code - 0xac00) % 28
  return {
    hasBatchim: jongseongIndex > 0,
    isRieul: jongseongIndex === 8, // 'ㄹ' 받침
  }
}

/**
 * 단어 뒤에 올바른 조사를 결합하여 반환합니다.
 * @param word 앞 단어 (예: "시장", "방안", "정책", "글로벌")
 * @param josaType 조사 종류 (예: '을/를', '은/는', '이/가', '와/과', '으로/로')
 */
export function attachJosa(word: string, josaType: JosaType): string {
  if (!word) return ''
  const lastChar = word.trim().slice(-1)
  const { hasBatchim, isRieul } = checkBatchim(lastChar)

  switch (josaType) {
    case '을/를':
      return `${word}${hasBatchim ? '을' : '를'}`
    case '은/는':
      return `${word}${hasBatchim ? '은' : '는'}`
    case '이/가':
      return `${word}${hasBatchim ? '이' : '가'}`
    case '와/과':
      return `${word}${hasBatchim ? '과' : '와'}`
    case '으로/로':
      // 받침이 없거나 'ㄹ' 받침인 경우 '로', 그 외 받침이 있는 경우 '으로'
      return `${word}${!hasBatchim || isRieul ? '로' : '으로'}`
    default:
      return word
  }
}

/**
 * 금지된 슬래시/괄호 미처리 조사 패턴 목록 (B1 반영)
 */
export const FORBIDDEN_JOSA_PATTERNS = [
  '을(를)',
  '를(을)',
  '이(가)',
  '가(이)',
  '은(는)',
  '는(은)',
  '와(과)',
  '과(와)',
  '(으)로',
  '로(으로)',
  '을/를',
  '이/가',
  '은/는',
  '와/과',
  '으로/로',
  '(를)',
  '(을)',
  '(이)',
  '(가)',
  '(은)',
  '(는)',
  '(과)',
  '(와)',
  '(로)',
  '(으로)',
] as const

/**
 * 텍스트에 미처리된 조사 슬래시/괄호 패턴이 포함되어 있는지 검사합니다.
 */
export function hasForbiddenJosaPattern(text: string): boolean {
  if (!text) return false
  return FORBIDDEN_JOSA_PATTERNS.some((pattern) => text.includes(pattern))
}
