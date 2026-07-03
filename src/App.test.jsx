import { describe, it, expect, vi } from 'vitest'
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
vi.mock('./api/localState', () => ({
  load: vi.fn().mockResolvedValue({ reports: [], todos: [], priorityOverrides: {} }),
  save: vi.fn().mockResolvedValue({}),
}))
vi.mock('./api/slack', () => ({ fetchSlackUnread: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/teamsChat', () => ({ fetchTeamsUnread: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/outlookMail', () => ({ fetchUnreadMail: vi.fn().mockResolvedValue([]) }))
vi.mock('./api/confluence', () => ({ fetchRecentDocs: vi.fn().mockResolvedValue([]) }))

describe('App — Overview tab (Engineer Mode)', () => {
  it('renders the Engineer Mode cards instead of the old manager-mode grid', async () => {
    render(<App />)

    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())
    expect(screen.getByText('Priority Tasks')).toBeInTheDocument()
    expect(screen.getByText('Unanswered')).toBeInTheDocument()

    // The old Overview grid (Team Pulse card, a 4-item PRList slice, a
    // duplicate "My Tasks" card, and the Sprint Board card) should no
    // longer render directly on Overview — those live on their own tabs now.
    // Scoped to <main> since "Sprint Board" also appears as a nav tab label.
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
  it('has a Team tab so TeamPulse (no longer on Overview) remains reachable', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByText("Today's Meetings")).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Team' }))
    await waitFor(() => expect(screen.getAllByText('Team Pulse').length).toBeGreaterThan(0))
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
