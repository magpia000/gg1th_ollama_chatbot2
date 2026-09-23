import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { promptModes } from '../api/promptModes'
import SettingsPanel from './SettingsPanel'

const baseProps = {
  settings: {
    model: 'exaone3.5:7.8b',
    systemPrompt: '너는 초보자를 돕는 친절한 AI 강사다.',
    temperature: 0.6,
    topP: 0.7,
    numPredict: 256,
  },
  onSettingsChange: vi.fn(),
  models: [],
  modelsLoading: false,
  modelsError: null,
  isOpen: true,
  onClose: vi.fn(),
}

describe('SettingsPanel', () => {
  it('필수 props가 주어지면 크래시 없이 렌더링된다', () => {
    expect(() => render(<SettingsPanel {...baseProps} />)).not.toThrow()
  })

  describe('모델 드롭다운 (FR-4)', () => {
    it('models 배열로 옵션을 렌더링한다', () => {
      render(<SettingsPanel {...baseProps} models={['llama3', 'mistral']} />)

      const select = screen.getByRole('combobox', { name: '모델' })
      expect(select).toHaveTextContent('llama3')
      expect(select).toHaveTextContent('mistral')
    })

    it('modelsLoading이 true면 드롭다운이 비활성화된다', () => {
      render(<SettingsPanel {...baseProps} modelsLoading />)

      expect(screen.getByRole('combobox', { name: '모델' })).toBeDisabled()
    })

    it('modelsError가 있으면 드롭다운이 비활성화되고 에러 문구가 표시된다', () => {
      render(<SettingsPanel {...baseProps} modelsError="모델 목록을 불러오지 못했습니다" />)

      expect(screen.getByRole('combobox', { name: '모델' })).toBeDisabled()
      expect(screen.getByText('모델 목록을 불러오지 못했습니다')).toBeInTheDocument()
    })

    it('모델을 선택하면 onSettingsChange가 갱신된 model로 호출된다', () => {
      const onSettingsChange = vi.fn()
      render(
        <SettingsPanel
          {...baseProps}
          models={['llama3', 'mistral']}
          onSettingsChange={onSettingsChange}
        />,
      )

      fireEvent.change(screen.getByRole('combobox', { name: '모델' }), {
        target: { value: 'mistral' },
      })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        model: 'mistral',
      })
    })
  })

  describe('시스템 프롬프트 textarea (FR-5)', () => {
    it('settings.systemPrompt 값을 보여준다', () => {
      render(<SettingsPanel {...baseProps} />)

      expect(screen.getByRole('textbox', { name: '시스템 프롬프트' })).toHaveValue(
        baseProps.settings.systemPrompt,
      )
    })

    it('입력을 변경하면 onSettingsChange가 갱신된 systemPrompt로 호출된다', () => {
      const onSettingsChange = vi.fn()
      render(<SettingsPanel {...baseProps} onSettingsChange={onSettingsChange} />)

      fireEvent.change(screen.getByRole('textbox', { name: '시스템 프롬프트' }), {
        target: { value: '너는 엄격한 검토자다.' },
      })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        systemPrompt: '너는 엄격한 검토자다.',
      })
    })
  })

  describe('시스템 프롬프트 모드 선택 (promptModes.js)', () => {
    it('promptModes의 각 모드를 옵션으로 렌더링하고, 기본값은 "직접 입력"이다', () => {
      render(<SettingsPanel {...baseProps} />)

      const select = screen.getByRole('combobox', { name: '시스템 프롬프트 모드' })
      expect(select).toHaveValue('')
      Object.values(promptModes).forEach((mode) => {
        expect(select).toHaveTextContent(mode.label)
      })
    })

    it('모드를 선택하면 onSettingsChange가 해당 모드의 prompt로 systemPrompt를 갱신한다', () => {
      const onSettingsChange = vi.fn()
      render(<SettingsPanel {...baseProps} onSettingsChange={onSettingsChange} />)

      fireEvent.change(screen.getByRole('combobox', { name: '시스템 프롬프트 모드' }), {
        target: { value: 'code' },
      })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        systemPrompt: promptModes.code.prompt,
      })
    })

    it('선택한 모드의 prompt가 systemPrompt textarea에 표시된다', () => {
      const { rerender } = render(<SettingsPanel {...baseProps} />)

      const updatedSettings = { ...baseProps.settings, systemPrompt: promptModes.code.prompt }
      rerender(<SettingsPanel {...baseProps} settings={updatedSettings} />)

      expect(screen.getByRole('textbox', { name: '시스템 프롬프트' })).toHaveValue(
        promptModes.code.prompt,
      )
      expect(screen.getByRole('combobox', { name: '시스템 프롬프트 모드' })).toHaveValue('code')
    })
  })

  describe('Temperature / Top P 슬라이더 (FR-6)', () => {
    it('현재 값을 라벨에 실시간으로 표시한다', () => {
      render(<SettingsPanel {...baseProps} />)

      expect(screen.getByText('Temperature: 0.6')).toBeInTheDocument()
      expect(screen.getByText('Top P: 0.7')).toBeInTheDocument()
    })

    it('Temperature 슬라이더는 0.0~2.0 범위이며 변경 시 숫자로 onSettingsChange를 호출한다', () => {
      const onSettingsChange = vi.fn()
      render(<SettingsPanel {...baseProps} onSettingsChange={onSettingsChange} />)

      const slider = screen.getByRole('slider', { name: 'Temperature' })
      expect(slider).toHaveAttribute('min', '0')
      expect(slider).toHaveAttribute('max', '2')

      fireEvent.change(slider, { target: { value: '1.2' } })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        temperature: 1.2,
      })
    })

    it('Top P 슬라이더는 0.0~1.0 범위이며 변경 시 숫자로 onSettingsChange를 호출한다', () => {
      const onSettingsChange = vi.fn()
      render(<SettingsPanel {...baseProps} onSettingsChange={onSettingsChange} />)

      const slider = screen.getByRole('slider', { name: 'Top P' })
      expect(slider).toHaveAttribute('min', '0')
      expect(slider).toHaveAttribute('max', '1')

      fireEvent.change(slider, { target: { value: '0.55' } })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        topP: 0.55,
      })
    })
  })

  describe('Num Predict 숫자 입력 (FR-7)', () => {
    it('유효 범위(1~2048) 내 값은 그대로 onSettingsChange로 전달된다', () => {
      const onSettingsChange = vi.fn()
      render(<SettingsPanel {...baseProps} onSettingsChange={onSettingsChange} />)

      fireEvent.change(screen.getByRole('spinbutton', { name: 'Num Predict' }), {
        target: { value: '512' },
      })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        numPredict: 512,
      })
    })

    it('2048보다 큰 값은 2048로 클램핑된다', () => {
      const onSettingsChange = vi.fn()
      render(<SettingsPanel {...baseProps} onSettingsChange={onSettingsChange} />)

      fireEvent.change(screen.getByRole('spinbutton', { name: 'Num Predict' }), {
        target: { value: '9999' },
      })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        numPredict: 2048,
      })
    })

    it('1보다 작은 값은 1로 클램핑된다', () => {
      const onSettingsChange = vi.fn()
      render(<SettingsPanel {...baseProps} onSettingsChange={onSettingsChange} />)

      fireEvent.change(screen.getByRole('spinbutton', { name: 'Num Predict' }), {
        target: { value: '0' },
      })

      expect(onSettingsChange).toHaveBeenCalledWith({
        ...baseProps.settings,
        numPredict: 1,
      })
    })
  })

describe('사이드바 토글 동작 — 챗 화면을 덮지 않는 고정 패널 (§2.5)', () => {
    it('isOpen이 false면 배경 오버레이가 없고 패널에 열림 클래스가 없다', () => {
      const { container } = render(<SettingsPanel {...baseProps} isOpen={false} />)

      expect(screen.queryByTestId('settings-panel-backdrop')).not.toBeInTheDocument()
      expect(container.querySelector('.settings-panel')).not.toHaveClass(
        'settings-panel--open',
      )
    })

    it('isOpen이 true면 배경 오버레이 없이 패널에 열림 클래스만 붙는다(챗 화면을 덮지 않음)', () => {
      const { container } = render(<SettingsPanel {...baseProps} isOpen />)

      expect(screen.queryByTestId('settings-panel-backdrop')).not.toBeInTheDocument()
      expect(container.querySelector('.settings-panel')).toHaveClass('settings-panel--open')
    })

    it('패널 내부 닫기 버튼을 클릭하면 onClose가 호출된다', () => {
      const onClose = vi.fn()
      render(<SettingsPanel {...baseProps} isOpen onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: '사이드바 닫기' }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
