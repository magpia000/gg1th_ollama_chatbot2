import { useState } from 'react'

function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const isSendDisabled = disabled || text.trim() === ''

  function handleSend() {
    if (isSendDisabled) {
      return
    }
    onSend(text)
    setText('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input">
      <textarea
        placeholder="메시지를 입력하세요..."
        value={text}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="button" onClick={handleSend} disabled={isSendDisabled}>
        {disabled ? '응답 생성 중...' : '전송'}
      </button>
    </div>
  )
}

export default ChatInput
