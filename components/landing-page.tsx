import Link from 'next/link'
import { ArrowRight, Clock, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: Target,
    title: '내 약점 단어 그대로',
    desc: '오답노트에 있는 단어를 입력하면, 그 단어가 실제로 나오는 문제만 만들어져요.',
  },
  {
    icon: Zap,
    title: '선택 즉시 해설',
    desc: '정답을 고르는 순간 왜 맞고 틀렸는지, 모든 선지의 해설이 바로 열려요.',
  },
  {
    icon: Clock,
    title: '하루 10분, 3문항',
    desc: '부담 없는 분량으로, 짬이 날 때마다 반복할 수 있어요.',
  },
] as const

const STEPS = [
  {
    step: '01',
    title: '취약 단어 입력',
    desc: '최근에 틀린 영어 단어를 쉼표로 구분해 입력하세요.',
  },
  {
    step: '02',
    title: '난이도 선택',
    desc: '쉬움·보통·어려움 중 지금 수준에 맞는 난이도를 고르세요.',
  },
  {
    step: '03',
    title: '바로 풀고 확인',
    desc: 'AI가 만든 문제를 풀고, 선택하는 즉시 해설을 확인하세요.',
  },
] as const

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-[50rem] items-center justify-between px-5 py-6">
        <span className="text-title font-bold text-foreground">
          VocaTarget
        </span>
        <Button render={<Link href="/app" />} nativeButton={false} size="sm">
          시작하기
        </Button>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-[50rem] flex-col items-center gap-6 px-5 pt-8 pb-20 text-center sm:pt-14 sm:pb-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-micro font-semibold text-muted-foreground">
            AI 토익 Part 5 문제 생성기
          </span>
          <h1 className="text-balance text-[2rem] leading-[1.25] font-bold text-foreground sm:text-[2.5rem]">
            틀렸던 단어가,
            <br className="hidden sm:block" /> 오늘의 문제가 됩니다
          </h1>
          <p className="max-w-md text-pretty text-body leading-relaxed text-muted-foreground">
            자꾸 틀리는 영어 단어를 입력하면, AI가 그 단어가 나오는 토익 Part
            5 문제 3개와 해설을 한 번에 만들어 드려요.
          </p>
          <div className="flex flex-col items-center gap-2">
            <Button
              render={<Link href="/app" />}
              nativeButton={false}
              size="lg"
              className="h-12 px-8 text-title"
            >
              지금 시작하기
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <p className="text-caption text-muted-foreground">
              회원가입 없이, 지금 바로
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto grid w-full max-w-[50rem] gap-4 px-5 py-16 sm:grid-cols-3 sm:py-20">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-accent-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="text-title font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-caption leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-[50rem] px-5 py-16 sm:py-20">
          <h2 className="text-center text-display font-bold text-foreground">
            어떻게 만들어지나요
          </h2>
          <ol className="mt-10 flex flex-col gap-4 sm:flex-row">
            {STEPS.map(({ step, title, desc }) => (
              <li
                key={step}
                className="flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-5"
              >
                <span className="font-serif text-title font-semibold text-primary">
                  {step}
                </span>
                <h3 className="text-title font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-caption leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto flex w-full max-w-[50rem] flex-col items-center gap-5 px-5 py-16 text-center sm:py-20">
            <h2 className="text-balance text-display font-bold text-foreground">
              지금 틀리는 단어, 오늘 안에 내 것으로
            </h2>
            <Button
              render={<Link href="/app" />}
              nativeButton={false}
              size="lg"
              className="h-12 px-8 text-title"
            >
              무료로 문제 만들기
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[50rem] px-5 py-8 text-center text-caption text-muted-foreground">
        © 2026 VocaTarget · 취약 단어 타겟형 토익 문제 생성기
      </footer>
    </div>
  )
}
