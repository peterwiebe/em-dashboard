import { describe, it, expect } from 'vitest'
import { extractBlockedKeys, mapIssueToMyTask, findLastInProgressTransition, fetchMyTasks, fetchSprintTickets, fetchIssueChangelog } from './jira'
import { MOCK_MY_TASKS, MOCK_JIRA } from '../data/mockData'

describe('extractBlockedKeys', () => {
  it('extracts only outward "Blocks" links, ignoring inward links and other link types', () => {
    const issuelinks = [
      { type: { name: 'Blocks' }, outwardIssue: { key: 'DIG-437' } },
      { type: { name: 'Blocks' }, inwardIssue: { key: 'DIG-999' } },
      { type: { name: 'Relates' }, outwardIssue: { key: 'DIG-500' } },
    ]
    expect(extractBlockedKeys(issuelinks)).toEqual(['DIG-437'])
  })

  it('returns an empty array when there are no issuelinks', () => {
    expect(extractBlockedKeys(undefined)).toEqual([])
    expect(extractBlockedKeys([])).toEqual([])
  })
})

describe('mapIssueToMyTask', () => {
  it('maps a fixture Jira issue to the normalized task shape', () => {
    const issue = {
      key: 'DIG-440',
      fields: {
        summary: 'Real-time scoring pipeline v2',
        status: { name: 'In Progress' },
        duedate: '2026-07-05',
        issuelinks: [{ type: { name: 'Blocks' }, outwardIssue: { key: 'DIG-437' } }],
      },
    }
    expect(mapIssueToMyTask(issue)).toEqual({
      id: 'DIG-440',
      title: 'Real-time scoring pipeline v2',
      status: 'in-progress',
      dueDate: '2026-07-05',
      blocks: ['DIG-437'],
    })
  })

  it('defaults unknown status to backlog and handles missing duedate/issuelinks', () => {
    const issue = { key: 'DIG-451', fields: { summary: 'x', status: { name: 'Weird Status' } } }
    expect(mapIssueToMyTask(issue)).toEqual({
      id: 'DIG-451',
      title: 'x',
      status: 'backlog',
      dueDate: null,
      blocks: [],
    })
  })
})

describe('findLastInProgressTransition', () => {
  it('returns the timestamp of the only "In Progress" transition', () => {
    const values = [
      { created: '2026-06-30T10:00:00.000+0000', items: [{ field: 'status', toString: 'In Progress' }] },
    ]
    expect(findLastInProgressTransition(values)).toBe(new Date('2026-06-30T10:00:00.000+0000').toISOString())
  })

  it('returns the most recent transition when a ticket cycled through "In Progress" more than once', () => {
    const values = [
      { created: '2026-06-28T09:00:00.000+0000', items: [{ field: 'status', toString: 'In Progress' }] },
      { created: '2026-06-29T09:00:00.000+0000', items: [{ field: 'status', toString: 'To Do' }] },
      { created: '2026-06-30T14:30:00.000+0000', items: [{ field: 'status', toString: 'In Progress' }] },
    ]
    expect(findLastInProgressTransition(values)).toBe(new Date('2026-06-30T14:30:00.000+0000').toISOString())
  })

  it('ignores non-status field changes', () => {
    const values = [
      { created: '2026-06-30T10:00:00.000+0000', items: [{ field: 'assignee', toString: 'Mia Chen' }] },
    ]
    expect(findLastInProgressTransition(values)).toBe(null)
  })

  it('returns null when there is no "In Progress" transition', () => {
    const values = [
      { created: '2026-06-30T10:00:00.000+0000', items: [{ field: 'status', toString: 'Done' }] },
    ]
    expect(findLastInProgressTransition(values)).toBe(null)
  })

  it('returns null for an empty changelog', () => {
    expect(findLastInProgressTransition([])).toBe(null)
    expect(findLastInProgressTransition(undefined)).toBe(null)
  })
})

describe('mock fallback when unconfigured', () => {
  it('fetchMyTasks falls back to mock data', async () => {
    expect(await fetchMyTasks()).toEqual(MOCK_MY_TASKS)
  })

  it('fetchSprintTickets falls back to mock data', async () => {
    expect(await fetchSprintTickets()).toEqual(MOCK_JIRA)
  })

  it('fetchIssueChangelog returns null rather than fake data', async () => {
    expect(await fetchIssueChangelog('DIG-440')).toBe(null)
  })
})
