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
const ENGLISH_WORD = /^[A-Za-z][A-Za-z\s'-]*[A-Za-z]$|^[A-Za-z]$/

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
    if (!ENGLISH_WORD.test(piece)) {
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

