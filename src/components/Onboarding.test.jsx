import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Onboarding from './Onboarding'

vi.mock('../api/localState', () => ({ load: vi.fn(), save: vi.fn() }))

import { load, save } from '../api/localState'

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {}, onboardingComplete: false })
    save.mockResolvedValue({})
  })

  it('starts on the welcome step, listing every integration env var group', () => {
    render(<Onboarding onComplete={() => {}} />)
    expect(screen.getByText('Welcome to em.dashboard')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Jira')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
  })

  it('advances to the reports step, which embeds ReportsManager', async () => {
    const user = userEvent.setup()
    render(<Onboarding onComplete={() => {}} />)

    await user.click(screen.getByText('Next: add your reports'))

    expect(screen.getByText('Add your direct reports')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByPlaceholderText('Name')).toBeInTheDocument())
  })

  it('"Skip setup" on the welcome step marks onboarding complete without visiting the reports step', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Onboarding onComplete={onComplete} />)

    await user.click(screen.getByText('Skip setup'))

    await waitFor(() => expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingComplete: true })
    ))
    expect(onComplete).toHaveBeenCalled()
  })

  it('"Done" on the reports step marks onboarding complete and preserves other state fields', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    load.mockResolvedValue({
      reports: [{ id: 'r1', name: 'Jordan Lee', githubUsername: null, jiraAccountId: null }],
      todos: [{ id: 't1', text: 'x', done: false, priority: 'med', blocksReportId: null }],
      priorityOverrides: { a: 1 },
      onboardingComplete: false,
    })

    render(<Onboarding onComplete={onComplete} />)
    await user.click(screen.getByText('Next: add your reports'))
    await waitFor(() => expect(screen.getByText('Jordan Lee')).toBeInTheDocument())

    await user.click(screen.getByText('Done'))

    await waitFor(() => expect(save).toHaveBeenCalled())
    const savedState = save.mock.calls[0][0]
    expect(savedState.onboardingComplete).toBe(true)
    expect(savedState.todos).toEqual([{ id: 't1', text: 'x', done: false, priority: 'med', blocksReportId: null }])
    expect(savedState.priorityOverrides).toEqual({ a: 1 })
    expect(onComplete).toHaveBeenCalled()
  })
})
