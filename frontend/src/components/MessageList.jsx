import MessageBubble from './MessageBubble'

function MessageList({ messages, isSending }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          model={message.model}
          elapsedTime={message.elapsedTime}
        />
      ))}
      {isSending && (
        <div className="message-bubble message-bubble--assistant message-bubble--pending">
          응답 생성 중...
        </div>
      )}
    </div>
  )
}

export default MessageList
