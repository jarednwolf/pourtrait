# Testing Guidelines

Testing strategies and examples for Pourtrait development.

## Testing Framework

We use **Vitest** with React Testing Library for comprehensive testing.

### Test File Naming
- Place test files next to the code they test
- Use `.test.tsx` or `.test.ts` extension
- Use descriptive test names: `should create user profile when valid data provided`

## Unit Testing

### Component Testing
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import WineCard from './wine-card'

describe('WineCard', () => {
  it('should display wine information correctly', () => {
    const wine = {
      name: 'Château Margaux 2015',
      producer: 'Château Margaux',
      vintage: 2015,
      region: 'Margaux, Bordeaux'
    }
    
    render(<WineCard wine={wine} />)
    
    expect(screen.getByText('Château Margaux 2015')).toBeInTheDocument()
    expect(screen.getByText('Château Margaux')).toBeInTheDocument()
  })
})
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useWineInventory } from './use-wine-inventory'

describe('useWineInventory', () => {
  it('should load wine inventory', async () => {
    const { result } = renderHook(() => useWineInventory('user-id'))
    
    await act(async () => {
      await result.current.loadInventory()
    })
    
    expect(result.current.wines).toHaveLength(0)
    expect(result.current.loading).toBe(false)
  })
})
```

### Utility Function Testing
```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency, calculateDrinkingWindow } from './wine-utils'

describe('Wine Utilities', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(29.99)).toBe('$29.99')
      expect(formatCurrency(100)).toBe('$100.00')
    })
  })
  
  describe('calculateDrinkingWindow', () => {
    it('should calculate drinking window for red wine', () => {
      const wine = { type: 'red', vintage: 2020, region: 'Bordeaux' }
      const window = calculateDrinkingWindow(wine)
      
      expect(window.earliestDate).toBeInstanceOf(Date)
      expect(window.peakStartDate.getTime()).toBeGreaterThan(window.earliestDate.getTime())
    })
  })
})
```

## Integration Testing

### API Route Testing
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import handler from '../api/wines/[id]'

describe('/api/wines/[id]', () => {
  beforeEach(() => {
    // Setup test database or mocks
  })
  
  it('should return wine by id', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'wine-123' }
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.wine.id).toBe('wine-123')
  })
})
```

### Database Testing
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { WineRepository } from './wine-repository'

describe('WineRepository', () => {
  let repository: WineRepository
  let supabase: any
  
  beforeEach(async () => {
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
    repository = new WineRepository(supabase)
  })
  
  afterEach(async () => {
    // Clean up test data
  })
  
  it('should create wine record', async () => {
    const wineData = {
      name: 'Test Wine',
      producer: 'Test Producer',
      vintage: 2020
    }
    
    const wine = await repository.create('user-id', wineData)
    
    expect(wine.id).toBeDefined()
    expect(wine.name).toBe('Test Wine')
  })
})
```

## Mocking Guidelines

### External Services
```typescript
import { vi } from 'vitest'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: {}, error: null }))
    }))
  }))
}))

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{ message: { content: 'Mocked AI response' } }]
        }))
      }
    }
  }))
}))
```

### Next.js Router
```typescript
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}))
```

## Test Commands

### Running Tests
```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test -- --coverage
```

### Test Configuration
Tests are configured in `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Coverage Goals

### Target Coverage
- **Unit Tests**: >80% code coverage
- **Integration Tests**: All API routes and database operations
- **E2E Tests**: Critical user flows

### Coverage Reports
```bash
# Generate coverage report
npm run test -- --coverage

# View coverage in browser
open coverage/index.html
```

## Testing Best Practices

### Test Structure
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code being tested
- **Assert**: Verify the expected outcome

### Test Isolation
- Each test should be independent
- Clean up after each test
- Use fresh mocks for each test

### Descriptive Names
```typescript
// Good
it('should display error message when wine name is empty')

// Bad  
it('should handle error')
```

### Mock Appropriately
- Mock external dependencies
- Don't mock the code you're testing
- Use realistic mock data

## AI Response Testing

### Professional Tone Validation
```typescript
describe('AI Sommelier Responses', () => {
  it('should not contain emojis', async () => {
    const response = await aiSommelier.getRecommendation(userProfile)
    
    // Check for emoji patterns
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu
    expect(response.content).not.toMatch(emojiRegex)
  })
  
  it('should use professional sommelier language', async () => {
    const response = await aiSommelier.getRecommendation(userProfile)
    
    expect(response.content).toMatch(/\b(tannins|acidity|body|finish|terroir)\b/i)
    expect(response.tone).toBe('professional_sommelier')
  })
})
```

## Next Steps

- For deployment testing, see [deployment.md](./deployment.md)
- For architecture testing, see [../03-architecture/README.md](../03-architecture/README.md)