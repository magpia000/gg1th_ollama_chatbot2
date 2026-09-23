// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:9000'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchModels(options = {}) {
  const response = await fetch(`${API_BASE_URL}/models`, { signal: options.signal })

  if (!response.ok) {
    throw new Error(`GET /models 실패 (status ${response.status})`)
  }

  const data = await response.json()
  return data.models
}

export async function sendChatMessage(payload) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: payload.message,
      model: payload.model,
      system_prompt: payload.systemPrompt,
      temperature: payload.temperature,
      top_p: payload.topP,
      num_predict: payload.numPredict,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.detail ?? `POST /chat 실패 (status ${response.status})`)
  }

  const data = await response.json()
  return {
    model: data.model,
    message: data.message,
    elapsedTime: data.elapsed_time,
  }
}
