import { useEffect, useState } from 'react'
import { fetchModels, sendChatMessage } from './api/chatApi'
import ChatWindow from './components/ChatWindow'
import SettingsPanel from './components/SettingsPanel'
import './App.css'

// backend/schemas.py의 ChatRequest 기본값과 동일하게 유지한다 (§2.2 FR-8)
// eslint-disable-next-line react-refresh/only-export-components -- §3.3 고정 구조상 별도 constants 파일로 분리하지 않음
export const DEFAULT_SETTINGS = {
  model: 'exaone3.5:7.8b',
  systemPrompt: '너는 초보자를 돕는 친절한 AI 강사다.',
  temperature: 0.6,
  topP: 0.7,
  numPredict: 256,
}

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState(null)

  // 마운트 시 모델 목록 조회, ignore 플래그로 레이스 컨디션 방지 (§3.1, §4.2)
  useEffect(() => {
    let ignore = false

    async function loadModels() {
      setModelsLoading(true)
      setModelsError(null)
      try {
        const result = await fetchModels()
        if (!ignore) {
          setModels(result)
          setModelsLoading(false)
        }
      } catch (error) {
        if (!ignore) {
          setModelsError(error.message)
          setModelsLoading(false)
        }
      }
    }

    loadModels()

    return () => {
      ignore = true
    }
  }, [])

  // 사용자 메시지 optimistic 추가 → sendChatMessage 호출 → 성공/실패 처리 (§4.2)
  async function handleSend(text) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }])
    setIsSending(true)
    setChatError(null)

    try {
      const result = await sendChatMessage({
        message: text,
        model: settings.model,
        systemPrompt: settings.systemPrompt,
        temperature: settings.temperature,
        topP: settings.topP,
        numPredict: settings.numPredict,
      })
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.message,
          model: result.model,
          elapsedTime: result.elapsedTime,
        },
      ])
    } catch (error) {
      setChatError(error.message)
    } finally {
      setIsSending(false)
    }
  }

  // "대화 초기화": messages만 비우고 settings는 유지 (§2.1 FR-2)
  function handleReset() {
    setMessages([])
  }

  function handleToggleSidebar() {
    setIsSidebarOpen((prev) => !prev)
  }

  return (
    <div className="app-layout">
      <SettingsPanel
        settings={settings}
        onSettingsChange={setSettings}
        models={models}
        modelsLoading={modelsLoading}
        modelsError={modelsError}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ChatWindow
        messages={messages}
        isSending={isSending}
        chatError={chatError}
        onSend={handleSend}
        onReset={handleReset}
        onToggleSidebar={handleToggleSidebar}
      />
    </div>
  )
}

export default App
