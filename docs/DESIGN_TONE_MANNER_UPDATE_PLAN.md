# 톤앤매너 개편 계획 — "Terra" 디자인 시스템 적용

- 작성일: 2026-08-27
- 근거 문서: `design.md` (VocaTarget Design System: Terra)
- 목적: 현재 "잉크 블루 + 페이퍼 뉴트럴" 톤앤매너를 `design.md`에 정의된 "Terra"(자연 그린 계열) 톤앤매너로 전환

## 1. 현재 시스템 vs Terra 스펙 비교

현재 코드베이스는 이미 `app/globals.css`의 CSS 커스텀 프로퍼티(디자인 토큰)와 `text-display/title/passage/body/caption/micro` 타입 스케일을 통해 색상·타이포그래피가 중앙화되어 있고, 컴포넌트들은 하드코딩된 색상 없이 전부 시맨틱 토큰(`bg-primary`, `text-muted-foreground` 등)만 사용 중입니다. 따라서 **토큰 값 자체를 교체하는 것만으로 전체 사이트에 자동 반영**되는 구조이며, 예외적으로 손봐야 할 하드코딩 지점만 개별 대응하면 됩니다.

| 항목 | 현재 | Terra 스펙 | 비고 |
|---|---|---|---|
| Primary | 잉크 블루 `oklch(0.45 0.087 253)` | Terra Green `#4A7C59` | 전면 교체 |
| Background | `oklch(0.977 0.003 106)` (페이퍼 오프화이트) | `#FAF6F0` (웜 오프화이트) | 전면 교체 |
| Surface Container | `--muted`, `--secondary` 등 | `#F5F1EA` | 그룹핑 영역용 매핑 필요 |
| Text | `oklch(0.21 0.012 250)` | `#1C1C1C` | 전면 교체 |
| Text Muted | `oklch(0.52 0.011 250)` | `#6B6B6B` | 전면 교체 |
| Error | `oklch(0.52 0.15 25)` | `#BA1A1A` | 근사치, 미세 조정 |
| Correct(정답) | 그린 계열 | (스펙에 명시 없음) | ⚠️ 아래 결정사항 참고 |
| UI 폰트 | IBM Plex Sans KR | Inter / sans-serif | 한글 폴백 필요 |
| 지문/보기 폰트 | IBM Plex Serif | Literata | 전면 교체 |
| 모서리 반경 | 12px 기준 + 컴포넌트별로 7.2~21.6px 편차 | 전 요소 12px 통일 | 컴포넌트별 정리 필요 |
| 최대 폭 | 544px (`max-w-[34rem]`) | 800px | 레이아웃 영향 큼 |
| 섹션 간 여백 | 대체로 16px(`gap-4`, `p-4`) | 32~48px | 여백 스케일 확대 |
| Elevation | 테두리 위주, 일부 `shadow-lg/xl`(토스트, 개발자 패널) | 플랫, 그림자 최소화 | 그림자 축소 |

## 2. 작업 범위 (Phase)

### Phase 1 — 컬러 토큰 재정의 (`app/globals.css`)
- `:root`의 `--background`, `--foreground`, `--card`, `--primary`, `--primary-soft`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--border` 등을 Terra 팔레트 기준 값(oklch 변환)으로 교체.
- `--correct` / `--incorrect` 시맨틱 색상 재조정 (2번 결정사항 참고).
- `--radius` 값 및 `radius-sm~2xl` 스케일을 12px 통일 방향으로 재검토.
- 타입 스케일 미세 조정: `--text-passage`(19px/1.8 → 스펙상 18px/1.6 근접치로 조정 여부 결정).

### Phase 2 — 타이포그래피 (`app/layout.tsx`)
- `next/font/google`에서 `IBM_Plex_Serif` → `Literata`로 교체 (지문·보기·해설용).
- UI용 폰트에 `Inter` 도입: `Inter`는 한글 글리프가 없으므로 `--font-sans-kr`을 `Inter, IBM Plex Sans KR, ...` 폴백 스택으로 구성해 라틴 문자는 Inter, 한글은 기존 폰트가 자동 대체되도록 처리.
- `viewport.themeColor`를 새 배경색(`#FAF6F0` 계열)에 맞게 조정.

### Phase 3 — 레이아웃 폭/여백 (`components/quiz-app.tsx` 및 각 패널)
- `max-w-[34rem]`(544px) → `max-w-[50rem]`(800px)로 확대.
- 내부 패딩/섹션 간 gap을 32~48px 스케일로 확대 (`gap-4`→`gap-8~12` 등급, 카드 내부 `p-4` 재검토).
- 800px 확대 시 좁은 화면(모바일) 대응은 기존 반응형 규칙 유지, 데스크톱만 확장.

### Phase 4 — 컴포넌트 디테일 정리
- 대상: `choice-list`, `question-card`, `input-panel`, `loading-overlay`, `result-panel`, `explanation-panel`, `error-panel`, `toast`, `type-badge`, `inline-notice`, `components/ui/button.tsx`, (`dev-panel`은 비노출 개발용이라 우선순위 낮음)
- 모서리 반경(`rounded-lg/md/xl/full` 등 혼재)을 12px 기준으로 통일 또는 의도적 계층만 남기고 정리.
- `shadow-lg/xl` 사용처(토스트, 개발자 패널 등)를 플랫/서페이스 컬러 시프트 방식으로 축소.
- 난이도 세그먼트 토글, 버튼 상태(disabled 등)는 기존 로직 유지, 색상만 Terra 팔레트로 반영.

### Phase 5 — 검증
- 개발 서버 구동 후 State Transition 전 구간(Input → Loading → Solving → Result, EX-2/EX-3/EX-10 예외 UI 포함) 시각 확인.
- 신규 팔레트 기준 WCAG AA 대비 확인 (특히 `text-muted-foreground` on 웜 오프화이트, 흰 텍스트 on Terra Green 버튼).
- `npm test`(vitest) 회귀 실행 — 로직 변경은 없으나 클래스/텍스트 스냅샷성 테스트 유무 확인.

## 3. 확인이 필요한 결정사항

1. **정답(Correct) 색상 충돌**: Primary가 Terra Green이 되면서 채점 결과 "정답" 표시에 쓰이는 그린 계열과 시각적으로 구분이 어려워질 수 있습니다. 현재는 아이콘+라벨 병기로 색만으로 구분하지 않는 패턴이라 완화되지만, 톤을 primary와 다르게(예: 살짝 더 어둡거나 채도를 낮춘 그린, 혹은 청록 계열) 가져갈지 확인 필요.
2. **모서리 반경 통일 범위**: "전 요소 12px"을 문자적으로 적용하면 현재 `rounded-full`(토스트, 배지, 세그먼트 등)까지 12px로 바뀌어야 하는지, 아니면 알약형 요소는 예외로 둘지 확인 필요.
3. **최대 폭 800px 확대**: 지문 가독성 목적이지만 문제 카드·버튼 등도 함께 넓어져 전체적으로 여백 인상이 달라짐. 800px 그대로 적용할지, 본문(en passage)만 넓히고 버튼류는 폭을 제한할지 확인 필요.
4. **Inter 폰트의 한글 폴백**: Inter는 한글을 지원하지 않아 실제로는 "라틴 문자만 Inter, 한글은 기존 산세리프" 조합이 됩니다. 이 절충안으로 진행해도 괜찮은지 확인.

## 4. 영향 파일 목록
- `app/globals.css` (핵심 — 토큰 전면 개정)
- `app/layout.tsx` (폰트 교체)
- `components/quiz-app.tsx` (레이아웃 폭/여백)
- `components/{choice-list,question-card,input-panel,loading-overlay,result-panel,explanation-panel,error-panel,toast,type-badge,inline-notice}.tsx` (반경/그림자/여백 마감)
- `components/ui/button.tsx` (반경 스케일 확인, 색은 토큰 상속이라 별도 수정 불필요)
- `components/dev-panel.tsx` (선택적, 우선순위 낮음)

## 5. 진행 순서 제안
1. `main`에서 작업 브랜치 분기 (예: `design/terra-tone-manner`)
2. Phase 1(컬러 토큰) → Phase 2(폰트) 적용 후 1차 시각 확인 — 이 시점에 위 결정사항 1·4 확정
3. Phase 3(레이아웃 폭/여백) 적용 — 결정사항 3 확정
4. Phase 4(컴포넌트 디테일) 적용 — 결정사항 2 확정
5. Phase 5 검증(시각 QA + 대비 체크 + 테스트) 후 PR 생성
