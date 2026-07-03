import { describe, it, expect } from 'vitest'
import { mapConversationToUnread } from './slack'

describe('mapConversationToUnread', () => {
  it('maps a DM conversation with a latest message to the normalized shape', () => {
    const conversation = { id: 'D0123ABCD', user: 'U0AISHA', team_id: 'T00000000' }
    const message = { text: 'hey, are you still working on that PR?', ts: '1751536000.000200' }

    expect(mapConversationToUnread(conversation, message)).toEqual({
      id: 'D0123ABCD',
      source: 'slack',
      title: 'hey, are you still working on that PR?',
      from: 'U0AISHA',
      timestamp: new Date(1751536000000).toISOString(),
      link: 'https://app.slack.com/client/T00000000/D0123ABCD',
    })
  })

  it('falls back to the channel name for a group DM', () => {
    const conversation = { id: 'G0456EFGH', name: 'eng-team', team_id: 'T00000000' }
    const message = { text: 'sprint planning moved to 1pm', ts: '1751532600.000100' }

    const result = mapConversationToUnread(conversation, message)
    expect(result.from).toBe('eng-team')
  })

  it('truncates long message previews to 140 characters', () => {
    const conversation = { id: 'D1', user: 'U1' }
    const longText = 'x'.repeat(200)
    const result = mapConversationToUnread(conversation, { text: longText, ts: '1751532600.000100' })
    expect(result.title.length).toBe(140)
  })

  it('handles a missing latest message gracefully', () => {
    const conversation = { id: 'D2', user: 'U2' }
    const result = mapConversationToUnread(conversation, undefined)
    expect(result.title).toBe('(no preview available)')
    expect(result.timestamp).toBe(null)
  })

  it('falls back to "unknown" when neither user nor name is present', () => {
    const conversation = { id: 'D3' }
    const result = mapConversationToUnread(conversation, undefined)
    expect(result.from).toBe('unknown')
  })
})
