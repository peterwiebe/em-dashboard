import { describe, it, expect } from 'vitest'
import { fetchWeekMeetings, isConfigured } from './calendar'
import { MOCK_MEETINGS } from '../data/mockData'

describe('fetchWeekMeetings', () => {
  it('falls back to mock data when no token is configured', async () => {
    expect(await fetchWeekMeetings()).toEqual(MOCK_MEETINGS)
  })
})

describe('isConfigured', () => {
  it('is false when no token is set', () => {
    expect(isConfigured()).toBe(false)
  })
})
