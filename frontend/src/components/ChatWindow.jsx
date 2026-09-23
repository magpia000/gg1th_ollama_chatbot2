import ChatInput from './ChatInput'
import MessageList from './MessageList'

function ChatWindow({ messages, isSending, chatError, onSend, onReset, onToggleSidebar }) {
  return (
    <section className="chat-window">
      <header className="chat-window__header">
        <button
          type="button"
          className="chat-window__sidebar-toggle"
          aria-label="사이드바 토글"
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <div>
          <h1>Local LLM Chat</h1>
          <p>React + FastAPI + Ollama 기반 로컬 AI 채팅 앱</p>
        </div>
        <button type="button" onClick={onReset}>
          대화 초기화
        </button>
      </header>

      {chatError && (
        <p role="alert" className="chat-window__error-banner">
          {chatError}
        </p>
      )}

      <MessageList messages={messages} isSending={isSending} />

      <ChatInput onSend={onSend} disabled={isSending} />
    </section>
  )
}

export default ChatWindow
