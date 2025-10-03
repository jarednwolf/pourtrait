# Design System Documentation

## Overview

The Pourtrait design system provides a comprehensive set of components, utilities, and guidelines for building a professional wine application interface. It emphasizes sophistication, accessibility, and mobile-first responsive design while strictly enforcing professional standards.

## Core Principles

### 1. Professional Excellence
- **No Emojis Policy**: Strict prohibition on emoji usage throughout the application
- **Sommelier-Appropriate Language**: All content maintains professional wine industry standards
- **Visual Sophistication**: Clean, elegant design that conveys expertise and trustworthiness

### 2. Mobile-First Design
- Progressive enhancement from mobile to desktop
- Touch-friendly interactions optimized for one-handed use
- Consistent responsive behavior across all components

### 3. Accessibility & Inclusivity
- WCAG 2.1 AA compliance
- Semantic HTML structure
- Sufficient color contrast ratios
- Screen reader compatibility

## Component Architecture

### Design Tokens

#### Color Palette
```typescript
// Wine-inspired professional colors
const colors = {
  wine: {
    50: '#fdf2f8',
    500: '#ec4899',
    900: '#831843',
  },
  burgundy: {
    50: '#fef2f2',
    600: '#dc2626',
    900: '#7f1d1d',
  },
  gold: {
    50: '#fffbeb',
    500: '#f59e0b',
    900: '#78350f',
  }
}
```

#### Typography Scale
```typescript
const typography = {
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}
```

#### Spacing System
- Base unit: 4px
- Scale: 0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Component Variants

Components use `class-variance-authority` for consistent, type-safe styling:

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-burgundy-600 text-white hover:bg-burgundy-700',
        secondary: 'border border-gray-300 bg-white text-gray-700',
        outline: 'border border-burgundy-600 text-burgundy-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)
```

## Icon System

### Heroicons Integration
All icons use Heroicons for visual consistency and professional appearance:

```typescript
import { Icon } from '@/components/ui'

// Usage examples
<Icon name="home" size="md" />
<Icon name="star" size="lg" className="text-gold-500" />
<Icon name="heart-solid" size="sm" />
```

### Available Categories
- **Navigation**: home, user, settings, search, menu
- **Actions**: plus, x, heart, star, camera
- **Status**: info, warning, success, error
- **Wine-specific**: photo, calendar, clock, map-pin

## Layout Components

### Container System
```typescript
<Container size="lg" center>
  <Grid cols={3} gap="md" responsive>
    <Card>Wine 1</Card>
    <Card>Wine 2</Card>
    <Card>Wine 3</Card>
  </Grid>
</Container>
```

### Responsive Grid
```typescript
<Grid 
  cols={4} 
  gap="lg" 
  responsive // Automatically adjusts: 1 col mobile, 2 tablet, 4 desktop
>
  {wines.map(wine => <WineCard key={wine.id} wine={wine} />)}
</Grid>
```

### Flexible Stack
```typescript
<Stack direction="vertical" spacing="md" align="center">
  <Icon name="wine-glass" size="xl" />
  <h2>Wine Collection</h2>
  <p>Manage your personal inventory</p>
</Stack>
```

## Professional Content Guidelines

### Emoji Validation
The design system includes automated emoji detection and prevention:

```typescript
import { designSystem } from '@/lib/design-system'

// Validate content
const isValid = designSystem.validateNoEmojis(content)
if (!isValid) {
  // Handle emoji violation
  const sanitized = designSystem.sanitizeText(content)
}

// Professional tone validation
const toneCheck = designSystem.validateProfessionalTone(content)
if (!toneCheck.isValid) {
  console.warn('Content issues:', toneCheck.issues)
}
```

### Language Standards
- Use sommelier-appropriate terminology
- Avoid casual abbreviations (lol, omg, etc.)
- Maintain professional tone without being overly formal
- Provide educational context for wine newcomers

## Testing Strategy

### Component Testing
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui'

describe('Button', () => {
  it('enforces professional design guidelines', () => {
    render(<Button>Professional Button Text</Button>)
    const button = screen.getByRole('button')
    
    // Validate no emojis
    const buttonText = button.textContent || ''
    expect(designSystem.validateNoEmojis(buttonText)).toBe(true)
    
    // Validate professional styling
    expect(button).toHaveClass('font-medium', 'transition-colors')
  })
})
```

### Visual Regression Testing
- Storybook integration for component documentation
- Automated screenshot comparison
- Cross-browser compatibility testing
- Mobile responsiveness validation

## Performance Optimization

### Bundle Optimization
- Tree-shakeable component exports
- Minimal runtime dependencies
- Efficient CSS-in-JS with Tailwind
- Optimized icon loading

### Mobile Performance
- Touch-friendly interaction targets (44px minimum)
- Optimized animations and transitions
- Efficient re-rendering patterns
- Progressive image loading

## Usage Examples

### Basic Component Usage
```typescript
import { Button, Card, Icon, Badge } from '@/components/ui'
import { Container, Grid } from '@/components/layout'

function WineInventory() {
  return (
    <Container>
      <Grid cols={3} gap="md">
        {wines.map(wine => (
          <Card key={wine.id}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{wine.name}</h3>
              <Badge variant="wine">{wine.type}</Badge>
            </div>
            <p className="text-gray-600">{wine.producer}</p>
            <Button variant="outline" className="mt-4">
              <Icon name="eye" size="sm" className="mr-2" />
              View Details
            </Button>
          </Card>
        ))}
      </Grid>
    </Container>
  )
}
```

### Advanced Layout Patterns
```typescript
import { AppShell, Header, BottomNavigation } from '@/components/layout'

function App() {
  return (
    <AppShell
      header={
        <Header title="Wine Collection">
          <Button variant="ghost" size="icon">
            <Icon name="search" />
          </Button>
        </Header>
      }
      footer={
        <BottomNavigation>
          <Button variant="ghost">
            <Icon name="home" />
          </Button>
          <Button variant="ghost">
            <Icon name="plus" />
          </Button>
          <Button variant="ghost">
            <Icon name="user" />
          </Button>
        </BottomNavigation>
      }
    >
      <WineInventory />
    </AppShell>
  )
}
```

## Development Workflow

### Component Creation Checklist
1. ✅ Define component props with TypeScript
2. ✅ Implement responsive design patterns
3. ✅ Add professional styling variants
4. ✅ Include accessibility attributes
5. ✅ Write comprehensive tests
6. ✅ Create Storybook documentation
7. ✅ Validate emoji-free content
8. ✅ Test mobile interactions

### Quality Assurance
- Automated emoji detection in CI/CD
- Professional tone validation
- Accessibility testing with axe-core
- Visual regression testing
- Performance monitoring

## Resources

- [Storybook Documentation](http://localhost:6006)
- [Heroicons Library](https://heroicons.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Class Variance Authority](https://cva.style/docs)