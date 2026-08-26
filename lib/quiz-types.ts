// 문제 데이터 타입 정의
// 나중에 실제 생성 API 응답으로 갈아끼울 때 이 타입만 맞추면 UI는 그대로 동작한다.

/** 출제 유형 (Part 5 고정) */
export type QuestionType = 'vocab' | 'grammar' | 'prepconj'

/** 선지 키 */
export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

/** 난이도 */
export type Difficulty = 'easy' | 'normal' | 'hard'

export interface Choice {
  key: ChoiceKey
  /** 영어 선지 텍스트 */
  text: string
  /**
   * 이 선지에 대한 한글 해설.
   * 정답 선지에는 "정답 근거", 오답 선지에는 "틀린 이유"가 들어간다.
   */
  rationale: string
}

export interface Question {
  id: string
  type: QuestionType
  /** 이 문항이 노리는 취약 단어 */
  targetWord: string
  /** 빈칸(_____)이 포함된 영어 한 문장 */
  sentence: string
  choices: Choice[]
  answer: ChoiceKey
  /** 지문 한글 해석 */
  translation: string
  /** 타깃 단어 한 줄 정리 */
  targetNote: string
}

/** 유형 배지 라벨 */
export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  vocab: '어휘',
  grammar: '어법',
  prepconj: '전치사·접속사',
}

/** 난이도 라벨 */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
}

/** 지문에서 빈칸을 표시하는 토큰 */
export const BLANK_TOKEN = '_____'
