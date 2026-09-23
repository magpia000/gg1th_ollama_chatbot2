import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChatWindow from './ChatWindow'

const baseProps = {
  messages: [],
  isSending: false,
  chatError: null,
  onSend: vi.fn(),
  onReset: vi.fn(),
  onToggleSidebar: vi.fn(),
}

describe('ChatWindow', () => {
  it('필수 props가 주어지면 크래시 없이 렌더링된다', () => {
    expect(() => render(<ChatWindow {...baseProps} />)).not.toThrow()
  })

  describe('헤더 (FR-1)', () => {
    it('타이틀과 서브타이틀을 표시한다', () => {
      render(<ChatWindow {...baseProps} />)

      expect(screen.getByRole('heading', { name: 'Local LLM Chat' })).toBeInTheDocument()
      expect(
        screen.getByText('React + FastAPI + Ollama 기반 로컬 AI 채팅 앱'),
      ).toBeInTheDocument()
    })
  })

  describe('대화 초기화 버튼 (FR-2)', () => {
    it('클릭하면 확인 다이얼로그 없이 즉시 onReset을 호출한다', () => {
      const onReset = vi.fn()
      render(<ChatWindow {...baseProps} onReset={onReset} />)

      fireEvent.click(screen.getByRole('button', { name: '대화 초기화' }))

      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('사이드바 토글 버튼 (FR-3)', () => {
    it('클릭하면 onToggleSidebar를 호출한다', () => {
      const onToggleSidebar = vi.fn()
      render(<ChatWindow {...baseProps} onToggleSidebar={onToggleSidebar} />)

      fireEvent.click(screen.getByRole('button', { name: '사이드바 토글' }))

      expect(onToggleSidebar).toHaveBeenCalledTimes(1)
    })
  })

  describe('MessageList 배치 및 chatError 배너 (FR-12)', () => {
    it('messages/isSending을 MessageList에 전달해 렌더링한다', () => {
      render(
        <ChatWindow
          {...baseProps}
          messages={[{ id: '1', role: 'user', content: '안녕하세요' }]}
        />,
      )

      expect(screen.getByText('안녕하세요')).toBeInTheDocument()
    })

    it('chatError가 있으면 인라인 배너로 표시한다', () => {
      render(<ChatWindow {...baseProps} chatError="네트워크 오류가 발생했습니다" />)

      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument()
    })

    it('chatError가 없으면 배너가 없다', () => {
      render(<ChatWindow {...baseProps} chatError={null} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('ChatInput 배치', () => {
    it('ChatInput을 렌더링하고 전송 시 onSend를 호출한다', () => {
      const onSend = vi.fn()
      render(<ChatWindow {...baseProps} onSend={onSend} />)

      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '안녕' },
      })
      fireEvent.click(screen.getByRole('button', { name: '전송' }))

      expect(onSend).toHaveBeenCalledWith('안녕')
    })

    it('isSending을 ChatInput의 disabled로 전달한다', () => {
      render(<ChatWindow {...baseProps} isSending />)

      expect(screen.getByPlaceholderText('메시지를 입력하세요...')).toBeDisabled()
      expect(screen.getByRole('button', { name: '응답 생성 중...' })).toBeInTheDocument()
    })
  })
})
