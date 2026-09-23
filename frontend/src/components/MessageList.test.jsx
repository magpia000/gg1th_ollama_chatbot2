import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MessageList from './MessageList'

const messages = [
  { id: '1', role: 'user', content: '안녕' },
  { id: '2', role: 'assistant', content: '반갑습니다' },
]

describe('MessageList', () => {
  it('messages 배열을 순서대로 렌더링한다', () => {
    render(<MessageList messages={messages} isSending={false} />)

    const bubbles = screen.getAllByText(/안녕|반갑습니다/)
    expect(bubbles).toHaveLength(2)
    expect(bubbles[0]).toHaveTextContent('안녕')
    expect(bubbles[1]).toHaveTextContent('반갑습니다')
  })

  describe('전송 중 로딩 placeholder (FR-11)', () => {
    it('isSending이 true면 로딩 placeholder를 하단에 표시한다', () => {
      render(<MessageList messages={messages} isSending />)

      expect(screen.getByText('응답 생성 중...')).toBeInTheDocument()
    })

    it('isSending이 false면 로딩 placeholder가 없다', () => {
      render(<MessageList messages={messages} isSending={false} />)

      expect(screen.queryByText('응답 생성 중...')).not.toBeInTheDocument()
    })
  })

  describe('API 오류 후 사용자 메시지 유지 (FR-12)', () => {
    it('마지막 메시지가 응답 없는 user 메시지여도 목록에서 사라지지 않는다', () => {
      const messagesWithPendingFailure = [
        { id: '1', role: 'user', content: '첫 메시지' },
        { id: '2', role: 'assistant', content: '첫 응답' },
        { id: '3', role: 'user', content: '실패한 메시지' },
      ]

      render(<MessageList messages={messagesWithPendingFailure} isSending={false} />)

      expect(screen.getByText('실패한 메시지')).toBeInTheDocument()
    })
  })

  describe('모델/응답 시간 메타 정보 전달', () => {
    it('message의 model/elapsedTime을 MessageBubble에 전달한다', () => {
      const messagesWithMeta = [
        { id: '1', role: 'assistant', content: '반갑습니다', model: 'exaone3.5:7.8b', elapsedTime: 1.2 },
      ]

      render(<MessageList messages={messagesWithMeta} isSending={false} />)

      expect(screen.getByText('exaone3.5:7.8b · 1.20초')).toBeInTheDocument()
    })
  })
})
