# ArguMind 구현 노트 (Implementation Note)

개발/리팩토링 진행 내용을 시간순으로 추적하는 문서입니다. 각 항목은 **무엇을·왜·어떻게** 바꿨는지와 검증 방법을 기록합니다. 코드의 현재 상태 설명은 [OVERVIEW](./OVERVIEW.md) / [ARCHITECTURE](./ARCHITECTURE.md) / [SEQUENCE](./SEQUENCE.md) / [WIREFRAME](./WIREFRAME.md)를, 개선 항목 추적은 [README 로드맵](./README.md)을 참고하세요.

> 표기: 항목 ID는 README 로드맵의 분류(A 폴더구조 / B 백엔드 / C 프론트엔드 / D UI·UX)를 따릅니다.

---

## #3 — 시크릿 하드코딩 제거 및 `.env` 관리 (보안 강화)

**배경**: `#2` 리팩토링에서 `SECRET_KEY`를 환경변수로 읽도록 바꿨지만, 소스(`settings.py`)에 **개발용 fallback 시크릿 문자열이 그대로 남아** 있었습니다. 이 값은 git 히스토리에도 포함되어 사실상 노출된 상태였습니다.

**변경 내용**:
- `backend/ArguMind/settings.py`에서 하드코딩된 `django-insecure-...` fallback 문자열을 **완전히 제거**.
  - `SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')` 로만 읽음.
  - 키가 없을 때: `DEBUG=True`면 `get_random_secret_key()`로 **휘발성 임시 키** 생성(로컬 개발 편의), `DEBUG=False`면 `ImproperlyConfigured` 예외를 던져 **운영에서 키 누락을 차단**.
  - 이를 위해 `DEBUG` 계산을 `SECRET_KEY`보다 먼저 수행하도록 순서를 조정하고, `ImproperlyConfigured`·`get_random_secret_key`를 import.
- `backend/.env`(gitignored)에 **새로 생성한 강력한 시크릿 키**를 저장. 기존 노출 키는 폐기.
  - 관리 대상 키: `OPENAI_API_KEY`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, (선택) `DRF_THROTTLE_*`.
  - `OPENAI_API_KEY`는 플레이스홀더(`sk-REPLACE-...`)로 두었으므로 **실제 키로 교체 필요**.
- `backend/.env.example`은 템플릿(커밋 대상)으로 유지.

**노출 점검 결과**: 코드 전체를 스캔한 결과, 노출되던 비밀은 `settings.py`의 `SECRET_KEY` fallback **하나뿐**이었습니다. OpenAI 키는 이미 `os.getenv('OPENAI_API_KEY')`로만 접근하고 있어 소스에 값이 없습니다.

**검증**:
- 소스에 `django-insecure` 잔존 0건(`.pyc` 캐시 제외).
- `.env` 존재 시 → 실제 키 로드 확인(`settings.SECRET_KEY` prefix `0%ft32...`).
- `.env` 부재 + `DEBUG=False` → `ImproperlyConfigured: DJANGO_SECRET_KEY environment variable must be set when DEBUG is False.` 발생.
- `.env` 부재 + `DEBUG=True` → 길이 50의 임시 키 생성(예외 없음).
- `python manage.py check` 무이슈.

**주의(운영 배포 시)**:
- 운영 서버에는 반드시 `DJANGO_SECRET_KEY`를 환경변수 또는 `.env`로 주입해야 부팅됩니다(미설정 시 의도적으로 기동 실패).
- 과거 git 히스토리에 남은 옛 키는 폐기되었으나, 히스토리 자체에서 제거하려면 별도 history rewrite가 필요합니다(미수행).

---

## #2 — 코드/UX 리팩토링 (D 섹션 제외 전 항목)

README 로드맵의 **A(나머지)·B·C 전 항목**을 구현했습니다. **D(UI·UX)는 범위에서 제외**(요청에 따름).

### A. 폴더 구조
- **A2** 빈 파일에 역할 부여: `api/models.py`(모델 3종), `api/admin.py`(등록+인라인), `api/tests.py`(테스트 4개).
- **A4** 프론트엔드 디렉터리화: `frontend/src`를 `api/`·`hooks/`·`components/`·`constants.js`로 분해.
- **A3** 브랜치/커밋 불일치(`feature-historicalFigure`): 브랜치 정리 또는 기능 구현은 **사용자 결정 대기**(미해결).

### B. 백엔드 (`backend/`)
- **B1** `SECRET_KEY`/`DEBUG`/`ALLOWED_HOSTS`를 환경변수화하고 `.env.example` 추가. *(시크릿 fallback 제거는 #3에서 완료)*
- **B2** 보호 적용: 인증 대신 **DRF `ScopedRateThrottle`** 도입(`get_topic`/`get_argument` 30/min, `get_scores` 60/min). 무로그인 게임 흐름을 유지하면서 비용 남용을 완화. 엔드포인트는 의도적으로 `AllowAny` 유지, SimpleJWT 인프라는 미래 인증용으로 보존.
- **B3** 데이터 영속화: `Game` / `Turn` / `Score` 모델 + `0001_initial` 마이그레이션. 뷰는 `game_id`/`turn_index`/`side` 동반 시에만 best-effort 저장(DB 오류가 응답을 깨지 않음).
- **B4** 중복 `CommonMiddleware` 제거(미들웨어 8개).
- **B5** `_OpenAIHelper.generate`가 모듈 전역 `openai` 대신 `cls._client` 인스턴스를 사용하도록 수정.
- **B6** `get-scores`가 자유 문자열 대신 **구조화 JSON**(`{scores{5축}, total, max_total, raw}`) 반환. 레이블 기반 파싱(`_parse_scores`)으로 0~100 클램프·잡음 숫자 무시.

### C. 프론트엔드 (`frontend/src/`)
- **C1** stale history 버그 수정: 채점에 최신 `finalHistory` 전달.
- **C2** 점수 파싱 견고화: 클라이언트 정규식 합산(`calculateTotalScore`) 제거, 백엔드 구조화 응답 소비.
- **C3** 에러 UI: `ErrorBanner` 컴포넌트(`role="alert"` + 닫기).
- **C4** `resetGame`이 `opponentPosition`·`gameId`·`error`까지 초기화.
- **C5** 컴포넌트 분해: `StartScreen`/`GameScreen`/`TopicHeader`/`ChatHistory`/`ArgumentInput`/`ScoreBoard` + `useGame` 훅.
- **C6** fetch 로직을 `api/client.js` 모듈로 추출(`SERVER_URL`은 `REACT_APP_SERVER_URL` 환경변수 기반).

### API 계약 변경(주의)
- `POST /api/get-topic` 응답: `{topic}` → **`{game_id, topic, user_position, opponent_position}`** (입장 배정이 클라이언트 `Math.random` → 서버 `random.choice`로 이동).
- `POST /api/get-scores` 응답: 자유 문자열 → **구조화 JSON**. 요청에 선택 필드 `game_id`/`turn_index`/`side` 추가.
- 프론트엔드를 함께 갱신하여 내부 정합성 유지.

### 검증
- 백엔드: `manage.py check` 무이슈, 마이그레이션 드리프트 없음, `api` 테스트 4개 통과.
- 프론트엔드: 테스트 1개 통과, 프로덕션 빌드 성공(`frontend/build/` 생성).

---

## #1 — 폴더 구조 분리 (`backend/`)

**변경 내용**:
- Django 프로젝트(`ArguMind/`, `api/`, `manage.py`, `requirements.txt`)를 저장소 루트에서 **`backend/`로 이동**(`git mv`로 히스토리 보존). `frontend/`는 기존 위치 유지.
- `settings.py`에 `REPO_ROOT`(= `backend/`의 부모) 도입 → 이동 후에도 루트의 `frontend/build`를 정확히 참조(`TEMPLATES.DIRS`, `STATICFILES_DIRS`).
- `DATABASES.NAME`을 `os.path.join(BASE_DIR, 'db.sqlite3')`로 안정화, `STATICFILES_DIRS`는 빌드 존재 시에만 포함.

**검증**: 이동 파일 전수 `py_compile` 통과, 경로 해석 시뮬레이션으로 `frontend/build` 매핑 확인.

---

## 환경 구축 메모

- 검증용 가상환경: 저장소 루트 `.venv`(gitignored)에 `backend/requirements.txt` 설치.
- 프론트엔드: `frontend/node_modules`(gitignored)에 의존성 설치.
- 둘 다 커밋 대상이 아니며, 클론 후 재설치 필요(OVERVIEW "실행 방법" 참고).
