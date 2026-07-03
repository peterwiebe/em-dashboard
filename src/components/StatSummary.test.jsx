import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import StatSummary from './StatSummary'
import { TODAY_DAY_IDX } from '../data/mockData'

vi.mock('../api/calendar', () => ({
  fetchWeekMeetings: vi.fn(),
}))

import { fetchWeekMeetings } from '../api/calendar'

const PRS = [
  { id: 1, ageHours: 100, reviewers: ['approved'], draft: false },
  { id: 2, ageHours: 10, reviewers: [], draft: false },
]

describe('StatSummary', () => {
  it('renders a Focus Time Today cell computed from fetched meetings', async () => {
    fetchWeekMeetings.mockResolvedValue([
      { dayIdx: TODAY_DAY_IDX, startH: 9, durationH: 2 },
    ])

    render(<StatSummary prs={PRS} />)

    await waitFor(() => expect(screen.getByText('7.0h')).toBeInTheDocument())
    expect(screen.getByText('Focus Time Today')).toBeInTheDocument()
  })

  it('shows the full workday as focus time when there are no meetings today', async () => {
    fetchWeekMeetings.mockResolvedValue([])
    render(<StatSummary prs={PRS} />)
    await waitFor(() => expect(screen.getByText('9.0h')).toBeInTheDocument())
  })
})
