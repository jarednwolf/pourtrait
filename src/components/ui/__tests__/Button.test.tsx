import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'
import { Icon } from '../Icon'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary') // Primary variant default
  })

  it('applies variant classes correctly', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white')
  })

  it('applies size classes correctly', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-12', 'px-6')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button')
    
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('renders with icon correctly', () => {
    render(
      <Button>
        <Icon name="plus" size="sm" />
        Add Wine
      </Button>
    )
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Add Wine')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Button ref={ref}>Button</Button>)
    expect(ref).toHaveBeenCalled()
  })

  describe('Professional Design Guidelines', () => {
    it('does not contain emojis in button text', () => {
      render(<Button>Professional Button Text</Button>)
      const button = screen.getByRole('button')
      const buttonText = button.textContent || ''
      
      // Test for common emoji patterns
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
      expect(emojiRegex.test(buttonText)).toBe(false)
    })

    it('maintains professional styling classes', () => {
      render(<Button>Professional Button</Button>)
      const button = screen.getByRole('button')
      
      // Should have professional styling
      expect(button).toHaveClass('font-medium')
      expect(button).toHaveClass('transition-colors')
      expect(button).toHaveClass('focus-visible:outline-none')
    })
  })
})