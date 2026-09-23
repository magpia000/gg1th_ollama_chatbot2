import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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

  describe('마크다운 렌더링', () => {
    it('assistant 메시지는 마크다운을 해석해서 표시한다', () => {
      const { container } = render(
        <MessageBubble role="assistant" content={'**굵게** 그리고 `code`'} />,
      )

      expect(container.querySelector('strong')).toHaveTextContent('굵게')
      expect(container.querySelector('code')).toHaveTextContent('code')
    })

    it('user 메시지는 마크다운을 해석하지 않고 그대로 표시한다', () => {
      const { container } = render(
        <MessageBubble role="user" content={'**굵게**'} />,
      )

      expect(container.querySelector('strong')).not.toBeInTheDocument()
      expect(screen.getByText('**굵게**')).toBeInTheDocument()
    })

    it('assistant 메시지의 스크립트 태그는 제거된다', () => {
      const { container } = render(
        <MessageBubble
          role="assistant"
          content={'안녕<script>window.__xss = true</script>'}
        />,
      )

      expect(container.querySelector('script')).not.toBeInTheDocument()
    })
  })

  describe('복사 버튼', () => {
    it('복사 버튼을 클릭하면 클립보드에 content가 복사된다', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      render(<MessageBubble role="assistant" content="복사할 내용" />)

      fireEvent.click(screen.getByRole('button', { name: '메시지 복사' }))

      expect(writeText).toHaveBeenCalledWith('복사할 내용')
    })
  })
})
