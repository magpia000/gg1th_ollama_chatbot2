# Local LLM Chat — 작업 목록 (2단계)

> 입력 문서: [`docs/frontend-prd.md`](./frontend-prd.md)
> 작성 단계: 2단계(작업 목록) — 이 문서는 작업 목록이며 코드는 포함하지 않는다.
> 각 작업은 완료 후 체크박스를 채운다(`[ ]` → `[x]`).

**context7 관련 안내**: 이번 세션에도 context7 MCP 도구가 연결되어 있지 않아 사용할 수 없었다. `frontend-prd.md`와 동일하게 React 공식 문서(react.dev)를 직접 조회해 API 시그니처/패턴 근거로 남겼다. context7 연결이 필요하면 별도 설정 후 재검증을 권장한다.

---

## 1. [기반] API 계층 & 전역 상태 뼈대 구성

- [x] 1.1 `src/api/chatApi.js` 작성 — `fetchModels()`, `sendChatMessage(payload)` 순수 함수. `POST /chat`/`GET /models` 호출과 camelCase(`systemPrompt`,`topP`,`numPredict`)→snake_case(`system_prompt`,`top_p`,`num_predict`) 변환만 담당, React 비의존. (§3.2, §3.3)
- [x] 1.2 `src/App.jsx` 상단에 `DEFAULT_SETTINGS` 로컬 상수 정의 — `backend/schemas.py`의 `ChatRequest` 기본값과 동일(model: "exaone3.5:7.8b", system_prompt: "너는 초보자를 돕는 친절한 AI 강사다.", temperature: 0.6, top_p: 0.7, num_predict: 256). (§2.2 FR-8)
- [x] 1.3 `App.jsx`에 `settings`, `messages`, `isSending`, `chatError`, `models`, `modelsLoading`, `modelsError`, `isSidebarOpen` state 선언. (§4.1)
  - 참고: `useState` — https://react.dev/reference/react/useState
- [x] 1.4 `App.jsx`에 모델 목록 조회 `useEffect` 작성 — 마운트 시 `fetchModels()` 호출, `ignore` 플래그로 클린업, 결과를 `models`/`modelsLoading`/`modelsError`에 반영. (§3.1, §4.2)
  - 참고: "Synchronizing with Effects"(레이스 컨디션 방지를 위한 `ignore` 플래그 클린업) — https://react.dev/learn/synchronizing-with-effects
- [x] 1.5 `App.jsx`에 `handleSend(text)` 이벤트 핸들러 작성 — `setMessages`로 사용자 메시지 optimistic 추가 → `sendChatMessage()` 호출 → 성공 시 assistant 메시지, 실패 시 error 메시지 추가 및 `isSending`/`chatError` 갱신. (§4.2)
  - 참고: "You Might Not Need an Effect"(사용자 액션은 이벤트 핸들러에서 처리) — https://react.dev/learn/you-might-not-need-an-effect
- [x] 1.6 `App.jsx`에 `handleReset()` 이벤트 핸들러 작성 — `messages`만 비우고 `settings`는 유지. (§2.1 FR-2, §4.2)
- [x] 1.7 `VITE_API_BASE_URL` 환경 변수 확인/문서화(기본값 `http://localhost:8000`). (§3.2)

---

## 2. [헤더+사이드바 영역] `SettingsPanel` 구현 — 목업 좌측 패널

- [x] 2.1 `src/components/SettingsPanel.jsx` 골격 생성 — props `{ settings, onSettingsChange, models, modelsLoading, modelsError, isOpen, onClose }`. (§4.3)
- [x] 2.2 모델 드롭다운 UI — `models` prop으로 옵션 렌더링, `modelsLoading` 시 비활성화, `modelsError` 시 비활성화 + 에러 문구 표시. (§2.2 FR-4)
- [x] 2.3 시스템 프롬프트 멀티라인 textarea — 변경 시 즉시 `onSettingsChange` 호출(제어 컴포넌트). (§2.2 FR-5)
  - 참고: 제어 컴포넌트(Controlled Components) — https://react.dev/reference/react-dom/components/textarea
- [x] 2.4 Temperature(0.0–2.0)/Top P(0.0–1.0) 슬라이더 로컬 마크업 — `SettingsPanel` 내부에 직접 작성(별도 컴포넌트로 분리하지 않음), 라벨에 현재값 실시간 표시. (§2.2 FR-6)
- [x] 2.5 Num Predict 숫자 입력(1–2048) 및 범위 초과 시 클램핑 로직. (§2.2 FR-7)
- [x] 2.6 반응형 열림/닫힘 동작 — `isOpen`/`onClose` 기반, 열려도 채팅 화면을 덮지 않고 레이아웃을 밀어냄(768–1023px, <768px). 패널 내부 닫기(✕) 버튼으로 닫기(사용자 피드백으로 배경 딤 오버레이 + 바깥 클릭 닫힘 방식에서 변경 — 오버레이가 채팅 화면을 가리는 문제가 있었음). (§2.5)
- [x] 2.7 `App.css`에 `SettingsPanel` 관련 클래스명(BEM 등) 스타일 작성 — 컴포넌트별 `*.module.css` 없음(§3.3 고정). (§3.1)

---

## 3. [대화 메시지 영역] `MessageList` / `MessageBubble` 구현 — 목업 중앙 대화창

- [x] 3.1 `src/components/MessageBubble.jsx` 구현 — props `{ role, content }`, `role`별 정렬/배경(user: 우측 정렬·옅은 파란색, assistant: 좌측 정렬·옅은 회색, error: 오류 스타일). (§2.3 FR-9, FR-10, FR-12)
- [x] 3.2 `src/components/MessageList.jsx` 구현 — props `{ messages, isSending }`, `messages.map`으로 `MessageBubble` 렌더. (§4.3)
  - 참고: 리스트 렌더링과 `key` — https://react.dev/learn/rendering-lists
- [x] 3.3 전송 중(`isSending === true`) 로딩 placeholder 어시스턴트 말풍선을 목록 하단에 표시. (§2.3 FR-11)
- [x] 3.4 API 오류 시에도 해당 사용자 메시지가 목록에 남아있는지 검증(1.5 결정: 오류는 `messages`에 추가하지 않고 4.5의 `chatError` 배너로 노출 — `MessageBubble`의 `role: 'error'` 스타일은 3.1에서 지원하되 현재 흐름에서는 트리거되지 않음). (§2.3 FR-12)
- [x] 3.5 `App.css`에 `MessageList`/`MessageBubble` 클래스명 스타일 작성(모바일 말풍선 최대 너비 90% 포함). (§2.5, §3.1)
- [x] 3.6 assistant 말풍선에 `model`/`elapsedTime` 메타 정보 표시(사용자 요청으로 추가, §2.3 FR-18) — `MessageBubble`이 렌더링, `MessageList`가 message 객체에서 전달, `App.jsx`의 `handleSend`가 `sendChatMessage()` 응답의 `model`/`elapsedTime`을 메시지에 저장.

---

## 4. [헤더+입력 영역] `ChatWindow` / `ChatInput` 구현 — 목업 상단 헤더 + 하단 입력창

- [x] 4.1 `src/components/ChatWindow.jsx` 골격 생성 — props `{ messages, isSending, chatError, onSend, onReset, onToggleSidebar }`. (§4.3)
- [x] 4.2 헤더 마크업(인라인) — 타이틀 "Local LLM Chat", 서브타이틀 "React + FastAPI + Ollama 기반 로컬 AI 채팅 앱". (§2.1 FR-1)
- [x] 4.3 헤더 우측 "대화 초기화" 버튼 — 클릭 시 확인 다이얼로그 없이 즉시 `onReset` 호출. (§2.1 FR-2)
- [x] 4.4 헤더 좌측 사이드바 토글(햄버거) 버튼 — 뷰포트 1024px 미만에서만 표시, `onToggleSidebar` 호출. (§2.1 FR-3)
- [x] 4.5 `ChatWindow` 내부에 `MessageList`, `ChatInput` 배치 및 데이터 전달, `chatError`를 인라인 배너로 표시(1.5 결정에 따른 FR-12 구현 지점). (§4 컴포넌트 트리, §2.3 FR-12)
- [x] 4.6 `src/components/ChatInput.jsx` 골격 생성 — textarea + 전송 버튼, placeholder "메시지를 입력하세요...". (§2.4 FR-13)
- [x] 4.7 빈 문자열/공백만 있는 입력 전송 방지 — 버튼 disabled 여부는 별도 state 없이 렌더링 중 파생 계산. (§2.4 FR-14)
  - 참고: 파생 값은 state로 저장하지 않고 렌더링 중 계산 — https://react.dev/learn/you-might-not-need-an-effect
- [x] 4.8 Enter 전송/Shift+Enter 줄바꿈 `onKeyDown` 핸들러 구현 — 전송 로직은 이벤트 핸들러 안에서 직접 수행, `useEffect` 미사용. (§2.4 FR-15, FR-17)
  - 참고: "You Might Not Need an Effect" — https://react.dev/learn/you-might-not-need-an-effect
- [x] 4.9 전송 중 입력창/버튼 비활성화 및 버튼 라벨 "응답 생성 중..." ↔ "전송" 전환. (§2.4 FR-16)
- [x] 4.10 `App.css`에 `ChatWindow`/`ChatInput` 클래스명 스타일 작성(모바일 입력창 하단 고정 sticky 포함). (§2.5, §3.1)
- [x] 4.11 `App.jsx`의 Vite 데모 스캐폴드(hero/counter/링크 목록)를 제거하고 `SettingsPanel` + `ChatWindow`를 조합해 렌더링, 1.3에서 선언한 state와 1.5/1.6의 `handleSend`/`handleReset`을 props로 연결(임시 `eslint-disable no-unused-vars` 제거). (§4 컴포넌트 트리)

---

## 5. [반응형 & QA] 반응형 레이아웃 적용 및 수용 기준 검증

- [x] 5.1 데스크톱(≥1024px) 2단 레이아웃 CSS — `SettingsPanel` 항상 표시, 토글 버튼 숨김. (§2.5)
- [x] 5.2 태블릿(768–1023px) 사이드바 열림/닫힘 CSS — 기본 숨김, 토글 버튼으로 열기, 열려도 채팅 화면을 덮지 않고 레이아웃을 밀어냄(오버레이/배경 딤 없음). (§2.5)
- [x] 5.3 모바일(<768px) 스타일 — 태블릿과 동일한 열기/닫기 동작(오버레이 없음) + 말풍선 최대 너비 90% + 입력창 하단 고정(sticky). (§2.5)
- [x] 5.4 §5 수용 기준 1~11번 항목을 각각 수동 검증(체크리스트 실행). (frontend-prd.md §5)
- [x] 5.5 §3.3 폴더 구조와 실제 저장소 구조 1:1 일치 여부 최종 확인 — 파일 추가/누락 없음. (frontend-prd.md §5 항목 11)
- [x] 5.6 저장소 내 `.ts`/`.tsx` 파일 및 클래스 컴포넌트 없음 확인. (frontend-prd.md §5 항목 8)
- [x] 5.7 시각 검수 후 폴리시 — `SettingsPanel`/`ChatWindow` 헤더·`MessageList`·`ChatInput`의 좌우 여백을 20px → 28px로 확대(사용자 피드백).

---

## 6. [헤더+사이드바 영역] 시스템 프롬프트 모드 선택 기능 (사용자 요청으로 추가, §2.2 FR-19)

- [x] 6.1 `src/api/promptModes.js`(사용자가 직접 작성해 전달)의 각 모드를 옵션으로 나열하는 select를 `SettingsPanel`에 추가, 기본 선택값은 "직접 입력"(빈 값). 선택된 모드는 `settings.systemPrompt`가 어느 프리셋과 일치하는지로 파생 계산(별도 state 없음).
- [x] 6.2 모드를 선택하면 `onSettingsChange`로 `systemPrompt`를 해당 프리셋 텍스트로 갱신 → 기존 FR-5 textarea가 그대로 반영해 보여줌.
- [x] 6.3 전송 시 서버 전달 확인 — 별도 구현 없이 기존 `handleSend`가 `settings.systemPrompt`를 그대로 `sendChatMessage()`에 전달하는 경로(§4.2)를 재사용함을 App 통합 테스트로 검증.
- [x] 6.4 `promptModes.js` 데이터 무결성(각 모드 `label`/`prompt` 비어있지 않음) 테스트 추가.

**§3.3 갱신**: `src/api/promptModes.js`, `promptModes.test.js`를 폴더 구조에 반영(고정 트리는 §3.3 참고).
