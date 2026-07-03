import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MockDataBadge from './MockDataBadge'

describe('MockDataBadge', () => {
  it('renders nothing when there are no unconfigured sources', () => {
    const { container } = render(<MockDataBadge sources={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when sources is undefined', () => {
    const { container } = render(<MockDataBadge />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists a single unconfigured source', () => {
    render(<MockDataBadge sources={['Jira']} />)
    expect(screen.getByText('Mock: Jira')).toBeInTheDocument()
  })

  it('lists multiple unconfigured sources, comma-separated', () => {
    render(<MockDataBadge sources={['Slack', 'Teams', 'Mail']} />)
    expect(screen.getByText('Mock: Slack, Teams, Mail')).toBeInTheDocument()
  })
})
