// 문제 데이터 타입 정의
// PRD v1.0 §4.1 F-3 및 F-4 규격 100% 일치

/** 출제 유형 (Part 5 고정: 어휘, 어법, 전치사·접속사) */
export type QuestionType = 'vocab' | 'grammar' | 'prep_conj'

/** 선지 키 (A, B, C, D) */
export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

/** 난이도 */
export type Difficulty = 'easy' | 'normal' | 'hard'

export interface Choice {
  key: ChoiceKey
  /** 영어 선지 텍스트 */
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  /** 이 문항이 겨냥한 입력 단어 */
  targetWord: string
  /** 빈칸(_____)이 포함된 영어 한 문장 지문 */
  stem: string
  /** 선지 4개 (key, text) */
  choices: Choice[]
  /** 정답 선지 key */
  answer: ChoiceKey
  /**
   * 4개 선지 각각의 한글 해설 (Record<ChoiceKey, string>)
   * 정답 선지에는 "정답 근거", 오답 선지에는 "틀린 이유"
   */
  explanations: Record<ChoiceKey, string>
  /** 지문 한글 해석 */
  translation: string
  /** 타깃 단어 한 줄 정리 */
  wordNote: string
}

/** 유형 배지 라벨 */
export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  vocab: '어휘',
  grammar: '어법',
  prep_conj: '전치사·접속사',
}

/** 난이도 라벨 */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
}

/** 지문에서 빈칸을 표시하는 토큰 */
export const BLANK_TOKEN = '_____'

