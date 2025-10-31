import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from './page'

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Every bottle a brushstroke')
  })

  it('displays the tagline', () => {
    render(<Home />)
    
    const tagline = screen.getByText(/Build your palate profile/i)
    expect(tagline).toBeInTheDocument()
  })

  it('shows hero actions', () => {
    render(<Home />)
    
    const ctas = screen.getAllByRole('link', { name: /Start your taste profile/i })
    expect(ctas.length).toBeGreaterThan(0)
  })

  it('does not render testimonials or how it works', () => {
    render(<Home />)
    expect(screen.queryByText(/Loved by curious drinkers/i)).toBeNull()
    expect(screen.queryByText(/How it works/i)).toBeNull()
  })
})