import { describe, it, expect } from 'vitest'
import { isChatUnread, mapChatToUnread, fetchTeamsUnread, isConfigured } from './teamsChat'
import { MOCK_TEAMS_UNREAD } from '../data/mockData'

describe('isChatUnread', () => {
  it('is unread when there is no viewpoint (never read)', () => {
    const chat = { lastMessagePreview: { createdDateTime: '2026-07-03T08:00:00.000Z' } }
    expect(isChatUnread(chat)).toBe(true)
  })

  it('is unread when the last message arrived after the last read time', () => {
    const chat = {
      lastMessagePreview: { createdDateTime: '2026-07-03T08:00:00.000Z' },
      viewpoint: { lastMessageReadDateTime: '2026-07-02T12:00:00.000Z' },
    }
    expect(isChatUnread(chat)).toBe(true)
  })

  it('is read when the last message arrived before or at the last read time', () => {
    const chat = {
      lastMessagePreview: { createdDateTime: '2026-07-02T08:00:00.000Z' },
      viewpoint: { lastMessageReadDateTime: '2026-07-03T12:00:00.000Z' },
    }
    expect(isChatUnread(chat)).toBe(false)
  })

  it('is not unread when there is no message at all', () => {
    expect(isChatUnread({})).toBe(false)
  })
})

describe('mapChatToUnread', () => {
  it('strips HTML from the message preview and maps fields', () => {
    const chat = {
      id: '19:abc123',
      webUrl: 'https://teams.microsoft.com/l/chat/19%3Aabc123',
      lastMessagePreview: {
        createdDateTime: '2026-07-03T08:15:00.000Z',
        body: { content: '<p>quick sync before the <b>all-hands</b>?</p>' },
        from: { user: { displayName: 'Arjun Patel' } },
      },
    }
    expect(mapChatToUnread(chat)).toEqual({
      id: '19:abc123',
      source: 'teams',
      title: 'quick sync before the all-hands?',
      from: 'Arjun Patel',
      timestamp: '2026-07-03T08:15:00.000Z',
      link: 'https://teams.microsoft.com/l/chat/19%3Aabc123',
    })
  })

  it('falls back to chat topic when there is no message sender', () => {
    const chat = { id: '19:xyz', topic: 'Sprint planning group', lastMessagePreview: { body: { content: 'hi' } } }
    expect(mapChatToUnread(chat).from).toBe('Sprint planning group')
  })

  it('handles a missing preview gracefully', () => {
    const chat = { id: '19:empty' }
    const result = mapChatToUnread(chat)
    expect(result.title).toBe('(no preview available)')
    expect(result.timestamp).toBe(null)
    expect(result.from).toBe('unknown')
  })
})

describe('fetchTeamsUnread', () => {
  it('falls back to mock data when no token is configured', async () => {
    const result = await fetchTeamsUnread()
    expect(result).toEqual(MOCK_TEAMS_UNREAD)
  })
})

describe('isConfigured', () => {
  it('is false when unconfigured', () => {
    expect(isConfigured()).toBe(false)
  })
})
