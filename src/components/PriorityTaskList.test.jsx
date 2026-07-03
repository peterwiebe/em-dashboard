import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PriorityTaskList, {
  buildAssigneeMap,
  resolveJiraBlockingIdentifier,
  normalizeJiraTask,
  normalizeGithubPR,
  normalizeAdminTodo,
} from './PriorityTaskList'

vi.mock('../api/jira', () => ({ fetchMyTasks: vi.fn(), fetchSprintTickets: vi.fn() }))
vi.mock('../api/github', () => ({ fetchReviewRequestedPRs: vi.fn() }))
vi.mock('../api/localState', () => ({ load: vi.fn() }))

import { fetchMyTasks, fetchSprintTickets } from '../api/jira'
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
})
