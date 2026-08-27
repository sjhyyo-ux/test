import type { ChoiceKey, Difficulty, Question } from './quiz-types'

export type Phase = 'input' | 'loading' | 'quiz' | 'result' | 'error'

/** 실패 사유별 문구 (기술 용어는 절대 노출하지 않는다) */
export type ErrorKind =
  | 'generic'
  | 'busy'
  | 'network'
  | 'timeout'
  | 'invalid_word'
  | 'generation_quality'

/** 로딩 경과 단계: 0=0~5초, 1=5~12초, 2=12~20초 */
export type LoadingStage = 0 | 1 | 2

export type SetKey = 'three' | 'two'

export interface QuizState {
  phase: Phase
  rawInput: string
  difficulty: Difficulty | null
  loadingStage: LoadingStage
  /** true면 타이머를 돌리지 않는다(디버그 패널로 단계를 고정한 경우) */
  loadingFrozen: boolean
  setKey: SetKey
  questions: Question[]
  current: number
  /** 문항별로 사용자가 고른 선지. 미응답은 null */
  answers: (ChoiceKey | null)[]
  errorKind: ErrorKind
  /** E8: 해설 렌더 실패 폴백 노출 */
  explanationBroken: boolean
  /** E9: 공유 실패 폴백 노출 */
  shareFallback: boolean
  toast: string | null
  /** 상태가 바뀔 때마다 증가 — 새 콘텐츠로 포커스를 옮기는 트리거 */
  focusToken: number
}

export const ERROR_MESSAGE: Record<ErrorKind, string> = {
  generic: '문제를 만들지 못했어요. 다시 시도해 주세요.',
  busy: '지금은 요청이 많아요. 잠시 후 다시 시도해 주세요.',
  network: '인터넷 연결을 확인해 주세요.',
  timeout: '시간이 너무 오래 걸려서 중단했어요. 다시 시도해 주세요.',
  invalid_word: '입력하신 단어 중 실제 영단어가 아닌 단어가 있어요. 단어를 확인해 주세요.',
  generation_quality: '실전 토익 공인 시험 기준의 엄격한 품질 검증을 통과하지 못했습니다. 단어를 수정하거나 다시 시도해 주세요.',
}

export const initialState: QuizState = {
  phase: 'input',
  rawInput: '',
  difficulty: null,
  loadingStage: 0,
  loadingFrozen: false,
  setKey: 'three',
  questions: [],
  current: 0,
  answers: [],
  errorKind: 'generic',
  explanationBroken: false,
  shareFallback: false,
  toast: null,
  focusToken: 0,
}

export type QuizAction =
  | { type: 'input/change'; value: string }
  | { type: 'input/difficulty'; value: Difficulty }
  | { type: 'generate/start' }
  | { type: 'loading/stage'; stage: LoadingStage }
  | { type: 'loading/cancel' }
  | { type: 'generate/success'; questions?: Question[] }
  | { type: 'generate/fail'; kind: ErrorKind }
  | { type: 'quiz/answer'; key: ChoiceKey }
  | { type: 'quiz/next' }
  | { type: 'error/edit' }
  | { type: 'flow/restart' }
  | { type: 'share/fallback' }
  | { type: 'toast/show'; message: string }
  | { type: 'toast/hide' }
  // 디버그 패널 전용: 상태 일부를 그대로 덮어쓴다
  | { type: 'dev/apply'; patch: Partial<QuizState> }

function startLoading(state: QuizState): QuizState {
  return {
    ...state,
    phase: 'loading',
    loadingStage: 0,
    loadingFrozen: false,
    shareFallback: false,
    focusToken: state.focusToken + 1,
  }
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'input/change':
      return { ...state, rawInput: action.value }

    case 'input/difficulty':
      return { ...state, difficulty: action.value }

    case 'generate/start':
      return startLoading(state)

    case 'loading/stage':
      return { ...state, loadingStage: action.stage }

    case 'loading/cancel':
      return {
        ...state,
        phase: 'input',
        loadingStage: 0,
        focusToken: state.focusToken + 1,
      }

    case 'generate/success': {
      const questions = action.questions || []
      return {
        ...state,
        phase: 'quiz',
        questions,
        current: 0,
        answers: questions.map(() => null),
        explanationBroken: false,
        focusToken: state.focusToken + 1,
      }
    }

    case 'generate/fail':
      return {
        ...state,
        phase: 'error',
        errorKind: action.kind,
        focusToken: state.focusToken + 1,
      }

    case 'quiz/answer': {
      // 선지는 1회만 선택 가능 — 이미 고른 문항은 무시한다
      if (state.answers[state.current]) return state
      const answers = [...state.answers]
      answers[state.current] = action.key
      return { ...state, answers }
    }

    case 'quiz/next': {
      const isLast = state.current >= state.questions.length - 1
      if (isLast) {
        return { ...state, phase: 'result', focusToken: state.focusToken + 1 }
      }
      return {
        ...state,
        current: state.current + 1,
        focusToken: state.focusToken + 1,
      }
    }

    case 'error/edit':
      return { ...state, phase: 'input', focusToken: state.focusToken + 1 }

    case 'flow/restart':
      return {
        ...initialState,
        rawInput: state.rawInput,
        difficulty: state.difficulty,
        setKey: state.setKey,
        focusToken: state.focusToken + 1,
      }

    case 'share/fallback':
      return { ...state, shareFallback: true }

    case 'toast/show':
      return { ...state, toast: action.message }

    case 'toast/hide':
      return { ...state, toast: null }

    case 'dev/apply':
      return {
        ...state,
        ...action.patch,
        focusToken: state.focusToken + 1,
      }

    default:
      return state
  }
}
