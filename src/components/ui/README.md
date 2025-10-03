# UI Components

Professional UI component library for the Pourtrait wine application.

## Quick Start

```tsx
import { Button, Card, Icon } from '@/components/ui'

function Example() {
  return (
    <Card>
      <Button variant="primary">
        <Icon name="plus" size="sm" />
        Add Wine
      </Button>
    </Card>
  )
}
```

## Available Components

### Core Components
- **Button** - Primary actions with multiple variants
- **Card** - Content containers with flexible layouts
- **Input** - Form inputs with validation states
- **Badge** - Status indicators and labels
- **Alert** - Notifications and messages

### Icon System
- **Icon** - Professional Heroicons integration
- 30+ icons covering navigation, actions, and wine-specific use cases
- Consistent sizing system (xs, sm, md, lg, xl)

## Design Principles

- **No Emojis**: Strict professional design policy
- **Mobile-First**: Responsive design optimized for touch
- **Accessible**: WCAG compliant with semantic HTML
- **Type-Safe**: Full TypeScript integration

## Documentation

- [Storybook Documentation](http://localhost:6006) - Interactive component docs
- [Design System Guide](../../../docs/04-features/design-system.md) - Complete design system documentation

## Testing

All components include comprehensive tests with React Testing Library:

```bash
npm test src/components/ui/
```