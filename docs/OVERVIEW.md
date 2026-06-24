# ArguMind 개요

## 한 줄 소개

ArguMind는 AI가 생성한 주제에 대해 사용자가 무작위로 배정받은 **찬성/반대** 입장으로 AI 상대와 턴제 논쟁을 벌이고, 매 턴 심판 AI가 5개 축으로 0~100점을 매기는 **AI 토론 게임**입니다.

## 핵심 기능

- **주제 생성**: `POST /api/get-topic`(`GetTopic`)가 LLM(gpt-4o)으로 논쟁 유발형 토론 주제를 1개 생성합니다. 요청 본문은 필요 없습니다.
- **입장 배정**: **서버**가 `random.choice`로 사용자에게 `찬성`/`반대`를 무작위 배정하고, AI 상대는 자동으로 반대 입장을 가집니다. 응답(`{game_id, topic, user_position, opponent_position}`)에 배정 결과가 포함됩니다.
- **턴제 논쟁**: 사용자가 주장을 입력하면 `submitArgument()`이 발언 기록(`history`)에 추가하고, AI 반박을 받아온 뒤 양측 점수를 채점하는 한 턴이 완료됩니다.
- **AI 반박**: `POST /api/get-argument`(`GetArgument`)가 주제·상대 입장·발언 기록을 받아 사용자 주장에 대응하는 AI 반박을 생성합니다.
- **5축 채점**: `POST /api/get-scores`(`GetScores`)가 **논리적 일관성 / 관련성 / 창의성 / 반박 효과 / 요약력** 5개 축을 각 0~100점으로 평가합니다. 사용자 주장과 AI 반박을 각각 채점하며, 백엔드가 구조화된 JSON(`{scores:{...}, total, max_total:500, raw}`)으로 반환하므로 클라이언트는 숫자를 직접 합산하지 않습니다.

## 기술 스택

| 구분 | 기술 | 버전 / 비고 |
| --- | --- | --- |
| 백엔드 | Django | 5.1.3 |
| 백엔드 | Django REST Framework | 3.15.2 |
| 백엔드 | djangorestframework-simplejwt | 5.3.1 (JWT 토큰 발급, 단 API 엔드포인트는 미사용) |
| 백엔드 | django-cors-headers | 4.6.0 |
| 백엔드 | python-dotenv | 1.0.1 (`.env`에서 `OPENAI_API_KEY` 로드) |
| 백엔드 | 데이터베이스 | sqlite3 (`db.sqlite3`) |
| 프론트엔드 | React | 18.3 |
| 프론트엔드 | Create React App | react-scripts 5.0.1 |
| 프론트엔드 | 구조 | `useGame` 훅 + 7개 컴포넌트 분해, 인라인 스타일, 라우터/상태 관리 라이브러리 없음 |
| 외부 | OpenAI | openai 1.54.4, 모델 `gpt-4o` |

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
│   │   ├── views.py           # GetTopic / GetScores / GetArgument + _OpenAIHelper + _parse_scores
│   │   ├── urls.py            # /api/get-topic, /api/get-scores, /api/get-argument
│   │   ├── models.py          # Game / Turn / Score 모델
│   │   ├── admin.py           # Game/Turn/Score 관리자 등록(인라인 포함)
│   │   ├── apps.py            # 앱 설정
│   │   ├── tests.py           # _parse_scores 파싱 + 모델 관계 테스트 (4개)
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py  # Game/Turn/Score 테이블 생성
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
│       ├── api/
│       │   └── client.js      # postJSON fetch 래퍼 + getTopic / getArgument / getScores
│       ├── hooks/
│       │   └── useGame.js     # 게임 상태(11개) + startGame / resetGame / submitArgument / fetchScores
│       └── components/
│           ├── StartScreen.js
│           ├── GameScreen.js
│           ├── TopicHeader.js
│           ├── ChatHistory.js
│           ├── ArgumentInput.js
│           ├── ScoreBoard.js
│           └── ErrorBanner.js
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

- **인증**: 세 게임 엔드포인트는 여전히 `AllowAny`입니다. 로그인 기반 인증은 도입되지 않았으며, **DRF 스코프 스로틀링**(get_topic: 30/min, get_argument: 30/min, get_scores: 60/min)으로 비용 남용을 완화합니다. SimpleJWT 인프라는 미래 인증 도입을 위해 유지됩니다.
- **브랜치-코드 불일치**: 현재 브랜치 `feature-historicalFigure`와 최근 커밋 메시지("chatting with historical figure")가 가리키는 "역사적 인물과 대화" 기능은 현재 코드에 구현되어 있지 않습니다. 브랜치 정리 또는 기능 구현이 필요합니다.
- **UI·UX**: 로딩 스피너, 점수 시각화(막대 차트), 게임 종료/승패 판정, Submit 버튼 비활성화, 접근성·반응형, 디자인 토큰은 이번 리팩토링 범위 밖입니다.
