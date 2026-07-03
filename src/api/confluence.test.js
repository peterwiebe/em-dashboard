import { describe, it, expect } from 'vitest'
import { fetchRecentDocs, isConfigured } from './confluence'
import { MOCK_CONFLUENCE } from '../data/mockData'

describe('fetchRecentDocs', () => {
  it('falls back to mock data when no token is configured', async () => {
    expect(await fetchRecentDocs()).toEqual(MOCK_CONFLUENCE)
  })
})

describe('isConfigured', () => {
  it('is false when unconfigured', () => {
    expect(isConfigured()).toBe(false)
  })
})
