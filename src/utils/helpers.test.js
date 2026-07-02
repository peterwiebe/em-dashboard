import { describe, it, expect } from 'vitest'
import { fmtHour, stalenessColor } from './helpers'

describe('fmtHour', () => {
  it('formats whole hours in 12-hour am/pm form', () => {
    expect(fmtHour(9)).toBe('9am')
    expect(fmtHour(13)).toBe('1pm')
    expect(fmtHour(0)).toBe('12am')
    expect(fmtHour(12)).toBe('12pm')
  })

  it('formats fractional hours with minutes', () => {
    expect(fmtHour(9.5)).toBe('9:30am')
    expect(fmtHour(14.25)).toBe('2:15pm')
  })
})

describe('stalenessColor', () => {
  it('buckets ages into the correct staleness tier', () => {
    expect(stalenessColor(12).cls).toBe('stale-fresh')
    expect(stalenessColor(48).cls).toBe('stale-warm')
    expect(stalenessColor(100).cls).toBe('stale-hot')
    expect(stalenessColor(200).cls).toBe('stale-fire')
  })

  it('labels sub-day ages in hours and multi-day ages in days', () => {
    expect(stalenessColor(12).label).toBe('12h')
    expect(stalenessColor(48).label).toBe('2d')
  })
})
