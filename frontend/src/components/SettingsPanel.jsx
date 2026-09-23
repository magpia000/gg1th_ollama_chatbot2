function SettingsPanel({
  settings,
  onSettingsChange,
  models,
  modelsLoading,
  modelsError,
  isOpen,
  onClose,
}) {
  const isModelSelectDisabled = modelsLoading || Boolean(modelsError)
  const panelClassName = isOpen ? 'settings-panel settings-panel--open' : 'settings-panel'

  return (
    <aside className={panelClassName}>
      <button
        type="button"
        className="settings-panel__close"
        aria-label="사이드바 닫기"
        onClick={onClose}
      >
        ✕
      </button>

      <label htmlFor="settings-panel-model">모델</label>
      <select
        id="settings-panel-model"
        aria-label="모델"
        value={settings.model}
        disabled={isModelSelectDisabled}
        onChange={(event) => onSettingsChange({ ...settings, model: event.target.value })}
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
      {modelsError && <p className="settings-panel__error">{modelsError}</p>}

      <label htmlFor="settings-panel-system-prompt">시스템 프롬프트</label>
      <textarea
        id="settings-panel-system-prompt"
        aria-label="시스템 프롬프트"
        value={settings.systemPrompt}
        onChange={(event) =>
          onSettingsChange({ ...settings, systemPrompt: event.target.value })
        }
      />

      <label htmlFor="settings-panel-temperature">Temperature: {settings.temperature}</label>
      <input
        id="settings-panel-temperature"
        type="range"
        aria-label="Temperature"
        min="0"
        max="2"
        step="0.1"
        value={settings.temperature}
        onChange={(event) =>
          onSettingsChange({ ...settings, temperature: Number(event.target.value) })
        }
      />

      <label htmlFor="settings-panel-top-p">Top P: {settings.topP}</label>
      <input
        id="settings-panel-top-p"
        type="range"
        aria-label="Top P"
        min="0"
        max="1"
        step="0.05"
        value={settings.topP}
        onChange={(event) =>
          onSettingsChange({ ...settings, topP: Number(event.target.value) })
        }
      />

      <label htmlFor="settings-panel-num-predict">Num Predict</label>
      <input
        id="settings-panel-num-predict"
        type="number"
        aria-label="Num Predict"
        min="1"
        max="2048"
        value={settings.numPredict}
        onChange={(event) => {
          const clamped = Math.min(2048, Math.max(1, Number(event.target.value)))
          onSettingsChange({ ...settings, numPredict: clamped })
        }}
      />
    </aside>
  )
}

export default SettingsPanel
