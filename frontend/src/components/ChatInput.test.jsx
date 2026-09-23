import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChatInput from './ChatInput'

const baseProps = {
  onSend: vi.fn(),
  disabled: false,
}

describe('ChatInput', () => {
  it('placeholder "메시지를 입력하세요..."를 가진 textarea와 전송 버튼을 렌더링한다', () => {
    render(<ChatInput {...baseProps} />)

    expect(screen.getByPlaceholderText('메시지를 입력하세요...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전송' })).toBeInTheDocument()
  })

  describe('빈/공백 입력 방지 (FR-14)', () => {
    it('입력이 비어있으면 전송 버튼이 비활성화된다', () => {
      render(<ChatInput {...baseProps} />)

      expect(screen.getByRole('button', { name: '전송' })).toBeDisabled()
    })

    it('공백만 입력하면 전송 버튼이 비활성화된다', () => {
      render(<ChatInput {...baseProps} />)

      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '   ' },
      })

      expect(screen.getByRole('button', { name: '전송' })).toBeDisabled()
    })

    it('유효한 텍스트가 있으면 버튼이 활성화되고 클릭 시 onSend가 호출된다', () => {
      const onSend = vi.fn()
      render(<ChatInput {...baseProps} onSend={onSend} />)

      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '안녕' },
      })
      const button = screen.getByRole('button', { name: '전송' })
      expect(button).not.toBeDisabled()

      fireEvent.click(button)

      expect(onSend).toHaveBeenCalledWith('안녕')
    })
  })

  describe('Enter 전송 / Shift+Enter 줄바꿈 (FR-15)', () => {
    it('Enter만 누르면 onSend를 호출하고 입력을 비운다', () => {
      const onSend = vi.fn()
      render(<ChatInput {...baseProps} onSend={onSend} />)
      const textarea = screen.getByPlaceholderText('메시지를 입력하세요...')

      fireEvent.change(textarea, { target: { value: '안녕' } })
      fireEvent.keyDown(textarea, { key: 'Enter' })

      expect(onSend).toHaveBeenCalledWith('안녕')
      expect(textarea).toHaveValue('')
    })

    it('Shift+Enter는 onSend를 호출하지 않는다(줄바꿈 허용)', () => {
      const onSend = vi.fn()
      render(<ChatInput {...baseProps} onSend={onSend} />)
      const textarea = screen.getByPlaceholderText('메시지를 입력하세요...')

      fireEvent.change(textarea, { target: { value: '안녕' } })
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

      expect(onSend).not.toHaveBeenCalled()
    })

    it('공백만 있을 때 Enter를 눌러도 onSend를 호출하지 않는다', () => {
      const onSend = vi.fn()
      render(<ChatInput {...baseProps} onSend={onSend} />)
      const textarea = screen.getByPlaceholderText('메시지를 입력하세요...')

      fireEvent.change(textarea, { target: { value: '   ' } })
      fireEvent.keyDown(textarea, { key: 'Enter' })

      expect(onSend).not.toHaveBeenCalled()
    })
  })

  describe('전송 중 상태 (FR-16)', () => {
    it('disabled가 true면 입력창/버튼이 비활성화되고 버튼 라벨이 "응답 생성 중..."이다', () => {
      render(<ChatInput {...baseProps} disabled />)

      expect(screen.getByPlaceholderText('메시지를 입력하세요...')).toBeDisabled()
      const button = screen.getByRole('button', { name: '응답 생성 중...' })
      expect(button).toBeDisabled()
    })

    it('disabled가 false면 버튼 라벨이 "전송"으로 복귀한다', () => {
      render(<ChatInput {...baseProps} disabled={false} />)

      expect(screen.getByRole('button', { name: '전송' })).toBeInTheDocument()
    })
  })
})
