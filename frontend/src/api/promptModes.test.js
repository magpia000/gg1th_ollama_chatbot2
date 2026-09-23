import { describe, expect, it } from 'vitest'
import { promptModes } from './promptModes'

describe('promptModes', () => {
  it('각 모드는 label과 prompt를 비어있지 않은 문자열로 가진다', () => {
    Object.values(promptModes).forEach((mode) => {
      expect(typeof mode.label).toBe('string')
      expect(mode.label.length).toBeGreaterThan(0)
      expect(typeof mode.prompt).toBe('string')
      expect(mode.prompt.length).toBeGreaterThan(0)
    })
  })
})
