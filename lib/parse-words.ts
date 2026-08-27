// 취약 단어 입력값 파싱
// 쉼표 분리, 공백 트림, 비영어 제외(EX-3: 영문자·하이픈·어퍼스트로피·내부공백), 중복 제거(F-1), 최대 5개 절삭(EX-12)

export const MAX_WORDS = 5

/** 칩 미리보기에 쓰는 토큰 상태 */
export type TokenStatus = 'used' | 'not-english' | 'over-limit' | 'duplicate'

export interface WordToken {
  raw: string
  status: TokenStatus
}

export interface ParsedWords {
  tokens: WordToken[]
  /** 실제로 문제 생성에 사용될 영어 단어 (최대 5개) */
  used: string[]
  /** 영어가 아니어서 제외된 토큰 */
  excluded: string[]
  /** 5개 초과로 잘린 영어 토큰 */
  truncated: string[]
  /** 중복으로 제외된 토큰 */
  duplicates: string[]
  /** 입력이 비었거나 쉼표·공백만 있는 상태 */
  isEmpty: boolean
}

/**
 * EX-3 허용 문자:
 * 영문자(A-Z, a-z), 하이픈(-), 어퍼스트로피('), 단어 내부 공백(구동사: look forward to)
 */
const ENGLISH_CHAR_PATTERN = /^[A-Za-z][A-Za-z\s'-]*[A-Za-z]$|^[A-Za-z]$/

/** 키보드 연속 난타 패턴 (가로 4글자 이상 연속 자판 배열) */
const KEYBOARD_PATTERNS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'poiuytrewq',
  'lkjhgfdsa',
  'mnbvcxz',
]

function hasKeyboardRowSequence(word: string): boolean {
  if (word.length < 4) return false
  const lower = word.toLowerCase()
  for (const row of KEYBOARD_PATTERNS) {
    for (let i = 0; i <= row.length - 4; i++) {
      const sub = row.slice(i, i + 4)
      if (lower.includes(sub)) {
        return true
      }
    }
  }
  return false
}

/** a,e,i,o,u 모음이 없고 y만으로 구성된 실존 영단어 화이트리스트 */
const VALID_Y_ONLY_WORDS = new Set([
  'by', 'my', 'fly', 'cry', 'dry', 'fry', 'pry', 'shy', 'sky', 'spy', 'try', 'why',
  'gym', 'lynx', 'myth', 'sync', 'crypt', 'hymn', 'cyst', 'gypsy', 'lymph', 'nymph', 'rhythm', 'psych', 'sly', 'wry',
])

/**
 * 실존하지 않는 무작위 문자열(Gibberish) 및 자음 난타 휴리스틱 감지
 */
export function isPlausibleEnglishWord(raw: string): boolean {
  if (!ENGLISH_CHAR_PATTERN.test(raw)) return false

  // 1글자 단어는 'a', 'i', 'A', 'I'만 인정
  if (raw.length === 1) {
    return /^[ai]$/i.test(raw)
  }

  // 어퍼스트로피 축약형 제거 (예: client's -> client, don't -> dont)
  const cleaned = raw.toLowerCase().replace(/'(s|t|d|re|ve|ll|m)\b/g, '').replace(/'/g, '')

  // 공백이나 하이픈으로 분리된 서브 토큰별 검사 (구동사 및 하이픈 복합어 대응)
  const subWords = cleaned.split(/[\s-]+/).filter(Boolean)
  if (subWords.length === 0) return false

  for (const word of subWords) {
    // 1글자 서브토큰은 a, i만 허용
    if (word.length === 1 && !/^[ai]$/.test(word)) {
      return false
    }

    // 키보드 자판 4글자 이상 연속 난타 (asdf, qwer, zxcv, hjkl, dfgh 등)
    if (hasKeyboardRowSequence(word)) {
      return false
    }

    // a, e, i, o, u 모음이 전혀 없는 경우
    if (!/[aeiou]/.test(word)) {
      // y도 없거나, y만 있는데 유효한 y-단어 목록에 없으면 가짜 단어로 판정 (예: zzzz, bcdf, qwrty)
      if (!word.includes('y') || !VALID_Y_ONLY_WORDS.has(word)) {
        return false
      }
    }

    // 동일 문자 3회 이상 연속 (예: aaa, zzz, fff)
    if (/([a-z])\1\1/.test(word)) {
      return false
    }

    // 연속 자음 6개 이상 (예: bcdfghj)
    if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(word)) {
      return false
    }
  }

  return true
}

export function parseWords(raw: string): ParsedWords {
  const pieces = raw
    .split(',')
    .map((piece) => piece.trim().replace(/\s+/g, ' '))
    .filter((piece) => piece.length > 0)

  const tokens: WordToken[] = []
  const used: string[] = []
  const excluded: string[] = []
  const truncated: string[] = []
  const duplicates: string[] = []
  const seenLower = new Set<string>()

  for (const piece of pieces) {
    if (!isPlausibleEnglishWord(piece)) {
      tokens.push({ raw: piece, status: 'not-english' })
      excluded.push(piece)
      continue
    }

    const lower = piece.toLowerCase()
    if (seenLower.has(lower)) {
      tokens.push({ raw: piece, status: 'duplicate' })
      duplicates.push(piece)
      continue
    }
    seenLower.add(lower)

    if (used.length >= MAX_WORDS) {
      tokens.push({ raw: piece, status: 'over-limit' })
      truncated.push(piece)
      continue
    }

    tokens.push({ raw: piece, status: 'used' })
    used.push(piece)
  }

  return {
    tokens,
    used,
    excluded,
    truncated,
    duplicates,
    isEmpty: pieces.length === 0,
  }
}

