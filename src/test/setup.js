import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Without `test.globals: true` in vite.config.js, @testing-library/react's
// automatic afterEach cleanup can't find a global afterEach to hook into,
// so rendered DOM leaks across tests within a file unless done explicitly.
// (Also applied in A-3's branch — will be a no-op merge once both land.)
afterEach(() => {
  cleanup()
})
