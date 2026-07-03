import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UnansweredList, { mergeByRecency } from './UnansweredList'

vi.mock('../api/slack', () => ({ fetchSlackUnread: vi.fn() }))
vi.mock('../api/teamsChat', () => ({ fetchTeamsUnread: vi.fn() }))
vi.mock('../api/outlookMail', () => ({ fetchUnreadMail: vi.fn() }))

import { fetchSlackUnread } from '../api/slack'
import { fetchTeamsUnread } from '../api/teamsChat'
import { fetchUnreadMail } from '../api/outlookMail'

describe('mergeByRecency', () => {
  it('sorts items from multiple sources newest-first', () => {
    const slack = [{ id: 's1', source: 'slack', timestamp: '2026-07-03T08:00:00.000Z' }]
    const teams = [{ id: 't1', source: 'teams', timestamp: '2026-07-03T10:00:00.000Z' }]
    const mail = [{ id: 'm1', source: 'mail', timestamp: '2026-07-03T09:00:00.000Z' }]

    const merged = mergeByRecency(slack, teams, mail)
    expect(merged.map(i => i.id)).toEqual(['t1', 'm1', 's1'])
  })

  it('sorts items with a null timestamp to the end', () => {
    const items = [
      [{ id: 'no-ts', source: 'slack', timestamp: null }],
      [{ id: 'has-ts', source: 'teams', timestamp: '2026-07-03T10:00:00.000Z' }],
    ]
    const merged = mergeByRecency(...items)
    expect(merged.map(i => i.id)).toEqual(['has-ts', 'no-ts'])
  })

  it('handles all-empty sources', () => {
    expect(mergeByRecency([], [], [])).toEqual([])
  })
})

describe('UnansweredList', () => {
  it('renders merged items from all three sources, sorted newest-first', async () => {
    fetchSlackUnread.mockResolvedValue([
      { id: 's1', source: 'slack', title: 'Slack message', from: 'aisha', timestamp: '2026-07-03T08:00:00.000Z', link: 'x' },
    ])
    fetchTeamsUnread.mockResolvedValue([
      { id: 't1', source: 'teams', title: 'Teams message', from: 'Arjun', timestamp: '2026-07-03T10:00:00.000Z', link: 'x' },
    ])
    fetchUnreadMail.mockResolvedValue([
      { id: 'm1', source: 'mail', title: 'Mail message', from: 'Priya', timestamp: '2026-07-03T09:00:00.000Z', link: 'x' },
    ])

    render(<UnansweredList />)

    await waitFor(() => expect(screen.getByText('Teams message')).toBeInTheDocument())
    const titles = screen.getAllByText(/message$/).map(el => el.textContent)
    expect(titles).toEqual(['Teams message', 'Mail message', 'Slack message'])
  })

  it('shows the empty state when nothing is unread anywhere', async () => {
    fetchSlackUnread.mockResolvedValue([])
    fetchTeamsUnread.mockResolvedValue([])
    fetchUnreadMail.mockResolvedValue([])

    render(<UnansweredList />)
    await waitFor(() => expect(screen.getByText('Nothing unanswered')).toBeInTheDocument())
  })
})
