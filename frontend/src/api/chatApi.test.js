import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchModels, sendChatMessage } from './chatApi'

describe('chatApi', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchModels', () => {
    it('GET /models를 호출하고 models 배열을 반환한다', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: ['llama3', 'mistral'] }),
      })

      const result = await fetchModels()

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/models'),
        expect.any(Object),
      )
      expect(result).toEqual(['llama3', 'mistral'])
    })

    it('응답이 실패하면 에러를 던진다', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 })

      await expect(fetchModels()).rejects.toThrow()
    })
  })

  describe('sendChatMessage', () => {
    it('camelCase payload를 snake_case body로 변환해 POST /chat을 호출한다', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ model: 'llama3', message: '안녕', elapsed_time: 1.23 }),
      })

      const result = await sendChatMessage({
        message: '안녕',
        model: 'llama3',
        systemPrompt: '너는 친절한 AI다.',
        temperature: 0.6,
        topP: 0.7,
        numPredict: 256,
      })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message: '안녕',
            model: 'llama3',
            system_prompt: '너는 친절한 AI다.',
            temperature: 0.6,
            top_p: 0.7,
            num_predict: 256,
          }),
        }),
      )
      expect(result).toEqual({ model: 'llama3', message: '안녕', elapsedTime: 1.23 })
    })

    it('실패 응답의 detail 메시지로 에러를 던진다', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: '모델을 찾을 수 없습니다' }),
      })

      await expect(
        sendChatMessage({
          message: '안녕',
          model: 'unknown',
          systemPrompt: '',
          temperature: 0.6,
          topP: 0.7,
          numPredict: 256,
        }),
      ).rejects.toThrow('모델을 찾을 수 없습니다')
    })
  })

  describe('API_BASE_URL 기본값 (§3.2)', () => {
    it('VITE_API_BASE_URL이 설정되지 않으면 http://localhost:8000을 사용한다', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      })

      await fetchModels()

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/models',
        expect.any(Object),
      )
    })
  })
})
