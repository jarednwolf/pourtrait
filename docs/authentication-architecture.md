# Authentication Architecture

This document outlines the authentication system architecture for Pourtrait, including security considerations, implementation details, and usage patterns.

## Overview

The authentication system is built on top of Supabase Auth, providing secure user authentication with email/password and OAuth providers. The system includes comprehensive user profile management, Row Level Security (RLS) policies, and protected routing.

## Architecture Components

### 1. Authentication Service (`src/lib/auth.ts`)

The `AuthService` class provides a centralized interface for all authentication operations:

- **User Registration**: Email/password signup with profile creation
- **User Authentication**: Email/password and OAuth sign-in
- **Session Management**: Token refresh and session validation
- **Password Management**: Reset and update functionality
- **Profile Management**: User profile CRUD operations
- **Account Management**: Account deletion with data cleanup

#### Key Features

- Type-safe interfaces for all authentication data
- Comprehensive error handling with user-friendly messages
- Automatic profile creation for new users
- Support for OAuth providers (Google, GitHub, Apple)
- Email verification and password reset flows

### 2. Authentication Hooks (`src/hooks/useAuth.ts`)

React hooks provide reactive authentication state management:

- `useAuth()`: Context-backed authentication state and actions (single source of truth)
- `useIsAuthenticated()`: Simple authentication status check
- `useUserProfile()`: User profile data access
- `useAuthLoading()`: Loading state management

#### State Management

The authentication state includes:
- User object with profile data
- Session information
- Loading and initialization states
- Real-time updates via Supabase auth state changes

### 3. Authentication Context (`src/components/providers/AuthProvider.tsx`)

The `AuthProvider` provides global auth state and consumes exactly one Supabase auth subscription internally. The root layout fetches the initial session server-side using `@supabase/ssr` and injects it into the provider for no-flicker hydration.

- Wraps the app root to provide global auth state
- Single subscription and debounced updates
- Receives `initialSession`/`initialUser` from server layout
- Provides HOC and primitives for route protection
- Manages loading and timeout fallback

### 4. Protected Routes & Middleware

Centralized gating happens in Next.js `middleware.ts` using `@supabase/ssr` cookies to prevent UI spinner loops. Client-side `ProtectedRoute` provides a11y-friendly loading and a safety timeout fallback.

- `middleware.ts`: Redirects unauthenticated users to `/auth/signin`; redirects onboarding-incomplete users to `/onboarding/step1` (matchers configured)
- `ProtectedRoute`: Client fallback UI and loading states
- `PublicOnlyRoute`: Redirects authenticated users away from public pages

### 5. Authentication Forms

Pre-built form components for common authentication flows:

- `SignInForm`: Email/password and OAuth sign-in
- `SignUpForm`: User registration with profile setup
- `ForgotPasswordForm`: Password reset request
- `ResetPasswordForm`: New password setup

#### Form Features

- Client-side validation
- Loading states and error handling
- OAuth provider integration
- Responsive design with Tailwind CSS
- Accessibility compliance

## Security Implementation

### Row Level Security (RLS)

Database-level security ensures users can only access their own data:

```sql
-- Example RLS policy for user_profiles table
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Security Policies by Table

1. **user_profiles**: Users can manage their own profile
2. **taste_profiles**: Users can manage their own taste data
3. **wines**: Users can manage their own wine collection
4. **consumption_history**: Users can manage their own consumption records
5. **drinking_partners**: Users can manage their own partner data
6. **recommendations**: Users can view their own recommendations
7. **notifications**: Users can view and update their own notifications

### Authentication Flow Security

- **Email Verification**: Required for new accounts
- **Password Requirements**: Minimum 6 characters (configurable)
- **Session Management**: Automatic token refresh
- **CSRF Protection**: Built into Supabase Auth
- **Rate Limiting**: Handled by Supabase infrastructure

## Usage Patterns

### Basic Authentication Check

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <SignInPrompt />
  
  return <AuthenticatedContent />
}
```

### Protected Route Implementation

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function DashboardPage() {
  return (
    <ProtectedRoute requireOnboarding={true}>
      <Dashboard />
    </ProtectedRoute>
  )
}
```

### Profile Management

```typescript
import { AuthService } from '@/lib/auth'

// Update user profile
await AuthService.updateUserProfile(userId, {
  name: 'New Name',
  experienceLevel: 'advanced',
  onboardingCompleted: true,
})
```

### OAuth Integration

```typescript
import { AuthService } from '@/lib/auth'

// Initiate OAuth sign-in
await AuthService.signInWithProvider('google')
```

## Error Handling

The system provides comprehensive error handling:

### Error Types

1. **Authentication Errors**: Invalid credentials, email not confirmed
2. **Validation Errors**: Password requirements, email format
3. **Network Errors**: Connection issues, timeout
4. **Authorization Errors**: Insufficient permissions

### Error Messages

User-friendly error messages are provided via `getAuthErrorMessage()`:

```typescript
import { getAuthErrorMessage } from '@/lib/auth'

try {
  await AuthService.signIn(credentials)
} catch (error) {
  const message = getAuthErrorMessage(error)
  setError(message) // Display to user
}
```

## Testing Strategy

### Unit Tests

- Authentication service methods
- Hook behavior and state management
- Error handling scenarios
- Form validation logic

### Integration Tests

- Complete authentication flows
- Route protection behavior
- OAuth provider integration
- Database RLS policy enforcement

### Test Coverage

- All authentication methods
- Error scenarios
- Loading states
- Route protection logic
- Form interactions

## Configuration

### Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### OAuth Provider Setup

OAuth providers must be configured in the Supabase dashboard:

1. **Google**: Configure OAuth client ID and secret
2. **GitHub**: Set up GitHub OAuth app
3. **Apple**: Configure Apple Sign In (iOS/macOS apps)

### Redirect URLs

Configure these redirect URLs in your OAuth providers:

- Development: `http://localhost:3000/auth/callback`
- Production: `https://yourdomain.com/auth/callback`

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Authentication forms are code-split
2. **Caching**: User profile data is cached in React state
3. **Debouncing**: Form validation is debounced
4. **Minimal Re-renders**: Optimized context updates

### Bundle Size

The authentication system is designed to minimize bundle impact:

- Tree-shakable exports
- Conditional imports for OAuth providers
- Minimal external dependencies

## Migration and Maintenance

### Database Migrations

Authentication-related schema changes are handled via Supabase migrations:

```sql
-- Example migration for adding new profile field
ALTER TABLE user_profiles 
ADD COLUMN new_field TEXT DEFAULT NULL;
```

### Backward Compatibility

- Profile schema changes include default values
- New authentication methods are additive
- Existing user sessions remain valid during updates

## Monitoring and Analytics

### Authentication Metrics

Track key authentication metrics:

- Sign-up conversion rates
- Sign-in success/failure rates
- OAuth provider usage
- Password reset frequency
- Session duration

### Error Monitoring

Monitor authentication errors:

- Failed sign-in attempts
- OAuth callback failures
- Token refresh errors
- RLS policy violations

## Future Enhancements

### Planned Features

1. **Multi-Factor Authentication (MFA)**
2. **Social Login Expansion**
3. **Enterprise SSO Integration**
4. **Advanced Session Management**
5. **Audit Logging**

### Scalability Considerations

- Database connection pooling
- Redis session storage
- CDN for static assets
- Load balancing for high availability

## Troubleshooting

### Common Issues

1. **Email Confirmation Not Received**
   - Check spam folder
   - Verify email configuration
   - Use resend functionality

2. **OAuth Callback Errors**
   - Verify redirect URL configuration
   - Check OAuth provider settings
   - Ensure HTTPS in production

3. **RLS Policy Violations**
   - Check user authentication status
   - Verify policy conditions
   - Review database logs

### Debug Tools

- Supabase Auth logs
- Browser developer tools
- Network request inspection
- Database query logs

## Security Best Practices

### Implementation Guidelines

1. **Never store passwords in plain text**
2. **Always use HTTPS in production**
3. **Implement proper session timeout**
4. **Validate all user inputs**
5. **Use parameterized queries**
6. **Regular security audits**

### Compliance Considerations

- GDPR compliance for EU users
- CCPA compliance for California users
- Data retention policies
- User consent management
- Right to deletion implementation