import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_KR, IBM_Plex_Serif } from 'next/font/google'
import './globals.css'

// 한글 UI 본문용: IBM Plex Sans KR — 한글 자소 폭이 고르고 작은 크기에서도 획이 뭉치지 않아
// 해설처럼 조밀한 한글 텍스트의 가독성이 좋다.
const plexSansKr = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-kr',
  display: 'swap',
})

// 영어 지문용: IBM Plex Serif — 같은 패밀리 계열이라 톤이 어긋나지 않고,
// 세리프가 시험지 지문 같은 인상을 주어 한글 UI와 역할이 시각적으로 분리된다.
const plexSerif = IBM_Plex_Serif({
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
  themeColor: '#f7f7f5',
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
      className={`light bg-background ${plexSansKr.variable} ${plexSerif.variable}`}
    >
      <body className="bg-background text-foreground antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
