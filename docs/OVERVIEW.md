# ArguMind 개요

## 한 줄 소개

ArguMind는 AI가 생성한 주제에 대해 사용자가 무작위로 배정받은 **찬성/반대** 입장으로 AI 상대와 턴제 논쟁을 벌이고, 매 턴 심판 AI가 5개 축으로 0~100점을 매기는 **AI 토론 게임**입니다.

## 핵심 기능

- **매치 설정**: 게임 시작 전 `설정(Setup)` 화면에서 **주제 영역**(사회·윤리/기술·AI/문화·예술/무작위), **상대 토론자 페르소나**(논리주의자/도발가/소크라테스식/역사 속 인물), **매치 길이**(3턴/5턴/무제한)를 고릅니다. 선택값은 `POST /api/get-topic` 요청 본문(`{category, opponent_persona, max_turns}`)으로 전달되어 `Game`에 저장됩니다.
- **주제 생성**: `POST /api/get-topic`(`GetTopic`)가 Google AI(Gemma)로 논쟁 유발형 주제를 1개 생성합니다. `category`로 주제 영역을 편향시키며, 응답에 `{game_id, topic, user_position, opponent_position, category, opponent_persona, max_turns, status}`를 포함합니다.
- **입장 배정**: **서버**가 `random.choice`로 사용자에게 `찬성`/`반대`를 무작위 배정하고, AI 상대는 자동으로 반대 입장을 가집니다.
- **턴제 논쟁 + 매치 구조**: 사용자가 주장을 입력하면 한 턴이 진행되고, `max_turns`에 도달하면 자동으로 **판정 화면**으로 전환됩니다(무제한은 자동 전환 없음). 진행 상황은 레일의 턴 진행 핍으로 표시됩니다.
- **AI 반박**: `POST /api/get-argument`(`GetArgument`)가 주제·상대 입장·발언 기록과 **페르소나**(`opponent_persona`, 없으면 `game_id`로 조회)를 받아 페르소나별 시스템 프롬프트로 반박을 생성합니다.
- **5축 채점 + 심판 코멘트**: `POST /api/get-scores`(`GetScores`)가 **논리적 일관성 / 관련성 / 창의성 / 반박 효과 / 요약력** 5개 축을 각 0~100점으로 평가하고, **한 줄 총평(`comment`)**을 함께 반환합니다. 구조화 JSON(`{scores:{...}, total, max_total:500, comment, raw}`).
- **판정(Verdict)**: 매치 종료 시 누적 결과를 보여줍니다 — 승패, 양측 **평균 총점(/500)**, 5축 오각형 레이더, 턴별 점수 추이 스파크라인, 심판 총평.
- **토론 기록(History)**: `GET /api/games`(목록·전적) / `GET /api/games/<id>`(상세 집계)로 지난 토론을 다시 봅니다. 누적 총점은 **턴별 총점의 평균**, 추이는 **턴별 총점 배열**로 통일됩니다.

## 기술 스택

| 구분 | 기술 | 버전 / 비고 |
| --- | --- | --- |
| 백엔드 | Django | 5.1.3 |
| 백엔드 | Django REST Framework | 3.15.2 |
| 백엔드 | djangorestframework-simplejwt | 5.3.1 (JWT 토큰 발급, 단 API 엔드포인트는 미사용) |
| 백엔드 | django-cors-headers | 4.6.0 |
| 백엔드 | python-dotenv | 1.0.1 (`.env`에서 `GOOGLE_API_KEY` 로드) |
| 백엔드 | 데이터베이스 | sqlite3 (`db.sqlite3`) |
| 프론트엔드 | React | 18.3 |
| 프론트엔드 | Create React App | react-scripts 5.0.1 |
| 프론트엔드 | 구조 | `useGame` 화면 상태 머신(`start/setup/debate/result/history`) + 8개 컴포넌트, 디자인 토큰 기반 `index.css`(인라인 스타일 제거), 라우터/상태 관리 라이브러리 없음 |
| 프론트엔드 | 디자인 | "변증의 장" 디자인 시스템 — `docs/design/DESIGN_SYSTEM.md`. 폰트: Pretendard / Nanum Myeongjo / IBM Plex Mono(CDN) |
| 외부 | Google AI Studio | `openai` 1.54.4 클라이언트(OpenAI 호환 엔드포인트), 모델 `gemma-4-31b-it`(기본, `GOOGLE_AI_MODEL`로 변경) |

## 폴더 구조

추적되는 파일은 39개이며(`db.sqlite3`는 `.gitignore` 대상), 백엔드는 `backend/`, 프론트엔드는 `frontend/`로 분리되어 있습니다. 아래는 주요 디렉터리/파일 트리입니다.

```text
argumind/
├── backend/                   # Django 백엔드 (manage.py 실행 기준 디렉터리)
│   ├── ArguMind/              # Django 프로젝트 설정 패키지
│   │   ├── __init__.py
│   │   ├── settings.py        # 설정(앱, 미들웨어, CORS, JWT, throttling, sqlite3, 템플릿 DIRS)
│   │   ├── urls.py            # 루트 URL: '' → index.html, /admin/, /api/token/, /api/ include
│   │   ├── asgi.py            # ASGI 진입점
│   │   └── wsgi.py            # WSGI 진입점
│   ├── api/                   # Django 앱: 논쟁 게임 API
│   │   ├── __init__.py
│   │   ├── views.py           # GetTopic / GetScores / GetArgument / GameList / GameDetail + _GoogleAIHelper + _parse_scores / _parse_comment + CATEGORY/PERSONA_PROMPTS
│   │   ├── urls.py            # /api/get-topic, /api/get-scores, /api/get-argument, /api/games, /api/games/<id>
│   │   ├── models.py          # Game(+category/opponent_persona/max_turns/status) / Turn / Score(+comment)
│   │   ├── admin.py           # Game/Turn/Score 관리자 등록(인라인 포함)
│   │   ├── apps.py            # 앱 설정
│   │   ├── tests.py           # 파싱(_parse_scores/_parse_comment) + 모델 + GameDetail/GameList 테스트 (11개)
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py  # Game/Turn/Score 테이블 생성
│   │       └── 0002_...py       # Game category/persona/max_turns/status + Score.comment 추가
│   ├── .env.example           # 환경변수 예시 (OPENAI_API_KEY, DJANGO_SECRET_KEY 등)
│   ├── manage.py              # Django 관리 명령 진입점
│   └── requirements.txt       # 백엔드 파이썬 의존성
├── frontend/                  # Create React App 프론트엔드
│   ├── package.json           # 의존성/스크립트(react-scripts)
│   ├── package-lock.json
│   ├── README.md
│   ├── public/                # CRA 정적 자산
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   ├── favicon.ico
│   │   ├── logo192.png
│   │   └── logo512.png
│   └── src/
│       ├── App.js             # 최상위 컴포넌트 (useGame 훅 + ErrorBanner + StartScreen/GameScreen 조합)
│       ├── constants.js       # SCORE_LABELS (5개 축 영문 키 → 한국어 레이블 매핑)
│       ├── App.css
│       ├── App.test.js
│       ├── index.js           # React 렌더 진입점
│       ├── index.css
│       ├── logo.svg
│       ├── reportWebVitals.js
│       ├── setupTests.js
│       ├── constants.js       # SCORE_AXES/SCORE_LABELS + CATEGORIES / PERSONAS / MATCH_LENGTHS + 헬퍼
│       ├── api/
│       │   └── client.js      # fetch 래퍼 + getTopic / getArgument / getScores / getGames / getGameResult
│       ├── hooks/
│       │   └── useGame.js     # 화면 상태 머신 + 매치 구조 + 턴별 채점/누적 + 기록 로드
│       └── components/
│           ├── StartScreen.js   # 랜딩(히어로 + 루프)
│           ├── SetupScreen.js   # 매치 설정(영역/페르소나/길이)
│           ├── GameScreen.js    # 토론(레일+아레나+컴포저), 턴 핍·심판 코멘트 포함
│           ├── ResultScreen.js  # 판정(판결지 + 레이더 + 추이)
│           ├── HistoryScreen.js # 토론 기록(전적 + 매치 목록)
│           ├── ScoreRadar.js    # 5축 오각형 레이더 SVG
│           ├── ScoreTrend.js    # 턴별 점수 추이 스파크라인 SVG
│           └── ErrorBanner.js   # 오류 배너
├── docs/                      # 프로젝트 문서(OVERVIEW/ARCHITECTURE/SEQUENCE/WIREFRAME/README)
└── .gitignore
```

> 위 트리에는 IDE 설정 파일(`.idea/`)은 생략했습니다.
> `manage.py`/`requirements.txt`/Django 패키지는 모두 `backend/`로 이동했고, `settings.py`는 `REPO_ROOT`(= `backend/`의 부모)를 기준으로 루트의 `frontend/build`를 참조합니다.

## 실행 방법

### 환경 변수

백엔드는 여러 환경변수를 `backend/.env`에서 읽습니다. `backend/.env.example`을 복사해 시작하세요.

```bash
cp backend/.env.example backend/.env
```

최소한 아래 두 항목을 설정해야 합니다.

```dotenv
OPENAI_API_KEY=sk-여기에-본인-키
DJANGO_SECRET_KEY=여기에-비밀-키
```

선택적으로 다음도 설정할 수 있습니다.

```dotenv
DJANGO_DEBUG=False          # 운영 환경에서는 False 권장
DJANGO_ALLOWED_HOSTS=example.com,api.example.com
DRF_THROTTLE_GET_TOPIC=30/min
DRF_THROTTLE_GET_ARGUMENT=30/min
DRF_THROTTLE_GET_SCORES=60/min
```

`DJANGO_SECRET_KEY`는 소스에 하드코딩되어 있지 않습니다. 미설정 시 `DEBUG=True`에서는 매 기동마다 휘발성 임시 키가 생성되고(로컬 개발 전용), `DEBUG=False`에서는 `ImproperlyConfigured` 예외로 기동이 차단됩니다. 따라서 **운영 배포 시 `DJANGO_SECRET_KEY` 주입은 필수**입니다.

### 백엔드 (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

기본적으로 `http://127.0.0.1:8000`에서 동작하며, `/api/` 하위에 API가 마운트됩니다. `settings.py`의 `TEMPLATES.DIRS`와 `STATICFILES_DIRS`는 `REPO_ROOT`(= `backend/`의 부모) 기준의 `frontend/build`를 가리키므로, 동일 출처(same-origin)로 React 빌드를 서빙하려면 `frontend`에서 빌드가 선행되어야 합니다.

### 프론트엔드 (React 개발 서버)

```bash
cd frontend
npm install
npm start
```

개발 서버는 `http://localhost:3000`에서 실행되며, 이 출처는 `settings.py`의 `CORS_ALLOWED_ORIGINS`에 등록되어 있습니다. 프론트엔드의 `SERVER_URL`은 빈 문자열(same-origin)로 설정되어 있어, 분리 실행 시 프록시 설정이나 `SERVER_URL` 조정이 필요할 수 있습니다.

## 현재 상태 / 한계

### 해결된 항목 (이번 리팩토링)

- ~~**영속화 없음**~~: `Game` / `Turn` / `Score` 모델이 도입되어 게임 기록이 sqlite3에 저장됩니다. 단, 영속화는 클라이언트가 `game_id`/`turn_index`/`side`를 요청에 포함할 때만 실행되며, DB 오류가 발생해도 응답은 정상 반환됩니다(best-effort).
- ~~**보안 설정**~~: `SECRET_KEY`와 `DEBUG`가 환경변수(`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`)로 분리되었고, 소스의 하드코딩 fallback 시크릿은 **완전히 제거**되었습니다. 키는 `backend/.env`(gitignored)에서 관리하며, 운영에서 미설정 시 기동이 차단됩니다. 자세한 경위는 [IMPLEMENTATION_NOTE](./IMPLEMENTATION_NOTE.md) #3 참고.
- ~~**미들웨어 중복**~~: `CommonMiddleware` 중복이 제거되어 미들웨어는 8개 단일 항목입니다.
- ~~**채점 파싱 취약**~~: 백엔드가 레이블 기반으로 파싱해 구조화 JSON(`{scores, total, max_total, raw}`)을 반환합니다. 프론트엔드 정규식 합산(`calculateTotalScore`)이 제거되었습니다.
- ~~**발언 기록 동기화**~~: `submitArgument()`가 stale state 대신 최신 `finalHistory`를 채점 요청에 전달합니다.
- ~~**에러 UI 부재**~~: `ErrorBanner` 컴포넌트(`role="alert"`, 닫기 버튼)가 추가되어 API 오류가 화면에 표시됩니다.
- ~~**단일 컴포넌트 구조**~~: `useGame` 훅(상태 11개) + 7개 프레젠테이션 컴포넌트로 분해되었습니다.
- ~~**`_OpenAIHelper` 미사용 클라이언트**~~: `generate()`가 이제 `cls._client`를 통해 호출합니다.
- ~~**`resetGame` opponentPosition 누락**~~: `resetGame()`이 `opponentPosition`, `gameId`, `error`도 명시적으로 초기화합니다.

### 남은 한계

- **인증**: 모든 엔드포인트가 여전히 `AllowAny`입니다. 로그인 기반 인증은 미도입이며, **DRF 스코프 스로틀링**(get_topic 30/min, get_argument 30/min, get_scores 60/min, game_read 120/min)으로 비용 남용을 완화합니다. SimpleJWT 인프라는 미래 인증 도입을 위해 유지됩니다. 기록(History)은 현재 사용자 구분 없이 전체 게임을 보여주므로, 사용자별 기록을 위해서는 인증이 선행되어야 합니다.
- **라우팅**: 화면 전환은 라우터 없이 `useGame`의 화면 상태(`screen`)로만 처리합니다. 딥링크/뒤로가기/새로고침 시 상태가 유지되지 않으므로, 기록 상세 공유 등에는 React Router 도입이 필요합니다.
- **영속화 의존성**: 진행 중 매치의 판정 화면은 클라이언트 누적값으로 그리므로 DB 장애에도 안전하지만, **기록(History)**은 best-effort로 저장된 `Turn`/`Score`에 의존하므로 채점 저장이 실패한 턴은 집계에서 누락될 수 있습니다.
- ~~**UI·UX**~~ **(해결)**: 디자인 시스템(`index.css`), 로딩 상태, 점수 시각화(레이더·추이·막대), 승패 판정 화면, 입력 미세 UX(글자 수·단축키·비활성), 접근성·반응형이 이번 리팩토링에서 구현되었습니다. 자세한 설계는 `docs/design/DESIGN_SYSTEM.md` 참고.
- ~~**브랜치-코드 불일치**~~ **(부분 해결)**: "역사적 인물" 아이디어는 설정 화면의 **상대 페르소나(역사 속 인물 포함)**로 흡수되었습니다. 단, 특정 인물 지정 UI까지는 구현하지 않았습니다.
