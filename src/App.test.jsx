import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./api/calendar', () => ({ fetchWeekMeetings: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/jira', () => ({
  fetchMyTasks: vi.fn().mockResolvedValue([]),
  fetchSprintTickets: vi.fn().mockResolvedValue({}),
  fetchIssueChangelog: vi.fn().mockResolvedValue(null),
}))
vi.mock('./api/github', () => ({ fetchReviewRequestedPRs: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/localState', () => ({ load: vi.fn(), save: vi.fn() }))
vi.mock('./api/slack', () => ({ fetchSlackUnread: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/teamsChat', () => ({ fetchTeamsUnread: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/outlookMail', () => ({ fetchUnreadMail: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/confluence', () => ({ fetchRecentDocs: vi.fn().mockResolvedValue([]) }))

import { load, save } from './api/localState'

const ONBOARDED_STATE = { reports: [], todos: [], priorityOverrides: {}, onboardingComplete: true }

describe('App — Overview tab (Engineer Mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    load.mockResolvedValue(ONBOARDED_STATE)
    save.mockResolvedValue({})
  })

  it('renders the Engineer Mode cards instead of the old manager-mode grid', async () => {
    render(<App />)

    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())
    expect(screen.getByText('Priority Tasks')).toBeInTheDocument()
    expect(screen.getByText('Unanswered')).toBeInTheDocument()

    const main = document.querySelector('.main')
    expect(within(main).queryByText('Team Pulse')).not.toBeInTheDocument()
    expect(within(main).queryByText('Stalest PRs')).not.toBeInTheDocument()
    expect(within(main).queryByText('Sprint Board')).not.toBeInTheDocument()
  })

  it('still shows the stat summary strip, including Focus Time Today', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Focus Time Today')).toBeInTheDocument())
  })
})

describe('App — tab navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    load.mockResolvedValue(ONBOARDED_STATE)
    save.mockResolvedValue({})
  })

  it('has a Team tab so TeamPulse (no longer on Overview) remains reachable', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Team' }))
    await waitFor(() => expect(screen.getAllByText('Team Pulse').length).toBeGreaterThan(0))
  })

  it('has a Reports tab so ReportsManager is reachable', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Reports' }))
    await waitFor(() => expect(screen.getByPlaceholderText('Name')).toBeInTheDocument())
  })

  it('Pull Requests tab still shows the full PRList', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Pull Requests' }))
    await waitFor(() => expect(screen.getByText(/All Pull Requests/)).toBeInTheDocument())
  })

  it('Sprint Board tab still shows SprintBoard', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Sprint Board' }))
    await waitFor(() => expect(screen.getAllByText('Sprint Board').length).toBeGreaterThan(0))
  })

  it('My Tasks tab still shows the full editable TodoList', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'My Tasks' }))
    await waitFor(() => expect(screen.getByPlaceholderText('Add a task…')).toBeInTheDocument())
  })
})

describe('App — onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    save.mockResolvedValue({})
  })

  it('shows onboarding on first launch (onboardingComplete: false)', async () => {
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {}, onboardingComplete: false })
    render(<App />)
    await waitFor(() => expect(screen.getByText('Welcome to em.dashboard')).toBeInTheDocument())
  })

  it('does not show onboarding once onboardingComplete is true', async () => {
    load.mockResolvedValue(ONBOARDED_STATE)
    render(<App />)
    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())
    expect(screen.queryByText('Welcome to em.dashboard')).not.toBeInTheDocument()
  })

  it('dismisses onboarding and reveals the dashboard after finishing it', async () => {
    const user = userEvent.setup()
    load.mockResolvedValue({ reports: [], todos: [], priorityOverrides: {}, onboardingComplete: false })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Welcome to em.dashboard')).toBeInTheDocument())

    await user.click(screen.getByText('Skip setup'))

    await waitFor(() => expect(screen.queryByText('Welcome to em.dashboard')).not.toBeInTheDocument())
    expect(screen.getByText("Today's Meetings")).toBeInTheDocument()
  })
})
