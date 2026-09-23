import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { DEFAULT_SETTINGS } from './App'
import * as chatApi from './api/chatApi'

vi.mock('./api/chatApi', () => ({
  fetchModels: vi.fn(),
  sendChatMessage: vi.fn(),
}))

describe('DEFAULT_SETTINGS', () => {
  it('backend/schemas.py의 ChatRequest 기본값과 동일하다', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      model: 'exaone3.5:7.8b',
      systemPrompt: '너는 초보자를 돕는 친절한 AI 강사다.',
      temperature: 0.6,
      topP: 0.7,
      numPredict: 256,
    })
  })
})

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chatApi.fetchModels.mockResolvedValue(['exaone3.5:7.8b'])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('§4.1의 전역 state 훅이 추가된 뒤에도 크래시 없이 렌더링된다', async () => {
    await act(async () => {
      render(<App />)
    })
  })

  it('마운트 시 fetchModels()를 한 번만 호출한다', async () => {
    await act(async () => {
      render(<App />)
    })

    expect(chatApi.fetchModels).toHaveBeenCalledTimes(1)
  })

  it('fetchModels()가 실패해도 처리되지 않은 예외 없이 안전하게 처리된다', async () => {
    chatApi.fetchModels.mockRejectedValue(new Error('네트워크 오류'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await act(async () => {
      render(<App />)
    })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  describe('SettingsPanel + ChatWindow 통합 (4.11)', () => {
    it('SettingsPanel과 ChatWindow가 함께 렌더링된다', async () => {
      await act(async () => {
        render(<App />)
      })

      expect(screen.getByRole('heading', { name: 'Local LLM Chat' })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: '모델' })).toBeInTheDocument()
    })

    it('메시지를 전송하면 성공 시 사용자/어시스턴트 메시지가 목록에 추가된다', async () => {
      chatApi.sendChatMessage.mockResolvedValue({
        model: 'exaone3.5:7.8b',
        message: '반갑습니다',
        elapsedTime: 1.2,
      })

      await act(async () => {
        render(<App />)
      })

      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '안녕' },
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '전송' }))
      })

      expect(screen.getByText('안녕')).toBeInTheDocument()
      expect(screen.getByText('반갑습니다')).toBeInTheDocument()
      expect(screen.getByText('exaone3.5:7.8b · 1.20초')).toBeInTheDocument()
    })

    it('전송 실패 시 사용자 메시지는 유지되고 chatError 배너가 표시된다', async () => {
      chatApi.sendChatMessage.mockRejectedValue(new Error('모델을 찾을 수 없습니다'))

      await act(async () => {
        render(<App />)
      })

      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '안녕' },
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '전송' }))
      })

      expect(screen.getByText('안녕')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent('모델을 찾을 수 없습니다')
    })

    it('"대화 초기화" 클릭 시 messages만 비워진다', async () => {
      chatApi.sendChatMessage.mockResolvedValue({
        model: 'exaone3.5:7.8b',
        message: '반갑습니다',
        elapsedTime: 1.2,
      })

      await act(async () => {
        render(<App />)
      })

      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '안녕' },
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '전송' }))
      })
      expect(screen.getByText('안녕')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: '대화 초기화' }))

      expect(screen.queryByText('안녕')).not.toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: '모델' })).toHaveValue('exaone3.5:7.8b')
    })

    it('사이드바에서 설정을 변경하면 이후 전송되는 POST /chat 요청에 반영된다 (§5 수용 기준 2)', async () => {
      chatApi.sendChatMessage.mockResolvedValue({
        model: 'exaone3.5:7.8b',
        message: '반갑습니다',
        elapsedTime: 1.2,
      })

      await act(async () => {
        render(<App />)
      })

      fireEvent.change(screen.getByRole('slider', { name: 'Temperature' }), {
        target: { value: '1.2' },
      })
      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '안녕' },
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '전송' }))
      })

      expect(chatApi.sendChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 1.2 }),
      )
    })

    it('응답 도착 후 입력창/버튼이 다시 정상 상태로 복귀한다 (§5 수용 기준 4)', async () => {
      chatApi.sendChatMessage.mockResolvedValue({
        model: 'exaone3.5:7.8b',
        message: '반갑습니다',
        elapsedTime: 1.2,
      })

      await act(async () => {
        render(<App />)
      })

      fireEvent.change(screen.getByPlaceholderText('메시지를 입력하세요...'), {
        target: { value: '안녕' },
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '전송' }))
      })

      expect(screen.getByPlaceholderText('메시지를 입력하세요...')).not.toBeDisabled()
      expect(screen.getByRole('button', { name: '전송' })).toBeInTheDocument()
    })

    it('사이드바 토글 버튼을 누르면 열리고 다시 누르면 닫힌다(챗 화면을 덮지 않음)', async () => {
      await act(async () => {
        render(<App />)
      })

      const settingsPanel = screen.getByRole('combobox', { name: '모델' }).closest('aside')
      expect(settingsPanel).not.toHaveClass('settings-panel--open')
      expect(screen.queryByTestId('settings-panel-backdrop')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: '사이드바 토글' }))
      expect(settingsPanel).toHaveClass('settings-panel--open')
      expect(screen.queryByTestId('settings-panel-backdrop')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: '사이드바 토글' }))
      expect(settingsPanel).not.toHaveClass('settings-panel--open')
    })

    it('사이드바 내부 닫기 버튼으로도 닫을 수 있다', async () => {
      await act(async () => {
        render(<App />)
      })

      const settingsPanel = screen.getByRole('combobox', { name: '모델' }).closest('aside')
      fireEvent.click(screen.getByRole('button', { name: '사이드바 토글' }))
      expect(settingsPanel).toHaveClass('settings-panel--open')

      fireEvent.click(screen.getByRole('button', { name: '사이드바 닫기' }))
      expect(settingsPanel).not.toHaveClass('settings-panel--open')
    })
  })
})
