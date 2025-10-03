# Onboarding Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the onboarding system to prevent regressions and ensure quality.

## Testing Levels

### 1. Unit Tests
- **Location**: `src/lib/onboarding/__tests__/`
- **Coverage**: Quiz calculation logic, validation functions
- **Status**: ✅ 16 tests passing
- **Command**: `npm test -- --run src/lib/onboarding/__tests__/`

### 2. Component Tests
- **Location**: `src/components/onboarding/__tests__/`
- **Coverage**: UI components, user interactions, accessibility
- **Status**: ✅ 18 tests passing
- **Command**: `npm test -- --run src/components/onboarding/__tests__/QuizQuestion.test.tsx`

### 3. Integration Tests
- **Location**: `src/components/onboarding/__tests__/TasteProfileQuiz.test.tsx`
- **Coverage**: Complete quiz flow, navigation, validation
- **Status**: ✅ Created (needs implementation)

### 4. Accessibility Tests
- **Location**: `src/components/onboarding/__tests__/accessibility.test.tsx`
- **Coverage**: WCAG compliance, screen reader support, keyboard navigation
- **Status**: ✅ Created (needs jest-axe setup)

## Verification Script

### Automated Verification
Run the comprehensive verification script:
```bash
./scripts/verify-onboarding.sh
```

This script checks:
- TypeScript diagnostics
- Unit test execution
- Component test execution
- Import/export validation
- DOM structure validation
- Code quality checks

### Manual Testing Checklist

#### Functional Testing
- [ ] Quiz loads without errors
- [ ] All question types render correctly
- [ ] Navigation works (next/previous)
- [ ] Validation prevents invalid submissions
- [ ] Results display correctly
- [ ] Educational content toggles work

#### Accessibility Testing
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces content correctly
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Error messages are properly associated

#### Cross-browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Mobile Testing
- [ ] Touch interactions work
- [ ] Layout is responsive
- [ ] Text is readable
- [ ] Buttons are appropriately sized

## Continuous Integration

### Pre-commit Hooks
```bash
# Add to .husky/pre-commit
npm test -- --run src/lib/onboarding/__tests__/ src/components/onboarding/__tests__/QuizQuestion.test.tsx
```

### CI Pipeline Checks
1. TypeScript compilation
2. Unit tests
3. Component tests
4. Accessibility tests (when jest-axe is configured)
5. Build verification

## Quality Gates

### Definition of Done
- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] TypeScript diagnostics are clean
- [ ] No DOM nesting warnings
- [ ] No console.log statements
- [ ] Accessibility tests pass
- [ ] Manual testing completed

### Performance Criteria
- Quiz loads in < 2 seconds
- Question transitions are smooth (< 100ms)
- No memory leaks during quiz completion

## Regression Prevention

### Common Issues to Watch For
1. **Import/Export Conflicts**: Ensure no duplicate names
2. **DOM Nesting**: Avoid buttons inside buttons
3. **TypeScript Errors**: Run diagnostics regularly
4. **Test Brittleness**: Use semantic selectors, not implementation details
5. **Accessibility Regressions**: Test with keyboard and screen readers

### Monitoring
- Set up error tracking for production
- Monitor quiz completion rates
- Track user feedback on onboarding experience

## Tools and Dependencies

### Testing Framework
- **Vitest**: Unit and component testing
- **React Testing Library**: Component testing utilities
- **jest-axe**: Accessibility testing (to be configured)

### Development Tools
- **TypeScript**: Type checking
- **ESLint**: Code quality
- **Prettier**: Code formatting

## Maintenance

### Regular Tasks
- Update test snapshots when UI changes
- Review and update accessibility tests
- Monitor test performance and optimize slow tests
- Update documentation when adding new features

### Quarterly Reviews
- Analyze test coverage and identify gaps
- Review testing strategy effectiveness
- Update testing tools and dependencies
- Conduct accessibility audit