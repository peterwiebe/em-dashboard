import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoList from './TodoList'

vi.mock('../api/localState', () => ({
  load: vi.fn(),
  save: vi.fn(),
}))

import { load, save } from '../api/localState'

describe('TodoList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders todos loaded from persisted state', async () => {
    load.mockResolvedValue({
      reports: [],
      todos: [{ id: '1', text: 'Existing task', done: false, priority: 'high', blocksReportId: null }],
      priorityOverrides: {},
    })
    render(<TodoList />)
    await waitFor(() => expect(screen.getByText('Existing task')).toBeInTheDocument())
  })

  it('adds a task, persisting it via save() while preserving existing reports/priorityOverrides', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({ reports: [{ id: 'r1', name: 'Jordan Lee' }], todos: [], priorityOverrides: { a: 1 } })
    save.mockResolvedValue({})

    render(<TodoList />)
    await waitFor(() => expect(load).toHaveBeenCalled())

    await user.type(screen.getByPlaceholderText('Add a task…'), 'New task')
    await user.click(screen.getByText('Add'))

    await waitFor(() => expect(screen.getByText('New task')).toBeInTheDocument())

    const savedState = save.mock.calls[0][0]
    expect(savedState.reports).toEqual([{ id: 'r1', name: 'Jordan Lee' }])
    expect(savedState.priorityOverrides).toEqual({ a: 1 })
    expect(savedState.todos).toEqual([
      { id: expect.any(String), text: 'New task', done: false, priority: 'med', blocksReportId: null },
    ])
  })

  it('does not add a task with blank text', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} })
    render(<TodoList />)
    await waitFor(() => expect(load).toHaveBeenCalled())

    await user.click(screen.getByText('Add'))
    expect(save).not.toHaveBeenCalled()
  })

  it('toggles a task done and persists the change', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({
      reports: [],
      todos: [{ id: '1', text: 'Toggle me', done: false, priority: 'low', blocksReportId: null }],
      priorityOverrides: {},
    })
    save.mockResolvedValue({})

    render(<TodoList />)
    await waitFor(() => expect(screen.getByText('Toggle me')).toBeInTheDocument())

    await user.click(document.querySelector('.todo-check'))

    await waitFor(() => expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ todos: [{ id: '1', text: 'Toggle me', done: true, priority: 'low', blocksReportId: null }] })
    ))
  })

  it('removes a task and persists the updated list', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({
      reports: [],
      todos: [{ id: '1', text: 'Remove me', done: false, priority: 'low', blocksReportId: null }],
      priorityOverrides: {},
    })
    save.mockResolvedValue({})

    render(<TodoList />)
    await waitFor(() => expect(screen.getByText('Remove me')).toBeInTheDocument())

    await user.click(screen.getByText('×'))

    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ todos: [] })))
  })
})
