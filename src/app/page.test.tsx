import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from './page'

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Your AI Sommelier for everyday wine decisions')
  })

  it('displays the tagline', () => {
    render(<Home />)
    
    const tagline = screen.getByText(/Get a fast, personalized pick for tonight/) 
    expect(tagline).toBeInTheDocument()
  })

  it('shows hero actions', () => {
    render(<Home />)
    
    const cta = screen.getByRole('link', { name: /Tonight’s pick/i })
    expect(cta).toBeInTheDocument()
  })
})