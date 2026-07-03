import { describe, it, expect, beforeEach, vi } from 'vitest'
import { load, save } from './localState'

describe('localState', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('load() GETs /api/state and returns the parsed JSON', async () => {
    const state = { reports: [], todos: [], priorityOverrides: {} }
    fetch.mockResolvedValueOnce({ ok: true, json: async () => state })

    const result = await load()

    expect(fetch).toHaveBeenCalledWith('/api/state')
    expect(result).toEqual(state)
  })

  it('load() throws when the response is not ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(load()).rejects.toThrow('Local state API error: 500')
  })

  it('save() PUTs the state as JSON and returns the parsed response', async () => {
    const state = { reports: [{ id: '1', name: 'Jordan Lee' }], todos: [], priorityOverrides: {} }
    fetch.mockResolvedValueOnce({ ok: true, json: async () => state })

    const result = await save(state)

    expect(fetch).toHaveBeenCalledWith('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    expect(result).toEqual(state)
  })

  it('save() throws when the response is not ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 400 })
    await expect(save({})).rejects.toThrow('Local state API error: 400')
  })
})
