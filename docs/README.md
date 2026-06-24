# ArguMind 문서 인덱스

> **ArguMind** — AI가 생성한 주제에 대해 사용자가 무작위로 배정받은 **찬성/반대** 입장으로 AI 상대와 턴제 논쟁을 벌이고, 매 턴 심판 AI가 5개 축(논리적 일관성·관련성·창의성·반박 효과·요약력)으로 0~100점씩 채점하는 **AI 토론 게임**입니다.

이 디렉터리(`docs/`)는 ArguMind의 구조와 동작을 설명하는 문서 모음입니다. 아래에서 목적에 맞는 문서로 이동하세요.

> 아래 로드맵의 완료 상태는 체크박스로 추적됩니다. 이번 리팩토링(백엔드 + 프론트엔드)으로 A·B·C 항목 대부분이 구현 완료되었습니다. D(UI·UX)는 이번 범위 밖으로 전체 미완료입니다.

---

## 문서 목록

| 문서 | 한 줄 설명 |
| --- | --- |
| [./OVERVIEW.md](./OVERVIEW.md) | 프로젝트 한 줄 소개, 핵심 기능, 기술 스택, 폴더 구조, 실행 방법, 현재 한계를 정리한 **출발점 문서** |
| [./ARCHITECTURE.md](./ARCHITECTURE.md) | 3계층 시스템 구성, 백엔드/프론트엔드 모듈 책임, URL 라우팅표, 인증·CORS·스로틀링 현황, 데이터 영속성(Game/Turn/Score), **구조적 부채 표**(해결/완화/미해결 상태 포함)를 담은 설계 문서 |
| [./SEQUENCE.md](./SEQUENCE.md) | 게임 시작 / 한 턴 진행 / 리스타트 3개 시나리오를 **시퀀스 다이어그램 + 페이로드 예시**로 설명하는 동작 문서 |
| [./WIREFRAME.md](./WIREFRAME.md) | 현재 단일 컴포넌트 UI의 **ASCII 와이어프레임**, UI 요소 정리표, 사용자 흐름, UX 문제점, 컴포넌트 분해 제안을 담은 UI 문서 |
| [./IMPLEMENTATION_NOTE.md](./IMPLEMENTATION_NOTE.md) | 리팩토링/개발 진행을 시간순으로 추적하는 **구현 노트**(무엇을·왜·어떻게 바꿨고 어떻게 검증했는지) |

---

## 읽는 순서 추천

1. **[./OVERVIEW.md](./OVERVIEW.md)** — 프로젝트가 무엇이고 어떻게 실행하는지 전체 그림을 먼저 잡습니다.
2. **[./ARCHITECTURE.md](./ARCHITECTURE.md)** — 백엔드/프론트엔드 책임과 API 계약, 구조적 부채를 이해합니다.
3. **[./SEQUENCE.md](./SEQUENCE.md)** — 실제 한 턴이 어떤 호출 순서로 흐르는지 따라가며 동작을 검증합니다.
4. **[./WIREFRAME.md](./WIREFRAME.md)** — 화면 단위로 UI/UX 현황과 개선 여지를 확인합니다.

> 코드를 바로 손볼 목적이라면 OVERVIEW → ARCHITECTURE 의 "구조적 부채" 표 → 아래 **리팩토링 로드맵**을 차례로 보는 것이 빠릅니다.

---

## 리팩토링 로드맵 제안

아래 체크리스트는 위 4개 문서에서 사실로 기록된 이슈에서 도출한 개선 제안입니다. 각 항목 끝에는 **도출 출처(문서 / 해당 이슈)**를 명시했습니다. 우선순위는 🔴 높음 / 🟡 중간 / ⚪ 낮음 입니다. 체크박스로 완료 상태를 추적합니다.

### A. 폴더 구조

- [x] 🔴 **백엔드/프론트엔드 디렉터리 분리** — Django 프로젝트(`ArguMind/`, `api/`, `manage.py`, `requirements.txt`)를 `backend/`로 이동하고, `settings.py`에 `REPO_ROOT`를 도입해 루트의 `frontend/build` 참조를 유지. **(완료)**
- [x] ⚪ **빈/미사용 파일 정리 및 역할 명확화** — `backend/api/models.py`(Game/Turn/Score 모델), `backend/api/admin.py`(관리자 등록), `backend/api/tests.py`(4개 테스트)가 이제 실질적인 역할을 가짐. **(완료)**
- [ ] ⚪ **브랜치/커밋과 코드 정합성 정리** — 브랜치 `feature-historicalFigure`와 최근 커밋 "chatting with historical figure"가 가리키는 기능이 코드에 없음. 브랜치 정리 또는 기능 구현으로 불일치 해소 필요. *(출처: OVERVIEW 한계 "브랜치-코드 불일치", ARCHITECTURE §6 "브랜치/커밋과 코드 불일치")*
- [x] ⚪ **프론트엔드 소스 디렉터리 구조화** — `api/client.js`, `hooks/useGame.js`, `components/`(7개) 분리 완료. **(완료)**

### B. 백엔드

- [x] 🔴 **SECRET_KEY 외부화 + DEBUG 분리** — `DJANGO_SECRET_KEY`, `DJANGO_DEBUG` 환경변수로 분리. 소스의 하드코딩 fallback 시크릿 **완전 제거**, 새 키를 `backend/.env`(gitignored)에서 관리. `backend/.env.example` 제공. **(완료, 상세: [IMPLEMENTATION_NOTE](./IMPLEMENTATION_NOTE.md) #3)**
- [x] 🔴 **LLM 엔드포인트 인증/보호 적용** — 로그인 기반 인증 미도입. 대신 DRF `ScopedRateThrottle`(get_topic/get_argument: 30/min, get_scores: 60/min)으로 비용 남용 완화. SimpleJWT는 미래 인증용으로 유지. **(완화 — rate-limiting 적용)**
- [x] 🟡 **데이터 영속화 모델 도입** — `Game`/`Turn`/`Score` 모델 + `0001_initial` 마이그레이션 추가. best-effort 영속화(`game_id`/`turn_index`/`side` 전송 시). **(완료)**
- [x] ⚪ **MIDDLEWARE 중복 제거** — `CommonMiddleware` 중복 항목 제거 (8개 단일 목록). **(완료)**
- [x] ⚪ **`_OpenAIHelper` 클라이언트 사용 정합화** — `generate()`가 `cls._client.chat.completions.create()`를 직접 호출. **(완료)**
- [x] ⚪ **채점 응답을 구조화 형식으로 반환** — `get-scores`가 `{scores:{...}, total, max_total:500, raw}` JSON 반환. 백엔드 `_parse_scores` 레이블 기반 파싱. **(완료)**

### C. 프론트엔드

- [x] 🟡 **stale history 버그 수정** — `fetchScores()`가 `finalHistory`를 직접 인자로 받아 전달. **(완료)**
- [x] 🟡 **점수 파싱 견고화** — 클라이언트 `calculateTotalScore()` 제거. 백엔드 구조화 응답 소비. **(완료)**
- [x] 🟡 **에러 처리 UI 도입** — `ErrorBanner` 컴포넌트(`role="alert"`, 닫기 버튼) 추가. **(완료)**
- [x] ⚪ **`resetGame`의 `opponentPosition` 초기화 포함** — `resetGame()`에서 `opponentPosition`, `gameId`, `error` 명시적 초기화. **(완료)**
- [x] ⚪ **단일 컴포넌트 분해** — `useGame` 훅(11개 상태) + StartScreen/GameScreen/TopicHeader/ChatHistory/ArgumentInput/ScoreBoard/ErrorBanner 분리. **(완료)** (`ResultScreen`은 UI·UX 범위로 미구현)
- [x] ⚪ **fetch 로직을 API 클라이언트 모듈로 추출** — `frontend/src/api/client.js`로 분리. **(완료)**

### D. UI · UX

> 이 섹션의 항목은 이번 리팩토링 범위 밖입니다. 모두 미완료 상태입니다.

- [ ] 🟡 **로딩 피드백 추가** — `isWaitingResponse`가 input `disabled`에만 반영됨. LLM 호출 3회(get-argument 1 + get-scores 2)가 직렬로 수 초 소요되나 시각적 단서 없음. 스피너/진행 표시 추가. *(출처: WIREFRAME §5 "로딩 피드백 부족")*
- [ ] 🟡 **점수 시각화** — `ScoreBoard`가 텍스트로만 표시. 5개 축 막대/차트와 총점 시각화로 가독성 개선. *(출처: WIREFRAME §5)*
- [ ] 🟡 **게임 종료/승패 및 점수 누적 개념 도입** — 턴 제한·누적 점수·승패 판정·결과 요약 화면이 없고 점수는 매 턴 덮어쓰기됨. `ResultScreen` 도입. *(출처: WIREFRAME §5 "게임 종료/승패 개념 없음")*
- [ ] ⚪ **Submit 버튼 대기 중 비활성화** — `input`에는 `disabled={isWaitingResponse}`가 있으나 Submit 버튼에는 없음. 버튼에도 `disabled` 적용. *(출처: WIREFRAME §3)*
- [ ] ⚪ **접근성/반응형 보강** — 고정 픽셀 인라인 스타일, 영어 placeholder와 한국어 콘텐츠 혼용, `<label>` 연결·Enter 제출·포커스 관리 부재. *(출처: WIREFRAME §5 "접근성/반응형 미고려")*
- [ ] ⚪ **시각적 정체성 / 디자인 토큰 도입** — 버튼·제목·점수가 브라우저 기본 모양에 가깝고 일관된 레이아웃 시스템이 없음. *(출처: WIREFRAME §5 "시각적 정체성 부재")*

---

> 각 항목의 근거가 되는 코드 위치와 심각도/상태는 [./ARCHITECTURE.md](./ARCHITECTURE.md) §6 "구조적 부채" 표에 정리되어 있습니다.
