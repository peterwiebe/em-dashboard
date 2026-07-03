import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PriorityTaskList, {
  buildAssigneeMap,
  resolveJiraBlockingIdentifier,
  normalizeJiraTask,
  normalizeGithubPR,
  normalizeAdminTodo,
} from './PriorityTaskList'

vi.mock('../api/jira', () => ({ fetchMyTasks: vi.fn(), fetchSprintTickets: vi.fn(), fetchIssueChangelog: vi.fn() }))
vi.mock('../api/github', () => ({ fetchReviewRequestedPRs: vi.fn() }))
vi.mock('../api/localState', () => ({ load: vi.fn() }))

import { fetchMyTasks, fetchSprintTickets, fetchIssueChangelog } from '../api/jira'
import { fetchReviewRequestedPRs } from '../api/github'
import { load } from '../api/localState'

const REPORTS = [{ id: 'r1', name: 'Mia Chen', githubUsername: 'mia-chen', jiraAccountId: null }]

describe('buildAssigneeMap', () => {
  it('flattens a sprint board into a ticket-key -> assignee map', () => {
    const board = {
      backlog: [{ id: 'DIG-1', assignee: 'Unassigned' }],
      'in-progress': [{ id: 'DIG-2', assignee: 'Mia Chen' }],
    }
    expect(buildAssigneeMap(board)).toEqual({ 'DIG-1': 'Unassigned', 'DIG-2': 'Mia Chen' })
  })
})

describe('resolveJiraBlockingIdentifier', () => {
  const assigneeMap = { 'DIG-2': 'Mia Chen', 'DIG-3': 'Carlos Rivera' }

  it('prefers a report assignee over a non-report assignee among multiple blocked tickets', () => {
    expect(resolveJiraBlockingIdentifier(['DIG-3', 'DIG-2'], assigneeMap, REPORTS)).toBe('Mia Chen')
  })

  it('falls back to the first assignee when none are reports', () => {
    expect(resolveJiraBlockingIdentifier(['DIG-3'], assigneeMap, REPORTS)).toBe('Carlos Rivera')
  })

  it('returns null for no blocked tickets', () => {
    expect(resolveJiraBlockingIdentifier([], assigneeMap, REPORTS)).toBe(null)
    expect(resolveJiraBlockingIdentifier(undefined, assigneeMap, REPORTS)).toBe(null)
  })
})

describe('normalizeJiraTask', () => {
  it('maps to the rankTasks contract shape', () => {
    const task = { id: 'DIG-450', title: 'Fix regression', dueDate: '2026-07-05', blocks: ['DIG-2'] }
    expect(normalizeJiraTask(task, { 'DIG-2': 'Mia Chen' }, REPORTS)).toEqual({
      id: 'jira:DIG-450', source: 'jira', title: 'Fix regression', dueDate: '2026-07-05',
      blockingIdentifier: 'Mia Chen', ref: 'DIG-450',
    })
  })
})

describe('normalizeGithubPR', () => {
  it('maps the PR author as the blocking identifier', () => {
    const pr = { id: 101, title: 'fix: cache bug', repo: 'tour-digital/core-api', author: 'mia-chen' }
    expect(normalizeGithubPR(pr)).toEqual({
      id: 'github:101', source: 'github', title: 'fix: cache bug', dueDate: null,
      blockingIdentifier: 'mia-chen', ref: 'tour-digital/core-api',
    })
  })
})

describe('normalizeAdminTodo', () => {
  it('resolves blocksReportId to the matching report name', () => {
    const todo = { id: 't1', text: 'Prep planning agenda', priority: 'high', blocksReportId: 'r1' }
    expect(normalizeAdminTodo(todo, REPORTS)).toEqual({
      id: 'admin:t1', source: 'admin', title: 'Prep planning agenda', dueDate: null,
      blockingIdentifier: 'Mia Chen', ref: 'high',
    })
  })

  it('leaves blockingIdentifier null when blocksReportId does not match a report', () => {
    const todo = { id: 't2', text: 'Solo task', priority: 'low', blocksReportId: null }
    expect(normalizeAdminTodo(todo, REPORTS).blockingIdentifier).toBe(null)
  })
})

describe('PriorityTaskList', () => {
  beforeEach(() => {
    fetchIssueChangelog.mockReset().mockResolvedValue(null)
  })

  it('ranks a combined list of Jira/GitHub/admin items by blocking tier then deadline', async () => {
    fetchMyTasks.mockResolvedValue([
      { id: 'DIG-1', title: 'No blocking, far deadline', dueDate: '2026-08-01', blocks: [] },
    ])
    fetchSprintTickets.mockResolvedValue({ 'in-progress': [{ id: 'DIG-2', assignee: 'Mia Chen' }] })
    fetchReviewRequestedPRs.mockResolvedValue([
      { id: 201, title: 'Review requested by a report', repo: 'x', author: 'mia-chen' },
    ])
    load.mockResolvedValue({
      reports: REPORTS,
      todos: [
        { id: 't1', text: 'Done task should not appear', done: true, priority: 'high', blocksReportId: 'r1' },
        { id: 't2', text: 'Open admin task, no blocking', done: false, priority: 'low', blocksReportId: null },
      ],
      priorityOverrides: {},
    })

    render(<PriorityTaskList />)

    await waitFor(() => expect(screen.getByText('Review requested by a report')).toBeInTheDocument())
    expect(screen.queryByText('Done task should not appear')).not.toBeInTheDocument()

    const titles = screen.getAllByText(/./, { selector: '.todo-text' }).map(el => el.textContent)
    // The GitHub PR blocks a report (mia-chen) and has no deadline, but
    // still outranks the Jira task with "no blocking, far deadline" per
    // rankTasks' tier-first ordering.
    expect(titles[0]).toBe('Review requested by a report')
  })

  it('shows the empty state when there is nothing to rank', async () => {
    fetchMyTasks.mockResolvedValue([])
    fetchSprintTickets.mockResolvedValue({})
    fetchReviewRequestedPRs.mockResolvedValue([])
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} })

    render(<PriorityTaskList />)
    await waitFor(() => expect(screen.getByText('Nothing on your plate right now')).toBeInTheDocument())
  })

  it('shows elapsed time on a top-ranked Jira task when the changelog fetch succeeds', async () => {
    fetchMyTasks.mockResolvedValue([
      { id: 'DIG-1', title: 'In-progress Jira task', dueDate: '2026-07-05', blocks: [] },
    ])
    fetchSprintTickets.mockResolvedValue({})
    fetchReviewRequestedPRs.mockResolvedValue([])
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} })
    fetchIssueChangelog.mockResolvedValue(new Date(Date.now() - 90 * 60_000).toISOString()) // 1h30m ago

    render(<PriorityTaskList />)

    await waitFor(() => expect(screen.getByText(/1h 30m/)).toBeInTheDocument())
    expect(fetchIssueChangelog).toHaveBeenCalledWith('DIG-1')
  })

  it('does not fetch changelog for GitHub/admin rows, and shows nothing (not an error) when the fetch fails', async () => {
    fetchMyTasks.mockResolvedValue([
      { id: 'DIG-1', title: 'Failing changelog task', dueDate: '2026-07-05', blocks: [] },
    ])
    fetchSprintTickets.mockResolvedValue({})
    fetchReviewRequestedPRs.mockResolvedValue([
      { id: 1, title: 'A PR', repo: 'x', author: 'someone' },
    ])
    load.mockResolvedValue({
      reports: [],
      todos: [{ id: 't1', text: 'An admin task', done: false, priority: 'low', blocksReportId: null }],
      priorityOverrides: {},
    })
    fetchIssueChangelog.mockRejectedValue(new Error('Jira API error: 500'))

    render(<PriorityTaskList />)

    await waitFor(() => expect(screen.getByText('Failing changelog task')).toBeInTheDocument())
    expect(screen.getByText('A PR')).toBeInTheDocument()
    expect(screen.getByText('An admin task')).toBeInTheDocument()
    // Only the Jira row should have ever triggered a changelog fetch.
    expect(fetchIssueChangelog).toHaveBeenCalledTimes(1)
    expect(fetchIssueChangelog).toHaveBeenCalledWith('DIG-1')
    // A failed fetch renders no elapsed-time text at all (⏱ prefix absent).
    expect(screen.queryByTitle('Time in progress')).not.toBeInTheDocument()
  })

  it('only fetches changelog for the top 3 ranked rows, even with more Jira tasks than that', async () => {
    fetchMyTasks.mockResolvedValue([
      { id: 'DIG-1', title: 'Task 1', dueDate: '2026-07-01', blocks: [] },
      { id: 'DIG-2', title: 'Task 2', dueDate: '2026-07-02', blocks: [] },
      { id: 'DIG-3', title: 'Task 3', dueDate: '2026-07-03', blocks: [] },
      { id: 'DIG-4', title: 'Task 4', dueDate: '2026-07-04', blocks: [] },
    ])
    fetchSprintTickets.mockResolvedValue({})
    fetchReviewRequestedPRs.mockResolvedValue([])
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} })

    render(<PriorityTaskList />)

    await waitFor(() => expect(screen.getByText('Task 4')).toBeInTheDocument())
    expect(fetchIssueChangelog).toHaveBeenCalledTimes(3)
    expect(fetchIssueChangelog).not.toHaveBeenCalledWith('DIG-4')
  })
})
