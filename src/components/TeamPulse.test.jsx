import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeamPulse from './TeamPulse'
import { TEAM } from '../data/mockData'

describe('TeamPulse', () => {
  it('renders a status entry for every team member', () => {
    render(<TeamPulse />)
    for (const member of TEAM) {
      expect(screen.getByText(member.name.split(' ')[0])).toBeInTheDocument()
    }
  })
})
