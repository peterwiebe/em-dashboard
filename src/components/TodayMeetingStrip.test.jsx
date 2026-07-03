import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import TodayMeetingStrip from './TodayMeetingStrip'
import { TODAY_DAY_IDX } from '../data/mockData'

vi.mock('../api/calendar', () => ({
  fetchWeekMeetings: vi.fn(),
}))

import { fetchWeekMeetings } from '../api/calendar'

describe('TodayMeetingStrip', () => {
  it('flags a meeting starting soon but not one starting hours from now', async () => {
    const now = new Date()
    const nowH = now.getHours() + now.getMinutes() / 60

    fetchWeekMeetings.mockResolvedValue([
      { id: 1, title: 'Soon Meeting', type: 'standup', dayIdx: TODAY_DAY_IDX, startH: nowH + 0.1, durationH: 0.5, location: '' },
      { id: 2, title: 'Later Meeting', type: 'planning', dayIdx: TODAY_DAY_IDX, startH: nowH + 5, durationH: 0.5, location: '' },
    ])

    render(<TodayMeetingStrip />)

    await waitFor(() => expect(screen.getByText('Soon Meeting')).toBeInTheDocument())
    expect(screen.getByText('Later Meeting')).toBeInTheDocument()
    expect(screen.getAllByText('Starting soon')).toHaveLength(1)
  })

  it('shows the empty state when there are no meetings today', async () => {
    fetchWeekMeetings.mockResolvedValue([])
    render(<TodayMeetingStrip />)
    await waitFor(() => expect(screen.getByText('No meetings today')).toBeInTheDocument())
  })
})
