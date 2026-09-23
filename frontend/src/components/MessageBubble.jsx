import { useMemo, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true })

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 클립보드 접근이 불가한 환경에서는 조용히 무시한다
    }
  }

  return (
    <button
      type="button"
      className="message-bubble__copy"
      onClick={handleCopy}
      aria-label="메시지 복사"
      title={copied ? '복사됨' : '복사'}
    >
      {copied ? (
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 14.5 3.5 10l1.4-1.4L8 11.7l7.1-7.1L16.5 6z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 2v8h8V4H7ZM3 6v10a2 2 0 0 0 2 2h8v-2H5V6H3Z"
          />
        </svg>
      )}
    </button>
  )
}

function MessageBubble({ role, content, model, elapsedTime }) {
  const hasMeta = model != null && elapsedTime != null

  const html = useMemo(() => {
    if (role !== 'assistant') return null
    return DOMPurify.sanitize(marked.parse(content ?? ''))
  }, [role, content])

  return (
    <div className={`message-bubble message-bubble--${role}`}>
      {html != null ? (
        <div
          className="message-bubble__markdown"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="message-bubble__plain">{content}</div>
      )}
      <div className="message-bubble__footer">
        {hasMeta && (
          <span className="message-bubble__meta">
            {model} · {elapsedTime.toFixed(2)}초
          </span>
        )}
        <CopyButton text={content ?? ''} />
      </div>
    </div>
  )
}

export default MessageBubble
