# Development Guidelines

Coding standards and best practices for Pourtrait development.

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type - use proper typing
- Use type guards for runtime type checking

### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization when needed
- Follow the single responsibility principle

### Styling
- Use Tailwind CSS for all styling
- Follow mobile-first responsive design
- Use the defined color palette (burgundy, wine, gold)
- **NO EMOJIS** - use professional icons only

### File Naming
- Use kebab-case for file names: `wine-card.tsx`
- Use PascalCase for component names: `WineCard`
- Use camelCase for functions and variables: `getUserProfile`

## Project Structure Guidelines

### Components
- Place reusable UI components in `src/components/ui/`
- Place layout components in `src/components/layout/`
- Create feature-specific components in `src/components/[feature]/`

### API Routes
- Use Next.js API routes in `src/app/api/`
- Implement proper error handling and validation
- Use Zod for request/response validation

### Database
- Use Supabase for all data operations
- Implement Row Level Security (RLS) policies
- Use TypeScript types generated from Supabase schema

## Git Workflow

### Branch Naming
- Feature branches: `feature/wine-inventory-management`
- Bug fixes: `fix/authentication-redirect-issue`
- Hotfixes: `hotfix/critical-security-patch`

### Commit Messages
Use conventional commits format:
- `feat: add wine label recognition`
- `fix: resolve authentication redirect loop`
- `docs: update API documentation`
- `test: add unit tests for taste profile`

### Pull Requests
- Create detailed PR descriptions
- Include screenshots for UI changes
- Ensure all tests pass
- Request code review from team members

## Performance Guidelines

### Next.js Optimization
- Use Next.js Image component for all images
- Implement proper loading states
- Use dynamic imports for code splitting
- Optimize bundle size with tree shaking

### Database Optimization
- Use proper indexing for frequently queried fields
- Implement pagination for large datasets
- Use Supabase real-time features judiciously
- Cache frequently accessed data

### AI Service Optimization
- Implement request caching for AI responses
- Use streaming responses for long AI operations
- Implement proper rate limiting
- Handle AI service failures gracefully

## Security Guidelines

### Authentication
- Use Supabase Auth for all authentication
- Implement proper session management
- Use Row Level Security (RLS) for data access
- Validate all user inputs

### API Security
- Validate all API inputs with Zod
- Implement proper error handling without exposing sensitive data
- Use environment variables for all secrets
- Implement rate limiting for API endpoints

### Data Privacy
- Follow GDPR compliance guidelines
- Implement proper data deletion
- Use secure image upload and storage
- Encrypt sensitive data at rest

## Next Steps

- For testing guidelines, see [testing.md](./testing.md)
- For deployment procedures, see [deployment.md](./deployment.md)