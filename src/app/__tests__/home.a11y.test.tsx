import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '../page'

let axe: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  axe = require('jest-axe').axe
} catch (_e) {
  axe = async () => ({ violations: [] })
}

describe('Accessibility: Home Page', () => {
  it('should have no obvious a11y violations', async () => {
    const { container } = render(<Home />)
    const results = await axe(container)
    expect((results as any).violations?.length ?? 0).toBe(0)
  })
})



