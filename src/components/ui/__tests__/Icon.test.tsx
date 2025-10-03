import { render, screen } from '@testing-library/react'
import { Icon, getAvailableIcons } from '../Icon'

describe('Icon', () => {
  it('renders icon correctly', () => {
    render(<Icon name="home" />)
    const icon = screen.getByTestId('icon-home')
    expect(icon).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    render(<Icon name="star" size="lg" />)
    const icon = screen.getByTestId('icon-star')
    expect(icon).toHaveClass('h-6', 'w-6')
  })

  it('applies custom className', () => {
    render(<Icon name="heart" className="text-red-500" />)
    const icon = screen.getByTestId('icon-heart')
    expect(icon).toHaveClass('text-red-500')
  })

  it('handles invalid icon names gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // @ts-expect-error - Testing invalid icon name
    render(<Icon name="invalid-icon" />)
    
    expect(consoleSpy).toHaveBeenCalledWith('Icon "invalid-icon" not found in registry')
    consoleSpy.mockRestore()
  })

  it('returns null for invalid icon names', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // @ts-expect-error - Testing invalid icon name
    const { container } = render(<Icon name="invalid-icon" />)
    
    expect(container.firstChild).toBeNull()
    consoleSpy.mockRestore()
  })

  describe('Icon Registry', () => {
    it('provides list of available icons', () => {
      const icons = getAvailableIcons()
      expect(icons).toBeInstanceOf(Array)
      expect(icons.length).toBeGreaterThan(0)
      expect(icons).toContain('home')
      expect(icons).toContain('user')
      expect(icons).toContain('settings')
    })

    it('includes essential navigation icons', () => {
      const icons = getAvailableIcons()
      const essentialIcons = ['home', 'user', 'settings', 'search', 'menu']
      
      essentialIcons.forEach(iconName => {
        expect(icons).toContain(iconName)
      })
    })

    it('includes wine-related icons', () => {
      const icons = getAvailableIcons()
      const wineIcons = ['star', 'heart', 'camera', 'photo', 'calendar', 'clock']
      
      wineIcons.forEach(iconName => {
        expect(icons).toContain(iconName)
      })
    })
  })

  describe('Professional Design Guidelines', () => {
    it('uses only Heroicons (no custom emojis)', () => {
      // Test that all icons in registry are from Heroicons
      const icons = getAvailableIcons()
      
      icons.forEach(iconName => {
        const { container } = render(<Icon name={iconName} />)
        const svgElement = container.querySelector('svg')
        
        expect(svgElement).toBeInTheDocument()
        // Heroicons have specific attributes
        expect(svgElement).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
        // Heroicons use either 24x24 (outline) or 20x20 (solid) viewBox
        const viewBox = svgElement?.getAttribute('viewBox')
        expect(viewBox === '0 0 24 24' || viewBox === '0 0 20 20').toBe(true)
      })
    })

    it('maintains consistent sizing system', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
      const expectedClasses = {
        xs: ['h-3', 'w-3'],
        sm: ['h-4', 'w-4'],
        md: ['h-5', 'w-5'],
        lg: ['h-6', 'w-6'],
        xl: ['h-8', 'w-8'],
      }

      sizes.forEach(size => {
        const { container } = render(<Icon name="home" size={size} />)
        const icon = container.querySelector('svg')
        
        expectedClasses[size].forEach(className => {
          expect(icon).toHaveClass(className)
        })
      })
    })
  })
})