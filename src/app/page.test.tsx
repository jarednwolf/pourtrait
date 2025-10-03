import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from './page'

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Welcome to Pourtrait')
  })

  it('displays the tagline', () => {
    render(<Home />)
    
    const tagline = screen.getByText('Your AI-powered personal wine sommelier')
    expect(tagline).toBeInTheDocument()
  })

  it('shows initialization success message', () => {
    render(<Home />)
    
    const successMessage = screen.getByText('Project foundation successfully initialized!')
    expect(successMessage).toBeInTheDocument()
  })
})