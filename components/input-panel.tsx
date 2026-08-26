'use client'

import { Check, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/inline-notice'
import { MAX_WORDS, type ParsedWords } from '@/lib/parse-words'
import { DIFFICULTY_LABEL, type Difficulty } from '@/lib/quiz-types'
import { cn } from '@/lib/utils'

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']

const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easy: '기본 뜻',
  normal: '실전',
  hard: '함정 선지',
}

/** 입력 토큰 미리보기 칩 */
function WordChips({ parsed }: { parsed: ParsedWords }) {
  if (parsed.tokens.length === 0) {
    return (
      <p className="text-caption text-muted-foreground">
        쉼표로 구분해 최대 {MAX_WORDS}개까지 넣을 수 있어요.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {parsed.tokens.map((token, index) => (
          <span
            key={`${token.raw}-${index}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-micro font-medium',
              token.status === 'used' &&
                'border-primary/30 bg-primary-soft text-accent-foreground',
              (token.status === 'not-english' || token.status === 'duplicate') &&
                'border-border bg-muted text-muted-foreground line-through decoration-muted-foreground/60',
              token.status === 'over-limit' &&
                'border-dashed border-border bg-card text-muted-foreground',
            )}
          >
            {token.status === 'used' ? (
              <Check aria-hidden="true" className="size-3" />
            ) : (
              <X aria-hidden="true" className="size-3" />
            )}
            <span className="font-serif">{token.raw}</span>
            {token.status === 'not-english' && (
              <span className="font-sans">· 제외</span>
            )}
            {token.status === 'duplicate' && (
              <span className="font-sans">· 중복</span>
            )}
            {token.status === 'over-limit' && (
              <span className="font-sans">· 미사용</span>
            )}
          </span>
        ))}
      </div>
      <p className="text-caption text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">
          {parsed.used.length}개
        </span>{' '}
        인식됨 · 최대 {MAX_WORDS}개
      </p>
    </div>
  )
}

export function InputPanel({
  rawInput,
  difficulty,
  parsed,
  busy,
  onChangeInput,
  onChangeDifficulty,
  onSubmit,
  headingRef,
}: {
  rawInput: string
  difficulty: Difficulty | null
  parsed: ParsedWords
  busy: boolean
  onChangeInput: (value: string) => void
  onChangeDifficulty: (value: Difficulty) => void
  onSubmit: () => void
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const noWords = parsed.used.length === 0
  const noDifficulty = difficulty === null
  const canSubmit = !noWords && !noDifficulty && !busy

  // E3: 비영어 토큰 처리 안내
  const allNonEnglish = noWords && parsed.excluded.length > 0
  const partialNonEnglish = !noWords && parsed.excluded.length > 0

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-display font-bold text-balance outline-none"
        >
          취약 단어 타겟형 토익 문제 생성기
        </h1>
        <p className="text-body text-muted-foreground text-pretty">
          자꾸 틀리는 단어를 넣으면, 그 단어가 나오는 Part 5 문제 3문항과 해설을
          바로 만들어 드려요.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="weak-words" className="text-title font-semibold">
            취약 단어
          </label>
          <input
            id="weak-words"
            type="text"
            value={rawInput}
            onChange={(event) => onChangeInput(event.target.value)}
            placeholder="comprehensive, comprehensible"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="weak-words-help"
            aria-invalid={noWords && rawInput.length > 0}
            className="h-12 w-full rounded-lg border border-input bg-background px-3 font-serif text-title text-foreground placeholder:font-sans placeholder:text-body placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
          />
          <div id="weak-words-help" className="flex flex-col gap-2">
            <WordChips parsed={parsed} />
            {/* E1: 단어 미입력 / 공백·쉼표만 입력 */}
            {noWords && parsed.excluded.length === 0 && (
              <InlineNotice tone="blocker">
                학습할 단어를 1개 이상 입력해 주세요.
              </InlineNotice>
            )}
            {/* E3: 전부 비영어 */}
            {allNonEnglish && (
              <InlineNotice tone="blocker">
                영어 단어만 입력할 수 있어요. 예: comprehensive, comprehensible
              </InlineNotice>
            )}
            {/* E3: 일부 비영어 */}
            {partialNonEnglish && (
              <InlineNotice tone="info">
                {`'${parsed.excluded.join(`', '`)}'는 영어가 아니어서 제외했어요. ${parsed.used.join(', ')}로 문제를 만들게요.`}
              </InlineNotice>
            )}
            {/* E4: 5개 초과 절삭 고지 */}
            {parsed.truncated.length > 0 && (
              <InlineNotice tone="info">
                한 번에 {MAX_WORDS}개까지만 사용해요. 앞의 {MAX_WORDS}개로
                만들게요.
              </InlineNotice>
            )}
          </div>
        </div>

        <hr className="border-border" />

        <div className="flex flex-col gap-2">
          <p className="text-title font-semibold" id="difficulty-label">
            난이도
          </p>
          <div
            role="radiogroup"
            aria-labelledby="difficulty-label"
            aria-describedby={noDifficulty ? 'difficulty-error' : undefined}
            className="grid grid-cols-3 gap-2"
          >
            {DIFFICULTIES.map((value) => {
              const selected = difficulty === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChangeDifficulty(value)}
                  className={cn(
                    'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:border-border-strong hover:bg-muted',
                  )}
                >
                  <span className="text-body font-semibold">
                    {DIFFICULTY_LABEL[value]}
                  </span>
                  <span
                    className={cn(
                      'text-micro',
                      selected
                        ? 'text-primary-foreground/75'
                        : 'text-muted-foreground',
                    )}
                  >
                    {DIFFICULTY_HINT[value]}
                  </span>
                </button>
              )
            })}
          </div>
          {/* E2: 난이도 미선택 */}
          {noDifficulty && (
            <InlineNotice tone="blocker" id="difficulty-error">
              난이도를 선택해 주세요.
            </InlineNotice>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="h-12 w-full text-title"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          문제 만들기
        </Button>
        <InlineNotice tone="hint">
          결과는 저장되지 않습니다. 새로고침 시 사라집니다.
        </InlineNotice>
      </div>
    </div>
  )
}
