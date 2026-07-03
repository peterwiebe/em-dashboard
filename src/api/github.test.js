import { describe, it, expect } from 'vitest'
import { mapSearchItemToPR, fetchReviewRequestedPRs, isPullRequestsConfigured, isReviewRequestConfigured } from './github'
import { MOCK_REVIEW_REQUESTED_PRS } from '../data/mockData'

describe('mapSearchItemToPR', () => {
  it('maps a fixture search-issue payload to the normalized PR shape', () => {
    const item = {
      id: 555,
      title: 'fix: webhook retry backoff',
      user: { login: 'aisha-okonkwo' },
      repository_url: 'https://api.github.com/repos/tour-digital/gateway',
      created_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),
      draft: false,
    }

    const result = mapSearchItemToPR(item)

    expect(result.id).toBe(555)
    expect(result.title).toBe('fix: webhook retry backoff')
    expect(result.repo).toBe('tour-digital/gateway')
    expect(result.author).toBe('aisha-okonkwo')
    expect(result.ageHours).toBeCloseTo(5, 1)
    expect(result.reviewers).toEqual([])
    expect(result.draft).toBe(false)
  })

  it('falls back to "unknown" author and the raw repository_url string when parsing fails', () => {
    const item = {
      id: 556,
      title: 'chore: something',
      user: null,
      repository_url: 'not-a-repo-url',
      created_at: new Date().toISOString(),
      draft: undefined,
    }

    const result = mapSearchItemToPR(item)

    expect(result.author).toBe('unknown')
    expect(result.repo).toBe('not-a-repo-url')
    expect(result.draft).toBe(false)
  })
})

describe('fetchReviewRequestedPRs', () => {
  it('falls back to mock data when no token/username is configured', async () => {
    const result = await fetchReviewRequestedPRs()
    expect(result).toEqual(MOCK_REVIEW_REQUESTED_PRS)
  })
})

describe('isPullRequestsConfigured / isReviewRequestConfigured', () => {
  it('are both false when unconfigured', () => {
    expect(isPullRequestsConfigured()).toBe(false)
    expect(isReviewRequestConfigured()).toBe(false)
  })
})
