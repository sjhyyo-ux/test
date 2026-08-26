'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LoadingStage } from '@/lib/quiz-reducer'

// 경과 시간에 따라 교체되는 3단계 문구
const STAGE_COPY: Record<LoadingStage, { title: string; sub: string }> = {
  0: {
    title: '3문항을 한 번에 만드는 중',
    sub: '보통 5초 안에 끝나요.',
  },
  1: {
    title: '조금만 더 기다려 주세요. 거의 다 됐어요.',
    sub: '해설까지 함께 만들고 있어요.',
  },
  2: {
    title: '평소보다 오래 걸리고 있어요.',
    sub: '기다리기 어렵다면 취소하고 다시 시도할 수 있어요.',
  },
}

export function LoadingOverlay({
  stage,
  onCancel,
}: {
  stage: LoadingStage
  onCancel: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // 상태 전환 시 포커스를 새 콘텐츠로 이동
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  const copy = STAGE_COPY[stage]

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/85 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex w-full max-w-80 flex-col items-center gap-4 rounded-xl border border-border bg-card px-5 py-8 text-center outline-none"
      >
        <Loader2
          aria-hidden="true"
          className="size-7 animate-spin text-primary motion-reduce:animate-none"
        />
        {/* 문구 교체를 스크린리더에 전달 */}
        <div aria-live="polite" className="flex flex-col gap-1.5">
          <p id="loading-title" className="text-title font-semibold text-pretty">
            {copy.title}
          </p>
          <p className="text-caption text-muted-foreground text-pretty">
            {copy.sub}
          </p>
        </div>

        {/* 진행 인디케이터: 단계가 올라갈수록 채워진 눈금이 늘어난다 */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((tick) => (
            <span
              key={tick}
              className={
                tick <= stage
                  ? 'h-1 w-8 rounded-full bg-primary'
                  : 'h-1 w-8 rounded-full bg-border'
              }
            />
          ))}
        </div>

        {/* 12초 이후에만 취소 버튼 노출 */}
        {stage === 2 && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-11 w-full text-body"
          >
            취소
          </Button>
        )}
      </div>
    </div>
  )
}
