// 취약 단어 입력값 파싱
// 쉼표로 나누고, 영어 단어만 사용하며, 최대 5개까지만 사용한다(차단이 아니라 절삭).

export const MAX_WORDS = 5

/** 칩 미리보기에 쓰는 토큰 상태 */
export type TokenStatus = 'used' | 'not-english' | 'over-limit'

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
  /** 입력이 비었거나 쉼표·공백만 있는 상태 */
  isEmpty: boolean
}

const ENGLISH_WORD = /^[A-Za-z][A-Za-z'-]*$/

export function parseWords(raw: string): ParsedWords {
  const pieces = raw
    .split(',')
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0)

  const tokens: WordToken[] = []
  const used: string[] = []
  const excluded: string[] = []
  const truncated: string[] = []

  for (const piece of pieces) {
    if (!ENGLISH_WORD.test(piece)) {
      tokens.push({ raw: piece, status: 'not-english' })
      excluded.push(piece)
      continue
    }
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
    isEmpty: pieces.length === 0,
  }
}
