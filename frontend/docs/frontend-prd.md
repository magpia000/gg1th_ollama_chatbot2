# Local LLM Chat — 프론트엔드 PRD

> 근거 목업: [`docs/chat_ui_설계도.jpg`](./chat_ui_설계도.jpg)
> 원본 작업 지시: [`docs/프롬프트.txt`](./프롬프트.txt)
> 작성 단계: 1단계(PRD) — 이 문서는 설계 문서이며 코드는 포함하지 않는다.

**확정된 전제 (질의응답 결과)**

| 항목 | 결정 |
|---|---|
| 대화 세션 범위 | 단일 대화만 지원 (다중 세션/히스토리 목록 없음) |
| 상태 관리 범위 | `App` 최상위 로컬 state만 사용 (전역 상태 라이브러리 없음, localStorage 영속화 없음) |
| API 연동 | 기존 백엔드 그대로 사용 — `POST /chat`(fetch), `GET /models`(fetch). 스트리밍 미포함. (§3.1에서 axios 대신 네이티브 `fetch`로 확정 — 추가 라이브러리 불필요) |
| 반응형 대응 | 필요함 (구체 breakpoint는 목업에 없어 본 PRD에서 기본값으로 제안, §2.5 참고 — 확인 필요) |
| 스타일링 | 일반 CSS (`App.css`, `index.css`) — §3.3 고정 구조상 컴포넌트별 `*.module.css` 없음 |
| 언어 | JavaScript(JSX)만 사용, TypeScript 미사용 |

**context7 관련 안내**: 규칙 3에서 요구한 context7 MCP 도구는 현재 세션에 연결되어 있지 않아 사용할 수 없었다. 대신 React 공식 문서(react.dev)를 직접 조회하여 근거로 남겼다(각주 참고). context7 연결이 필요하면 별도 설정 후 재검증을 권장한다.

---

## 1. 프로젝트 개요

**Local LLM Chat**은 React 프론트엔드가 FastAPI 백엔드(`backend/main.py`)를 통해 로컬에서 구동 중인 Ollama LLM과 대화하는 단일 화면 웹 앱이다. 사용자는 좌측 패널에서 모델과 생성 파라미터(시스템 프롬프트, temperature, top_p, num_predict)를 설정하고, 우측 패널에서 해당 설정으로 모델과 대화한다.

- 백엔드는 이미 구현되어 있으며 이번 프론트엔드 작업 범위에 포함되지 않는다. 엔드포인트는 §3.2에 고정한다.
- 대화는 새로고침 시 초기화되는 단일 세션이며, 여러 대화를 저장/전환하는 기능은 이번 범위 밖이다.
- 응답은 스트리밍이 아닌 동기 응답이며, 대기 중에는 로딩 상태(`응답 생성 중...`)만 표시한다.

---

## 2. 기능 요구사항 (영역별)

본 앱은 단일 화면(`ChatPage`)이며, 목업 기준으로 4개 영역으로 나뉜다: 헤더, 사이드바(모델 설정), 대화 메시지 영역, 입력 영역. 화면 자체가 하나이므로 "화면별" 대신 "영역별"로 요구사항을 정리한다.

### 2.1 헤더 영역 (`ChatWindow` 내부 헤더 마크업)

- FR-1: 타이틀 "Local LLM Chat"과 서브타이틀 "React + FastAPI + Ollama 기반 로컬 AI 채팅 앱"을 표시한다.
- FR-2: 우측에 "대화 초기화" 버튼을 표시한다. 클릭 시 확인 다이얼로그 없이 즉시 `messages` 배열만 비운다(사이드바의 모델 설정값은 유지). 목업에 확인 단계가 없어 즉시 초기화로 가정 — **확인 필요**.
- FR-3: 뷰포트가 1024px 미만일 때만 사이드바 토글(햄버거) 버튼을 헤더 좌측에 표시한다. (§2.5)

### 2.2 사이드바 — 모델 설정 영역 (`SettingsPanel`)

- FR-4: 모델 드롭다운은 마운트 시 `GET /models` 결과로 채운다. 로딩 중에는 드롭다운을 비활성화하고, 실패 시 드롭다운을 비활성화한 채 에러 문구를 표시하되 `App.jsx`에 정의된 기본 모델값(`DEFAULT_SETTINGS`)으로 채팅 전송은 계속 가능해야 한다(백엔드 장애가 채팅 전체를 막지 않도록).
- FR-5: 시스템 프롬프트 입력은 멀티라인 textarea이며 변경 시 즉시 상위 state에 반영된다.
- FR-6: Temperature(0.0–2.0)와 Top P(0.0–1.0)는 `SettingsPanel` 내부의 로컬 슬라이더 마크업(별도 컴포넌트로 분리하지 않음)으로 렌더링하고, 현재 값을 라벨에 실시간 표시한다(목업의 "Temperature: 0.4", "Top P: 0.55" 형식).
- FR-7: Num Predict 입력은 숫자 입력(1–2048)이며 유효 범위를 벗어나면 백엔드 스키마 제약(`backend/schemas.py`)에 맞춰 클램핑한다.
- FR-8: 사이드바의 모든 설정값 기본값은 `backend/schemas.py`의 `ChatRequest` 기본값과 동일해야 한다 (model: `"exaone3.5:7.8b"`, system_prompt: "너는 초보자를 돕는 친절한 AI 강사다.", temperature: 0.6, top_p: 0.7, num_predict: 256). 목업 스크린샷 값(0.4/0.55/256)은 데모 상태의 스냅샷일 뿐 기본값 사양이 아니다.
- FR-19: 시스템 프롬프트 입력 위에 "시스템 프롬프트 모드" select를 추가한다. `src/api/promptModes.js`의 각 모드(`label`, `prompt`)를 옵션으로 나열하고 기본 선택값은 "직접 입력"(빈 값)이다. 모드를 선택하면 해당 `prompt` 전문이 시스템 프롬프트 textarea에 즉시 표시되며, 이후 textarea를 직접 수정해도 된다(FR-5와 동일하게 계속 편집 가능). 선택 상태는 별도 state 없이 현재 `systemPrompt` 값이 어느 프리셋과 일치하는지로 렌더링 중 파생 계산한다. 전송 시에는 FR-5~8과 동일하게 현재 textarea 값(프리셋이든 직접 입력이든)이 `POST /chat`의 `system_prompt`로 전달된다(별도 구현 불필요, 기존 FR-5~8 경로 재사용). (사용자 요청으로 추가됨)

### 2.3 대화 메시지 영역 (`MessageList` / `MessageBubble`)

- FR-9: 사용자 메시지는 우측 정렬, 옅은 파란색 배경 말풍선으로 표시한다(목업과 동일).
- FR-10: 어시스턴트 메시지는 목업에 표시되지 않아 좌측 정렬, 옅은 회색 배경 말풍선으로 가정한다 — **확인 필요**.
- FR-11: 전송 중(`isSending === true`)에는 메시지 목록 하단에 로딩 상태를 나타내는 어시스턴트 자리표시 말풍선(또는 인라인 표시자)을 보여준다.
- FR-12: API 오류 발생 시, 별도의 오류 스타일 말풍현 또는 인라인 배너로 에러 메시지를 노출하고, 해당 사용자 메시지는 목록에 남아있어야 한다(재전송 시 새 메시지로 다시 보냄, 수정 편집 기능은 범위 밖).
- FR-18: assistant 메시지 말풍선 하단에 `POST /chat` 응답의 `model`, `elapsed_time`을 작은 메타 정보로 표시한다(예: "exaone3.5:7.8b · 2.21초"). (사용자 요청으로 추가됨)

### 2.4 입력 영역 (`ChatInput`, `ChatWindow` 내부에 구성)

- FR-13: 텍스트 입력(textarea)과 전송 버튼으로 구성한다. placeholder는 "메시지를 입력하세요..."로 가정한다 — 목업의 자리표시자 텍스트가 상단 "대화 초기화" 버튼과 동일한 문구로 보이는데, 이는 목업 제작 과정의 오기로 추정된다 — **확인 필요**.
- FR-14: 빈 문자열 또는 공백만 있는 입력은 전송할 수 없다(버튼 비활성화, Enter 무시).
- FR-15: Enter(Shift+Enter는 줄바꿈)로도 전송 가능하다.
- FR-16: 전송 중에는 입력창과 버튼을 비활성화하고, 버튼 라벨을 "응답 생성 중..."으로 변경한다(목업과 동일). 완료 시 라벨은 "전송"으로 복귀한다.
- FR-17: 전송 로직은 버튼 클릭 또는 Enter 키 이벤트 핸들러 안에서 직접 수행하며, `useEffect`로 트리거하지 않는다 — 사용자 액션에 대한 응답은 이벤트 핸들러에서 처리하라는 React 공식 가이드를 따른다.[^3]

### 2.5 반응형 동작 (기본값 제안 — 확인 필요)

목업은 데스크톱 전용 2단 레이아웃만 제공하므로 아래 breakpoint는 이번 PRD에서 제안하는 기본값이다.

- **≥1024px (데스크톱)**: 목업과 동일하게 사이드바가 항상 고정 표시되는 2단 레이아웃. 토글 버튼 없음.
- **768–1023px (태블릿)**: 사이드바는 기본적으로 숨겨지고, 헤더의 토글 버튼으로 열고 닫는다. 열렸을 때도 채팅 화면을 덮지 않고 옆으로 나란히 배치되며(레이아웃을 밀어내는 방식), 사이드바 내부의 닫기(✕) 버튼 또는 토글 버튼을 다시 눌러 닫는다. (사용자 피드백으로 최초 안의 "배경 딤 처리된 오버레이 드로어 + 바깥 클릭 닫힘" 방식에서 변경됨 — 오버레이가 채팅 화면을 가리는 문제가 있었음)
- **<768px (모바일)**: 태블릿과 동일한 열기/닫기 동작 + 말풍선 최대 너비 90%, 입력창 하단 고정(sticky).

---

## 3. 기술 제약 (스택 · 폴더 구조 고정)

### 3.1 스택

| 항목 | 값 | 비고 |
|---|---|---|
| 프레임워크 | React 19 (`^19.2.8`, 이미 설치됨) | ref를 prop으로 직접 받을 수 있어 `forwardRef` 없이 컴포넌트 작성 가능[^1] |
| 빌드 도구 | Vite (`^8.3.0`, 이미 설치됨) | 기존 스캐폴딩 유지 |
| 언어 | JavaScript + JSX | TypeScript 사용 안 함(지시사항) |
| 스타일링 | 일반 CSS (`App.css`, `index.css`) | §3.3 고정 구조에 컴포넌트별 `*.module.css`가 없으므로 클래스명 규칙(예: BEM)으로 충돌을 피한다, 추가 라이브러리 불필요 |
| 상태 관리 | React 내장 `useState`만 사용, `App` 최상위에 두고 props로 하위 전달 | 외부 상태관리 라이브러리 도입 안 함 |
| 데이터 페칭 | `App.jsx` 내부의 `useEffect`/이벤트 핸들러에서 `api/chatApi.js` 함수 직접 호출 | §3.3 고정 구조에 별도 `hooks/` 폴더가 없어 커스텀 훅으로 감싸지 않음. 외부 데이터 페칭 라이브러리(React Query 등)도 도입 안 함 |
| 라우팅 | 없음 (단일 화면) | react-router 등 불필요 |
| 린트 | 기존 `eslint.config.js` 유지 | 변경 없음 |

**React 19 관련 결정과 근거**

- 데이터 페칭은 사용자 액션이 아닌 "외부 시스템과의 동기화"(마운트 시 모델 목록 조회)에서만 `useEffect`를 사용하고, 레이스 컨디션 방지를 위해 `ignore` 플래그 또는 `AbortController`로 클린업한다.[^2]
- 사용자가 트리거하는 동작(메시지 전송, 대화 초기화, 설정값 변경)은 `useEffect`가 아니라 이벤트 핸들러에서 직접 처리한다.[^3]
- 파생 상태(예: 전송 버튼 비활성화 여부, 말풍선 role별 스타일)는 별도 state로 저장하지 않고 렌더링 중 계산한다.[^3]
- React 공식 가이드는 데이터 페칭 로직을 `use` 접두사를 가진 커스텀 훅으로 분리할 것을 권장하지만[^4], §3.3 고정 구조에 별도 `hooks/` 디렉터리가 없으므로 이를 사용하는 컴포넌트(`App.jsx`) 내부에 직접 작성한다.
- React 19의 `useActionState`/`useOptimistic`/`use()` 등 신규 API는 이번 범위(단순 동기 REST 호출, 폼 액션 불필요)에서는 필수가 아니므로 도입하지 않는다. 다만 백엔드가 스트리밍으로 전환되거나 폼 기반 제출로 바뀌는 경우 재검토 대상으로 남긴다.[^1]

### 3.2 API 계약 (백엔드 기존 구현 고정, 변경 없음)

```
POST /chat
Request  { message: string, model: string, system_prompt: string,
           temperature: number(0~2), top_p: number(0~1), num_predict: number(1~2048) }
Response { model: string, message: string, elapsed_time: number }
Error    500 { detail: string }

GET /models
Response { models: string[] }
```

- 백엔드 CORS는 `allow_origins=["*"]`로 이미 열려 있음(`backend/main.py`).
- 프론트엔드는 API base URL을 `import.meta.env.VITE_API_BASE_URL` (기본값 `http://localhost:8000`)로 설정한다.
- 프론트엔드 내부 상태 필드명(camelCase: `systemPrompt`, `topP`, `numPredict`)과 API 요청 필드명(snake_case: `system_prompt`, `top_p`, `num_predict`)은 `api/chatApi.js`에서만 변환하고, 다른 컴포넌트/훅은 camelCase만 다룬다.

### 3.3 폴더 구조 (고정)

```
frontend/
├── docs/
│   ├── chat_ui_설계도.jpg
│   ├── 프롬프트.txt
│   ├── frontend-prd.md
│   ├── tasks.md          # 2단계 작업 목록
│   └── tdd.md            # 3단계 작업 처리 프롬프트
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.jsx
│   ├── api/
│   │ ├── chatApi.js        # API 호출 로직
│   │ ├── chatApi.test.js
│   │ ├── promptModes.js    # 시스템 프롬프트 모드 프리셋 데이터
│   │ └── promptModes.test.js
│   ├── components/
│   │ ├── ChatWindow.jsx        # 메인 채팅 윈도우
│   │ ├── ChatWindow.test.jsx
│   │ ├── SettingsPanel.jsx     # 모델 선택 패널
│   │ ├── SettingsPanel.test.jsx
│   │ ├── MessageList.jsx       # 메시지 목록
│   │ ├── MessageList.test.jsx
│   │ ├── MessageBubble.jsx     # 개별 메시지
│   │ ├── MessageBubble.test.jsx
│   │ ├── ChatInput.jsx         # 입력 필드
│   │ └── ChatInput.test.jsx
│   ├── test/
│   │ └── setup.js          # Vitest + @testing-library/jest-dom 전역 설정
│   ├── App.jsx # 앱 진입점
│   ├── App.test.jsx
│   ├── App.css # 앱 스타일
│   └── index.css # 전역 스타일
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js       # test 필드(Vitest, jsdom) 포함
└── eslint.config.js
```

이 구조는 고정이며, 이후 단계(코드 구현)에서 임의로 폴더를 추가/변경하지 않는다. 변경이 필요하면 본 PRD를 먼저 갱신한다.

**갱신 이력**: 3단계(TDD) 진행 중 테스트 프레임워크(Vitest, @testing-library/react, @testing-library/jest-dom)가 필요해 사용자 승인 하에 추가했다. `*.test.jsx`/`chatApi.test.js`, `src/test/setup.js`가 이에 해당하며, `docs/tasks.md`·`docs/tdd.md`는 2·3단계 작업 프롬프트 산출물이다. 원래 §3.3에는 없었으나 위 트리에 반영해 "1:1 일치"를 최신 상태로 유지한다. 이후 시스템 프롬프트 모드 선택 기능(§2.2 FR-19) 추가 시 사용자가 직접 `src/api/promptModes.js`를 만들어 전달했고, 이를 §3.3에 반영했다.

---

## 4. 컴포넌트 트리 및 파일 구조

§3.3 폴더 구조 기준 컴포넌트명: `SettingsPanel`(구 `Sidebar`), `ChatWindow`(구 `ChatPanel` — 헤더 영역과 `ChatInput`을 내부에 인라인으로 포함), `MessageList`, `MessageBubble`, `ChatInput`(구 `ChatInputBar`). `ChatHeader`와 `ParameterSlider`는 별도 파일로 분리하지 않고 각각 `ChatWindow`, `SettingsPanel` 내부의 로컬 마크업/헬퍼로 흡수한다. §3.3은 고정 구조이며 `hooks/`, `constants/` 폴더가 없으므로, 원래 그 폴더에 두려던 로직(모델 목록 조회, 메시지 전송, 기본 설정값)은 별도 파일로 분리하지 않고 `App.jsx` 내부에 직접 둔다(4.1·4.2 참고).

```
App.jsx
├─ SettingsPanel        (구 Sidebar: 모델 드롭다운, 시스템 프롬프트, 슬라이더 2개, Num Predict)
└─ ChatWindow           (구 ChatPanel: 헤더 영역 인라인 포함)
   ├─ MessageList
   │  └─ MessageBubble  (메시지별 반복)
   └─ ChatInput         (구 ChatInputBar)
```

### 4.1 상태 소유권 (`App.jsx`)

| State | 타입 | 설명|
|---|---|---|
| `settings` | `{ model, systemPrompt, temperature, topP, numPredict }` | `App.jsx` 상단의 로컬 상수 `DEFAULT_SETTINGS`로 초기화, `SettingsPanel`이 `onSettingsChange`로 갱신 |
| `messages` | `Array<{ id, role: 'user'\|'assistant'\|'error', content, model?, elapsedTime? }>` | `App.jsx`의 `handleSend`/`handleReset` 함수가 관리, `ChatWindow`에 전달. `model`/`elapsedTime`은 assistant 메시지에만 채워짐(FR-18) |
| `isSending` | `boolean` | `App.jsx`의 `handleSend`가 관리 |
| `chatError` | `string \| null` | `App.jsx`의 `handleSend`가 관리 |
| `models`, `modelsLoading`, `modelsError` | — | `App.jsx`의 `useEffect`(마운트 시 `fetchModels()` 호출)가 관리 |
| `isSidebarOpen` | `boolean` | 모바일/태블릿 드로어 전용(`SettingsPanel` 표시 여부), 데스크톱에서는 CSS로 항상 표시(state 무시) |

### 4.2 `App.jsx` 내부 로직 / API 모듈 책임

§3.3에 별도 `hooks/` 폴더가 없으므로, 아래 로직은 커스텀 훅으로 분리하지 않고 `App.jsx` 안에 직접 정의한다.

- 모델 목록 조회: `App.jsx`의 `useEffect`가 마운트 시 `fetchModels()`를 호출하고 `ignore` 플래그로 클린업하며, 결과를 `models`/`modelsLoading`/`modelsError` state에 반영한다.[^2]
- 메시지 전송: `App.jsx`의 `handleSend(text)` 함수(이벤트 핸들러에서 호출되는 비동기 함수, `ChatWindow` → `ChatInput`을 거쳐 트리거됨)가 `setMessages`로 사용자 메시지를 optimistic하게 추가 → `sendChatMessage()` 호출 → 성공/실패에 따라 assistant/error 메시지를 추가하고 `isSending`/`chatError`를 갱신한다.[^3]
- 대화 초기화: `App.jsx`의 `handleReset()` 함수가 `messages`만 비운다(`settings`는 유지).
- `api/chatApi.js`: `fetchModels()`, `sendChatMessage(payload)` — fetch 래퍼와 camelCase↔snake_case 변환만 담당, React에 의존하지 않는 순수 함수. §3.3 고정 구조에서 유일하게 분리된 데이터 계층이다.

### 4.3 Props 계약 (요약)

- `SettingsPanel({ settings, onSettingsChange, models, modelsLoading, modelsError, isOpen, onClose })` — Temperature/Top P 슬라이더는 별도 컴포넌트 없이 `SettingsPanel` 내부에 로컬 마크업으로 반복 작성한다. `<1024px`에서 `onClose`는 배경 오버레이가 아닌 패널 내부의 닫기(✕) 버튼 클릭으로 호출된다(§2.5). 시스템 프롬프트 모드 select는 `src/api/promptModes.js`를 import해 내부에서 직접 렌더링하며, 선택된 모드는 `settings.systemPrompt`와 프리셋 텍스트를 비교해 파생 계산한다(FR-19).
- `ChatWindow({ messages, isSending, chatError, onSend, onReset, onToggleSidebar })` — 타이틀/서브타이틀/"대화 초기화" 버튼/사이드바 토글 버튼(헤더 영역)을 내부에서 직접 렌더링하고, `MessageList`와 `ChatInput`을 자식으로 구성한다.
- `MessageList({ messages, isSending })`
- `MessageBubble({ role, content, model?, elapsedTime? })` — `model`/`elapsedTime`이 모두 있으면 말풍선 하단에 메타 정보(예: "exaone3.5:7.8b · 2.21초")를 표시한다(FR-18).
- `ChatInput({ onSend, disabled })`

---

## 5. 수용 기준 (완료 판정 기준)

1. 최초 로드 시 `GET /models`가 호출되고 성공하면 드롭다운이 결과로 채워진다. 실패해도 앱이 크래시하지 않고 기본 모델로 채팅을 계속 보낼 수 있다. (FR-4)
2. 사이드바에서 시스템 프롬프트/temperature/top_p/num_predict를 변경하면, 이후 전송되는 `POST /chat` 요청 바디에 정확히 반영된다(필드명 `message, model, system_prompt, temperature, top_p, num_predict` 일치, §3.2). (FR-5~8)
3. 사용자가 텍스트를 입력하고 전송(버튼 클릭 또는 Enter)하면, 사용자 메시지가 즉시 목록에 나타나고 입력창이 비워진다. 공백만 있는 입력은 전송되지 않는다. (FR-13~15)
4. 전송 중에는 입력창과 전송 버튼이 비활성화되고 버튼 라벨이 "응답 생성 중..."으로 바뀌며, 응답 도착 후 정상 상태로 복귀한다. (FR-16)
5. `POST /chat` 성공 시 assistant 메시지가 목록에 추가된다. 실패(네트워크 오류/500)시 에러가 사용자에게 보이고, 입력창은 재사용 가능한 상태로 복구된다. (FR-12)
6. "대화 초기화" 클릭 시 `messages`만 비워지고 `settings`는 유지된다. (FR-2)
7. 뷰포트 ≥1024px에서는 사이드바가 항상 보이는 2단 레이아웃이 목업과 시각적으로 일치한다. <1024px에서는 사이드바가 기본적으로 숨겨지고 토글 버튼으로 여닫을 수 있다. (§2.5)
8. 모든 컴포넌트는 함수형 컴포넌트 + Hooks로 작성되고, 클래스 컴포넌트가 없다. 저장소 내 `.ts`/`.tsx` 파일이 없다.
9. 데이터 페칭(`fetch`) 호출은 `api/chatApi.js` 바깥(즉 컴포넌트 내부)에 직접 존재하지 않는다 — 컴포넌트는 반드시 `api/chatApi.js`의 `fetchModels()`/`sendChatMessage()`를 경유하며, 호출부는 `App.jsx`의 `useEffect`/`handleSend`로 한정한다.
10. 모든 컴포넌트 스타일은 `src/App.css`에 컴포넌트별 클래스명(BEM 등 네이밍 규칙)으로 작성되며, `index.css`에는 전역 리셋/폰트 외의 컴포넌트별 규칙이 없다.
11. §3.3의 폴더 구조와 실제 저장소 구조가 1:1로 일치한다(파일 추가/누락 없음).

---

### 각주 (React 19 공식 문서 근거)

[^1]: React 19 릴리즈 노트 — `ref`를 일반 prop으로 전달 가능(`forwardRef` 불필요), Actions/`useActionState`/`useOptimistic`/`use()` 등 신규 API 개요. https://react.dev/blog/2024/12/05/react-19
[^2]: "Synchronizing with Effects" — Effect 안에서 데이터 페칭 시 레이스 컨디션 위험과 `ignore` 플래그/`AbortController`를 통한 클린업 필요성. https://react.dev/learn/synchronizing-with-effects
[^3]: "You Might Not Need an Effect" — 사용자 이벤트에 대한 응답은 Effect가 아닌 이벤트 핸들러에서 처리해야 하며, 파생 값은 렌더링 중 계산해야 한다는 가이드. https://react.dev/learn/you-might-not-need-an-effect
[^4]: "Reusing Logic with Custom Hooks" — Effect를 작성할 때 `use` 접두사를 가진 커스텀 훅으로 감싸 의도를 명확히 하라는 권장, 데이터 페칭 훅 예시. https://react.dev/learn/reusing-logic-with-custom-hooks
