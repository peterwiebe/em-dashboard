import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rankTasks, resolveBlockingTier, BLOCKING_TIER } from './priority'

const REPORTS = [
  { id: '1', name: 'Jordan Lee', githubUsername: 'jlee', jiraAccountId: 'acc-jordan' },
  { id: '2', name: 'Priya Sharma', githubUsername: 'psharma', jiraAccountId: null },
]

const NOW = new Date('2026-07-03T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('resolveBlockingTier', () => {
  it('returns NONE when nothing is blocked', () => {
    expect(resolveBlockingTier(null, REPORTS)).toBe(BLOCKING_TIER.NONE)
  })

  it('matches a report by name, githubUsername, or jiraAccountId', () => {
    expect(resolveBlockingTier('Jordan Lee', REPORTS)).toBe(BLOCKING_TIER.REPORT)
    expect(resolveBlockingTier('jlee', REPORTS)).toBe(BLOCKING_TIER.REPORT)
    expect(resolveBlockingTier('acc-jordan', REPORTS)).toBe(BLOCKING_TIER.REPORT)
  })

  it('falls back to COLLABORATOR when the identifier does not match a report', () => {
    expect(resolveBlockingTier('some-other-person', REPORTS)).toBe(BLOCKING_TIER.COLLABORATOR)
  })

  it('degrades to COLLABORATOR (not a crash) when reports list is empty', () => {
    expect(resolveBlockingTier('anyone', [])).toBe(BLOCKING_TIER.COLLABORATOR)
    expect(resolveBlockingTier(null, [])).toBe(BLOCKING_TIER.NONE)
  })
})

describe('rankTasks', () => {
  it('ranks report-blocking above collaborator-blocking above no-blocking at equal deadlines', () => {
    const tasks = [
      { id: 'none', title: 'No blocking', dueDate: '2026-07-10', blockingIdentifier: null },
      { id: 'collab', title: 'Blocks a collaborator', dueDate: '2026-07-10', blockingIdentifier: 'random-person' },
      { id: 'report', title: 'Blocks a report', dueDate: '2026-07-10', blockingIdentifier: 'jlee' },
    ]

    const ranked = rankTasks(tasks, REPORTS).map(t => t.id)
    expect(ranked).toEqual(['report', 'collab', 'none'])
  })

  it('ranks nearer deadlines above farther ones at equal blocking tier', () => {
    const tasks = [
      { id: 'far', title: 'Due later', dueDate: '2026-08-01', blockingIdentifier: null },
      { id: 'near', title: 'Due soon', dueDate: '2026-07-04', blockingIdentifier: null },
      { id: 'mid', title: 'Due mid', dueDate: '2026-07-15', blockingIdentifier: null },
    ]

    const ranked = rankTasks(tasks, REPORTS).map(t => t.id)
    expect(ranked).toEqual(['near', 'mid', 'far'])
  })

  it('treats missing due dates as lowest priority within a tier, without crashing', () => {
    const tasks = [
      { id: 'no-date-1', title: 'No date A', dueDate: null, blockingIdentifier: null },
      { id: 'has-date', title: 'Has a date', dueDate: '2026-07-05', blockingIdentifier: null },
      { id: 'no-date-2', title: 'No date B', dueDate: null, blockingIdentifier: null },
    ]

    const ranked = rankTasks(tasks, REPORTS)
    expect(ranked[0].id).toBe('has-date')
    expect(ranked.map(t => t.id).sort()).toEqual(['has-date', 'no-date-1', 'no-date-2'])
  })

  it('does not mutate the input array', () => {
    const tasks = [
      { id: 'b', title: 'B', dueDate: '2026-07-20', blockingIdentifier: null },
      { id: 'a', title: 'A', dueDate: '2026-07-04', blockingIdentifier: null },
    ]
    const original = [...tasks]
    rankTasks(tasks, REPORTS)
    expect(tasks).toEqual(original)
  })

  it('handles an empty task list', () => {
    expect(rankTasks([], REPORTS)).toEqual([])
  })
})
