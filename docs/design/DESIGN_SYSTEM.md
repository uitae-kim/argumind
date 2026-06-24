# ArguMind 디자인 시스템 — "변증의 장 (Arena of Dialectic)"

본 문서는 ArguMind 리디자인의 **기준안**입니다. 시각 컨셉, 디자인 토큰(색·타입·간격), 시그니처 요소,
그리고 각 컴포넌트의 마크업 계약(class contract)을 정의합니다. 동작하는 정적 목업은
[`mockup.html`](./mockup.html)에서 확인할 수 있습니다(전체 미리보기: [`preview-full.png`](./preview-full.png)).

> 기준 코드: `frontend/src/` (`useGame` 훅 + 7개 프레젠테이션 컴포넌트). 현재 UI 명세는 [`../WIREFRAME.md`](../WIREFRAME.md).

---

## 1. 컨셉

ArguMind는 단순한 채팅이 아니라 **변증(辯證) — 두 입장의 충돌과 판정**입니다. 디자인은 이 본질을 그대로 형상화합니다.

- **밤의 토론장(arena)**: 잉크빛 청흑색 배경. 차분하고 집중되는, "생각의 무대".
- **두 극(pole)**: 찬성(나)은 **차가운 민트-시안**, 반대(AI)는 **따뜻한 엠버**. 정치색(적-청)을 피하고 한난(寒暖) 대비로 대립을 표현.
- **심판(judge)**: **골드**. 점수·판정·중앙 결절점에만 절제해서 사용.
- **판결지(paper)**: 어두운 무대 위 단 한 번 등장하는 따뜻한 종이 패널. 최종 판정은 "종이 위에 선고"됩니다.

### 시그니처 — 중앙 이음새(seam)

이 디자인이 기억되는 단 하나의 요소. **발광하는 세로 단층선**이 토론 기록을 둘로 가릅니다.
나의 주장은 이음새 오른쪽(시안), AI의 반박은 왼쪽(엠버)에 붙고, 두 색이 만나는 중앙에 골드 결절점이 빛납니다.
**같은 이음새가 판정 화면에서는 5축 오각형 레이더의 축이자 양측 점수를 가르는 단층선**으로 재등장합니다.
모든 보조 요소는 조용히 두고, 대담함은 이 이음새 하나에만 씁니다.

### 로고 / 파비콘

브랜드 마크는 이 시그니처를 그대로 압축합니다 — 어두운 라운드 타일 위에서 **두 극(찬성=시안, 반대=엠버)이 안쪽으로 모여** 중앙의 **골드 판정 결절점(다이아몬드)**에서 만나고, 그 뒤로 세로 이음새가 흐릅니다. "대립 → 판정"이라는 게임의 본질을 한 형상으로 담습니다.

- 원본: `frontend/public/favicon.svg` (벡터, 브라우저 탭 기본) — React 컴포넌트 버전은 `frontend/src/components/Logo.js`(랜딩 히어로의 브랜드 락업에 사용).
- 래스터: `favicon-32.png`, `logo192.png`, `logo512.png`(SVG에서 렌더, 매니페스트/홈 추가용). CRA 기본 React 로고·`favicon.ico`는 제거됨.
- 적용: `public/index.html`(svg+png 아이콘 링크), `public/manifest.json`(이름·아이콘·테마색 `#0C0F16`), 랜딩 화면 `.brand` 락업.

---

## 2. 색 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `--ink` | `#0C0F16` | 무대 배경 |
| `--ink-2` | `#11151F` | 돌출 표면(rail, loop-step) |
| `--ink-3` | `#171C28` | 카드(arg, btn) |
| `--line` | `#262E3E` | 헤어라인 |
| `--text` | `#E9ECF3` | 본문 |
| `--muted` | `#8B93A7` | 보조 텍스트 |
| `--muted-2` | `#5C6479` | 라벨/약한 텍스트 |
| `--affirm` | `#2FE3C2` | **찬성(나)** — 시안 |
| `--affirm-dim` | `#1B9C8A` | 찬성 채움(막대 등) |
| `--negate` | `#FF7A4D` | **반대(AI)** — 엠버 |
| `--negate-dim` | `#C4562F` | 반대 채움 |
| `--verdict` | `#E7C46A` | **심판** — 골드(점수·판정·결절점) |
| `--paper` / `--paper-2` | `#F3EFE4` / `#E7E1D1` | 판결지 패널 |
| `--paper-ink` | `#1A1814` | 판결지 위 텍스트 |

원칙: 골드는 "판정"에만, 시안/엠버는 "입장"에만. 색이 곧 정보입니다(색을 장식으로 쓰지 않음).

---

## 3. 타입

세 가지 역할을 **의도적으로** 분리합니다. 싸움은 자신감 있는 산세리프로, 주제·판결은 명조의 무게로, 측정값은 모노로.

| 역할 | 폰트 | 쓰임 |
|---|---|---|
| Display | **Nanum Myeongjo** (serif, 700/800) | 주제 헤드라인, 판결 문구(승/패), 화면 타이틀 |
| Sans | **Pretendard** (300–900) | UI, 주장 본문, 버튼 |
| Mono | **IBM Plex Mono** (400–600) | **모든 측정값** — 점수, 5개 축, 턴 카운터, eyebrow 라벨 |

- 한글 줄바꿈: `word-break: keep-all` (단어 중간이 아니라 어절 단위로만 줄바꿈).
- 본문 콘텐츠는 한국어, 문장형, 군더더기 없는 카피. UI 라벨이 곧 길잡이입니다(예: 버튼 `주장 제출` → 결과도 같은 어휘로).

---

## 4. 화면

`mockup.html`은 다음 5개 화면 + 1개 상태를 정적으로 보여줍니다. ⊕ 표시는 **코드/와이어프레임에 없던 신규 제안**(§8 참고).

| # | 화면 | 대응 상태/컴포넌트 |
|---|---|---|
| 01 | **시작 (Landing)** | `gameStarted === false` · `StartScreen` |
| 02 | ⊕ **설정 (Setup)** | 신규 — 게임 진입 전 주제 영역·상대 페르소나·매치 길이 선택 |
| 03 | **진행 (Debate)** | `gameStarted === true` · `GameScreen`(+턴 진행·심판 코멘트·입력 미세 UX) |
| 04 | **판정 (Verdict)** | 미구현 `ResultScreen` 제안안 (+심판 총평·점수 추이) |
| 05 | ⊕ **기록 (History)** | 신규 — 지난 토론 목록 + 전적 |
| + | **오류 배너** | `ErrorBanner` (`role="alert"`) |

### 01 시작 (Landing)
히어로가 곧 주장(thesis)입니다. 큰 명조 헤드라인에서 `찬성`/`반대`를 각 극 색으로 물들이고,
하단 `.loop`에 **실제 순서**인 `배정 → 논쟁 → 판정`을 01/02/03으로 표기(순서가 정보이므로 번호가 정당함).

### 02 ⊕ 설정 (Setup) — 신규
게임 진입 전 한 단계. `주제 영역`(`.opt-grid` 카드) + `상대 토론자 페르소나`(엠버 아바타 카드) + `매치 길이`(`.seg`).
입장(찬성/반대)은 코어 규칙대로 **시작 시 무작위 배정**임을 `.setup-note`의 칩 쌍으로 미리 보여줍니다.

### 03 진행 (Debate)
- 상단 `.rail`: 나(찬성)·턴 카운터·주제·AI(반대). **턴 진행 핍**(`.turn-pips`)으로 `2 / 3` 같은 매치 진척 표시.
- `.arena`: `1fr / 2px(seam) / 1fr` 3열. 나의 주장은 오른쪽, AI 반박은 왼쪽. 각 카드에 턴 라벨·미니 점수·**심판 한 줄 코멘트**(`.judge-note`).
- **로딩 피드백**: AI 반박+채점(LLM 3회 직렬)을 `.thinking` 상태로 표시(`aria-live="polite"`).
- `.composer`: `<form>` + **글자 수/제출 단축키 안내**(`.composer-meta`). 내 입장 색으로 강조된 "연단".

### 04 판정 (Verdict)
- 좌: **판결지** 패널 — `당신의 승리`(명조), 누적 총점 `412 / 388`을 이음새로 가른 `.tally`, 5축 막대, **심판 총평**(`.summary`), CTA 3종(다시/기록/공유).
- 우: **5축 오각형 레이더**(나·AI 폴리곤 겹침) + **턴별 점수 추이 스파크라인**(`.trend`) — "형태"와 "추세"를 함께.

### 05 ⊕ 기록 (History) — 신규
`.history-head`에 전적(`.record`: 승/패/평균), `.match-list`에 지난 매치 카드(`.match-card`).
각 카드 = 승패 배지 + 주제 + 입장/영역/페르소나 칩 + `나 vs AI` 점수 + 날짜. 전체가 클릭 가능한 `<button>`(다시 보기 진입).

---

## 5. 마크업 계약 (Class Contract)

리디자인 시 그대로 옮길 수 있도록, 컴포넌트별 클래스 구조를 고정합니다. **새 클래스 발명·인라인 CSS 금지**가 원칙(스와치 색 등 데이터성 인라인은 예외).

```
원자(atoms)
  .eyebrow            모노 대문자 라벨
  .seam               시그니처 단층선 (빈 div; ::after가 골드 결절점)
  .chip-affirm/-negate  .dot + 텍스트 (입장 칩)
  .btn / .btn-primary(골드) / .btn-ghost / .btn-submit(시안)
  .btn:disabled(반투명·비활성, hover 이동 리셋) / .btn-loading(스피너+라벨 래퍼) > .btn-spinner(회전, reduced-motion 정지)

레일(rail)            .rail > .combatant(.right){ .who,.role + .avatar-affirm } | .rail-mid{ .rail-turn,.rail-topic } | .combatant{ .avatar-negate + .who,.role }
히어로(hero)          .hero > .eyebrow, h1.hero-title(.affirm/.negate span), .hero-sub, .hero-cta(.btn-primary,.btn-ghost,.hero-note)
루프(loop)            ol.loop > li.loop-step × 3 { .k, h2.h, .p }   ← 실제 순서이므로 ol
경기장(arena)         .arena > .col.col-affirm | .seam | .col.col-negate
주장(arg)             .arg.arg-affirm/-negate > .arg-head(.arg-turn + .chip-*) , .arg-text , .miniscore(.m>b … .tot)
대기(thinking)        .thinking[role=status][aria-live=polite] > .pulse(i×3) + .lbl
입력(composer)        form.composer > .composer-row > .composer-field(label.composer-label + textarea) + button.btn-submit
판정(verdict)         .verdict > .verdict-paper(.eyebrow,.ruling(.win/.lose),.ruling-sub,.tally(.side.affirm | .seam | .side.negate),.axes(.axis×5),.summary(.sl,.st),.hero-cta) | .radar-wrap + .radar-legend + .trend(.tl, svg.spark)
오류(banner)          .banner[role=alert] > 텍스트 + button.x

— 신규 제안 (§8) —
설정(setup)          .setup > .eyebrow, h2, .setup-section(p.sec-label(span.no) , .opt-grid[.cols-2](button.opt-card[.is-selected][aria-pressed]( .ot,.od | .persona(.avatar-negate + div(.ot,.od)) )) | .seg(button[.is-selected][aria-pressed])) , p.setup-note(.chip-*) , .setup-cta(.btn-*)
진행 추가            .rail-mid > .turn-pips(.pip[.done/.now]) ; .arg > … .judge-note(.jl + 텍스트) ; form.composer > … .composer-meta(.count>b , .hint) ; .setup-cta.setup-cta--center(중앙 정렬 + 하단 여백, 토론 그만두기 CTA)
기록(history)        .history > .history-head( div(h2,p.hsub) , .record(.r(.rn[.win/.lose],.rl)) ) , .match-list( button.match-card[aria-label]( .badge.win/.lose , .match-topic(.mt,.mmeta(.chip-*)) , .match-right(.ms>b,.md) ) )
```

### 5축은 항상 이 순서 (모노)
`논리적 일관성 · 관련성 · 창의성 · 반박 효과 · 요약력` — 각 0~100, 총점 /500.
이는 백엔드 `GetScores`의 구조화 응답(`scores` 키)과 `frontend/src/constants.js`의 `SCORE_LABELS`에 1:1 대응합니다.

---

## 6. 품질 기준 (Quality Floor)

- **반응형**: 모바일(≤760px)에서 `.arena`/`.verdict`/`.loop`는 1열로 쌓이고 `.seam`은 숨김, `.composer`는 세로 정렬.
- **접근성**: 실제 `<button>`/`<textarea>`+`<label>`, `:focus-visible` 골드 아웃라인, 로딩 `aria-live`, 오류 `role="alert"`, 레이더 `aria-label`.
- **모션**: `.thinking` 점 애니메이션과 `.btn-spinner` 회전은 `prefers-reduced-motion: reduce`에서 정지.
- **CSS 규약**: 단일 클래스 선택자 위주 — 엘리먼트 선택자와 클래스 선택자가 간격(padding/margin)에서 충돌하지 않도록.

---

## 7. 리디자인 적용 메모

현재 프론트엔드는 인라인 스타일 + 디자인 토큰 부재 상태입니다(`WIREFRAME.md` §5). 본 시스템 적용 시:

1. `mockup.html`의 `<style>` 블록을 전역 토큰/컴포넌트 CSS로 추출(예: `index.css` 또는 CSS Modules).
2. 7개 컴포넌트의 인라인 스타일을 위 클래스 계약으로 치환 — 마크업 구조가 이미 1:1 대응되도록 설계됨.
3. 미구현 `ResultScreen`을 §4-03 판정 화면으로 신규 구현(누적 점수·승패·레이더). `useGame`에 턴 종료/누적 상태 추가 필요.
4. `.thinking` 로딩 상태를 `isWaitingResponse`에, `.miniscore`를 매 턴 `userScore`/`opponentScore`에 연결.

이 문서와 `mockup.html`이 시각·구조의 단일 기준입니다. 색/타입 결정은 §2–§3 토큰에서만 파생하세요.

---

## 8. 신규 제안 UX — 코드/와이어프레임에 없던 추가

기존 코드·`WIREFRAME.md`에 없지만 제품을 완성하기 위해 목업에 추가한 항목입니다. 각 항목은 **프론트 + 백엔드 작업**으로 이어집니다.

> **구현 상태 (2026-06-24, `feature-redesign-implementation` 브랜치):** 아래 표의 항목이 모두 구현되었습니다.
> 프론트는 `useGame` 훅의 화면 상태 머신(`start→setup→debate→result→history`)으로 재구성되었고(라우터 미도입),
> 백엔드는 `Game`에 `category/opponent_persona/max_turns/status`, `Score`에 `comment`가 추가되고
> `GET /api/games`·`GET /api/games/<id>` 집계 엔드포인트가 추가되었습니다. 인증은 여전히 미도입(향후 과제).
> 누적 총점은 **턴별 총점의 평균(0~500)**, 추이는 **턴별 총점 배열**로 통일했습니다(프론트·백엔드 동일).

| 제안 | 무엇을 / 왜 | 프론트엔드 | 백엔드 |
|---|---|---|---|
| ★ **매치 구조** | 무한 턴 → 정해진 턴 수(3/5/무제한). 턴 진행 핍, 종료 시 판정 화면 트리거. 현재 점수가 매 턴 덮어써지는 문제 해결의 전제. | `useGame`에 `maxTurns`/`turnIndex`/`isFinished` 상태, 종료 시 `ResultScreen` 전환. `.turn-pips` 렌더. | `Game.max_turns`, `Game.status`(active/finished), 턴 카운트 검증. `get-topic` 응답에 `max_turns` 포함. |
| ★ **판정 화면 (Verdict)** | 와이어프레임이 지목한 미구현 `ResultScreen`. 누적 총점·승패·5축 레이더·추이. | 신규 `ResultScreen` + 누적 점수 합산, 레이더/스파크라인 SVG. | 매치 종료 집계 엔드포인트(예: `GET /api/games/{id}/result`) 또는 클라이언트 누적. |
| ★ **심판 코멘트/총평** | 점수 숫자만으로는 학습 가치가 낮음. 턴별 한 줄(`.judge-note`) + 최종 총평(`.summary`). | `ScoreBoard`/`ChatHistory`가 `comment` 표시. | `GetScores` 응답에 `comment`(턴별) 추가, 최종 총평 생성(`raw` 필드 이미 존재 — 활용). |
| **상대 페르소나 + 주제 영역/난이도** | 단일 무작위 주제 → 선택형. `feature-historicalFigure` 브랜치 의도와 연결(역사 속 인물). | 신규 `SetupScreen`, 선택 상태 → `startGame(params)`. | `GetTopic`에 `category`, `GetArgument`에 `persona`(상대 시스템 프롬프트 분기). `Game`에 두 값 저장. |
| **점수 추이** | 라운드별 추이/누계 부재(와이어프레임 §5) 해결. 턴별 누적 총점 스파크라인. | 판정 화면 `.trend` SVG, 턴별 점수 배열 보관. | 영속화된 `Turn`/`Score` 집계(이미 저장 중) → 시계열 반환. |
| **토론 기록 (History)** | 영속화된 게임을 활용하는 진입점 부재. 지난 매치 + 전적. | 신규 `HistoryScreen`, 목록/상세 라우팅(라우터 도입 검토). | `GET /api/games`(목록) + `GET /api/games/{id}`(상세/리플레이). 전적 집계. |
| **입력 미세 UX** | 글자 수·제출 단축키·비활성 상태 안내 부재. | `ArgumentInput`: `.composer-meta`(카운터·힌트), `maxLength`, Enter 제출, Submit `disabled` 반영. | (선택) 입력 길이 검증. |

> 인증·라우팅: History/Setup 도입 시 라우터(예: React Router) 추가와, 사용자별 기록을 위한 인증(현재 `AllowAny` + SimpleJWT 인프라 유지)이 자연스러운 다음 단계입니다.
