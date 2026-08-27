import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_KR, Inter, Literata } from 'next/font/google'
import './globals.css'

// UI 본문용: Inter — Terra 디자인 시스템의 UI 폰트(design.md §3).
// Inter는 한글 글리프가 없어 IBM Plex Sans KR을 폴백으로 붙여, 라틴 문자는 Inter로
// 렌더링되고 한글은 자동으로 폴백 폰트로 넘어가도록 한다.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-en',
  display: 'swap',
})

const plexSansKr = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-kr',
  display: 'swap',
})

// 영어 지문/보기/해설용: Literata — 공식 토익 지면과 유사한 인상을 주면서
// 장문 읽기에 최적화된 세리프(design.md §3).
const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif-en',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '취약 단어 타겟형 토익 문제 생성기',
  description:
    '자꾸 틀리는 영어 단어를 넣으면 그 단어가 나오는 토익 Part 5 문제와 해설을 바로 만들어 줍니다.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#faf6f0',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`light bg-background ${inter.variable} ${plexSansKr.variable} ${literata.variable}`}
    >
      <body className="bg-background text-foreground antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
