import { describe, it, expect } from 'vitest'
import { mapMessageToUnread, fetchUnreadMail, isConfigured } from './outlookMail'
import { MOCK_UNREAD_MAIL } from '../data/mockData'

describe('mapMessageToUnread', () => {
  it('maps a fixture message to the normalized shape', () => {
    const message = {
      id: 'AAMkAGI1AAA=',
      subject: 'RE: Partner API rate limit thresholds — need your approval',
      from: { emailAddress: { name: 'Aisha Okonkwo', address: 'aisha@tour-digital.com' } },
      receivedDateTime: '2026-07-03T07:50:00Z',
      webLink: 'https://outlook.office.com/mail/inbox/id/AAMkAGI1AAA%3D',
    }
    expect(mapMessageToUnread(message)).toEqual({
      id: 'AAMkAGI1AAA=',
      source: 'mail',
      title: 'RE: Partner API rate limit thresholds — need your approval',
      from: 'Aisha Okonkwo',
      timestamp: '2026-07-03T07:50:00Z',
      link: 'https://outlook.office.com/mail/inbox/id/AAMkAGI1AAA%3D',
    })
  })

  it('falls back to the email address when there is no display name', () => {
    const message = { id: '1', from: { emailAddress: { address: 'someone@example.com' } } }
    expect(mapMessageToUnread(message).from).toBe('someone@example.com')
  })

  it('falls back to "unknown" when there is no sender at all', () => {
    const message = { id: '2' }
    expect(mapMessageToUnread(message).from).toBe('unknown')
  })

  it('falls back to "(no subject)" for a blank subject', () => {
    const message = { id: '3', subject: '', from: { emailAddress: { name: 'x' } } }
    expect(mapMessageToUnread(message).title).toBe('(no subject)')
  })

  it('handles missing receivedDateTime/webLink gracefully', () => {
    const message = { id: '4' }
    const result = mapMessageToUnread(message)
    expect(result.timestamp).toBe(null)
    expect(result.link).toBe(null)
  })
})

describe('fetchUnreadMail', () => {
  it('falls back to mock data when no token is configured', async () => {
    const result = await fetchUnreadMail()
    expect(result).toEqual(MOCK_UNREAD_MAIL)
  })
})

describe('isConfigured', () => {
  it('is false when unconfigured', () => {
    expect(isConfigured()).toBe(false)
  })
})
