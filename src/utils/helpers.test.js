import { describe, it, expect } from 'vitest'
import { fmtHour, stalenessColor, computeFocusTime, isStartingSoon } from './helpers'

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

describe('computeFocusTime', () => {
  it('subtracts back-to-back meetings from the default 9-18 workday', () => {
    const meetings = [
      { dayIdx: 0, startH: 9, durationH: 1 },
      { dayIdx: 0, startH: 10, durationH: 2 },
    ]
    expect(computeFocusTime(meetings, 0)).toBe(6)
  })

  it('does not double-count overlapping meetings', () => {
    const meetings = [
      { dayIdx: 0, startH: 9, durationH: 3 },
      { dayIdx: 0, startH: 10, durationH: 3 },
    ]
    // union of [9,12) and [10,13) is [9,13) = 4 scheduled hours, not 6
    expect(computeFocusTime(meetings, 0)).toBe(5)
  })

  it('clips meetings that start before or end after the workday window', () => {
    const meetings = [{ dayIdx: 0, startH: 7, durationH: 4 }] // 7am-11am, window starts at 9
    expect(computeFocusTime(meetings, 0, 9, 18)).toBe(7) // only 9-11 (2h) counts as scheduled
  })

  it('floors at 0 when meetings exceed the workday window', () => {
    const meetings = [{ dayIdx: 0, startH: 8, durationH: 12 }]
    expect(computeFocusTime(meetings, 0, 9, 18)).toBe(0)
  })

  it('ignores meetings on other days', () => {
    const meetings = [{ dayIdx: 1, startH: 9, durationH: 2 }]
    expect(computeFocusTime(meetings, 0)).toBe(9)
  })

  it('returns the full workday when there are no meetings', () => {
    expect(computeFocusTime([], 0)).toBe(9)
  })
})

describe('isStartingSoon', () => {
  it('returns true for a meeting starting within the threshold', () => {
    const now = new Date('2026-07-03T09:00:00')
    expect(isStartingSoon({ startH: 9.25 }, now, 15)).toBe(true) // 15 min out
    expect(isStartingSoon({ startH: 9.1 }, now, 15)).toBe(true) // 6 min out
  })

  it('returns false for a meeting outside the threshold', () => {
    const now = new Date('2026-07-03T09:00:00')
    expect(isStartingSoon({ startH: 9.26 }, now, 15)).toBe(false) // just over 15 min
  })

  it('returns false for a meeting that has already started', () => {
    const now = new Date('2026-07-03T09:10:00')
    expect(isStartingSoon({ startH: 9 }, now, 15)).toBe(false)
  })

  it('returns true for a meeting starting exactly now', () => {
    const now = new Date('2026-07-03T09:00:00')
    expect(isStartingSoon({ startH: 9 }, now, 15)).toBe(true)
  })
})
