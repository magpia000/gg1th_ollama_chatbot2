import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MessageBubble from './MessageBubble'

describe('MessageBubble', () => {
  it('content를 렌더링한다', () => {
    render(<MessageBubble role="user" content="안녕하세요" />)

    expect(screen.getByText('안녕하세요')).toBeInTheDocument()
  })

  it.each([
    ['user', 'message-bubble--user'],
    ['assistant', 'message-bubble--assistant'],
    ['error', 'message-bubble--error'],
  ])('role=%s이면 %s 클래스를 가진다', (role, className) => {
    const { container } = render(<MessageBubble role={role} content="내용" />)

    expect(container.firstChild).toHaveClass('message-bubble', className)
  })

  describe('모델/응답 시간 메타 정보', () => {
    it('assistant 메시지에 model과 elapsedTime이 있으면 메타 정보를 표시한다', () => {
      render(
        <MessageBubble
          role="assistant"
          content="안녕하세요"
          model="exaone3.5:7.8b"
          elapsedTime={1.234}
        />,
      )

      expect(screen.getByText('exaone3.5:7.8b · 1.23초')).toBeInTheDocument()
    })

    it('model/elapsedTime이 없으면 메타 정보를 표시하지 않는다', () => {
      render(<MessageBubble role="user" content="안녕하세요" />)

      expect(screen.queryByText(/초$/)).not.toBeInTheDocument()
    })
  })
})
