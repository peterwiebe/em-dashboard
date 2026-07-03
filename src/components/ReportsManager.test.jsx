import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportsManager from './ReportsManager'

vi.mock('../api/localState', () => ({
  load: vi.fn(),
  save: vi.fn(),
}))

import { load, save } from '../api/localState'

describe('ReportsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the empty state when there are no reports', async () => {
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} })
    render(<ReportsManager />)
    await waitFor(() => expect(screen.getByText('No direct reports added yet')).toBeInTheDocument())
  })

  it('renders existing reports with their github username and jira account id', async () => {
    load.mockResolvedValue({
      reports: [{ id: '1', name: 'Jordan Lee', githubUsername: 'jlee', jiraAccountId: 'acc-jordan' }],
      todos: [],
      priorityOverrides: {},
    })
    render(<ReportsManager />)
    await waitFor(() => expect(screen.getByText('Jordan Lee')).toBeInTheDocument())
    expect(screen.getByText('@jlee')).toBeInTheDocument()
    expect(screen.getByText('acc-jordan')).toBeInTheDocument()
  })

  it('adds a report, persisting it via save() while preserving existing todos/priorityOverrides', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({ reports: [], todos: [{ id: 't1', text: 'x' }], priorityOverrides: { a: 1 } })
    save.mockResolvedValue({})

    render(<ReportsManager />)
    await waitFor(() => expect(screen.getByText('No direct reports added yet')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Name'), 'Priya Sharma')
    await user.type(screen.getByPlaceholderText('GitHub username (optional)'), 'psharma')
    await user.click(screen.getByText('Add'))

    await waitFor(() => expect(screen.getByText('Priya Sharma')).toBeInTheDocument())

    expect(save).toHaveBeenCalledTimes(1)
    const savedState = save.mock.calls[0][0]
    expect(savedState.todos).toEqual([{ id: 't1', text: 'x' }])
    expect(savedState.priorityOverrides).toEqual({ a: 1 })
    expect(savedState.reports).toEqual([
      { id: expect.any(String), name: 'Priya Sharma', githubUsername: 'psharma', jiraAccountId: null },
    ])
  })

  it('rejects an invalid GitHub username without saving', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} })

    render(<ReportsManager />)
    await waitFor(() => expect(screen.getByText('No direct reports added yet')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Name'), 'Bad Username')
    await user.type(screen.getByPlaceholderText('GitHub username (optional)'), 'not a valid username!')
    await user.click(screen.getByText('Add'))

    expect(await screen.findByText(/GitHub username can only contain/)).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })

  it('does not add a report with a blank name', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} })

    render(<ReportsManager />)
    await waitFor(() => expect(screen.getByText('No direct reports added yet')).toBeInTheDocument())

    await user.click(screen.getByText('Add'))
    expect(save).not.toHaveBeenCalled()
  })

  it('removes a report, persisting the updated list', async () => {
    const user = userEvent.setup()
    load
      .mockResolvedValueOnce({ reports: [{ id: '1', name: 'Jordan Lee', githubUsername: null, jiraAccountId: null }], todos: [], priorityOverrides: {} })
      .mockResolvedValueOnce({ reports: [{ id: '1', name: 'Jordan Lee', githubUsername: null, jiraAccountId: null }], todos: [], priorityOverrides: {} })
    save.mockResolvedValue({})

    render(<ReportsManager />)
    await waitFor(() => expect(screen.getByText('Jordan Lee')).toBeInTheDocument())

    await user.click(screen.getByText('×'))

    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ reports: [] })))
  })
})
