function MessageBubble({ role, content, model, elapsedTime }) {
  const hasMeta = model != null && elapsedTime != null

  return (
    <div className={`message-bubble message-bubble--${role}`}>
      <div>{content}</div>
      {hasMeta && (
        <div className="message-bubble__meta">
          {model} · {elapsedTime.toFixed(2)}초
        </div>
      )}
    </div>
  )
}

export default MessageBubble
