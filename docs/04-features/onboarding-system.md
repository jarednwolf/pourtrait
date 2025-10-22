# Onboarding System Documentation

## Overview

The onboarding system provides a comprehensive taste profile quiz that helps new users discover their wine preferences and creates personalized recommendations. The system is designed to be approachable for beginners while providing meaningful data for the AI recommendation engine.

## Architecture

### Components Structure

```
src/components/onboarding/
├── OnboardingFlow.tsx          # Main orchestrator component
├── OnboardingWelcome.tsx       # Welcome screen with introduction
├── TasteProfileQuiz.tsx        # Main quiz interface
├── QuizQuestion.tsx            # Individual question renderer
├── QuizProgress.tsx            # Progress tracking component
├── QuizResult.tsx              # Results display component
├── OnboardingComplete.tsx      # Final completion screen
└── index.ts                    # Component exports
```

### Data Layer

```
src/lib/onboarding/
├── quiz-data.ts                # Question definitions and configuration
├── quiz-calculator.ts          # Taste profile calculation logic
└── __tests__/                  # Unit tests for calculation logic
```

## Key Features

### 1. Adaptive Question Flow (Experience Branching)

We branch immediately by experience using `experience-level`:

- **Novice (baseline)**: 10–12 structured scale/single-choice items. We explicitly separate dry/bitter tolerance and sweet preference as two distinct scale prompts. Output is mapped directly to the structured `UserProfile` via `calculateStructuredUserProfile`.
- **Exploring / Expert (free-text)**: Replace most sliders with 3–5 free‑text prompts: bottles enjoyed and why; bottles not enjoyed and why; contexts/occasions; descriptors; plus a short prompt about sweet vs dry/bitter. These answers are sent to `/api/profile/map` where an LLM maps the notes to `UserProfile` (validated by Zod) and then `/api/profile/upsert` persists.

### 2. Question Types

#### Single Choice Questions
```typescript
{
  id: 'experience-level',
  type: 'single-choice',
  question: 'How would you describe your wine experience?',
  options: [
    { id: 'beginner', label: 'New to wine', value: 'beginner' },
    { id: 'casual', label: 'Casual wine drinker', value: 'intermediate' }
  ]
}
```

#### Multiple Choice Questions
```typescript
{
  id: 'wine-types-tried',
  type: 'multiple-choice',
  question: 'Which types of wine have you tried and enjoyed?',
  options: [
    { id: 'red-light', label: 'Light red wines', value: 'red-light' },
    { id: 'white-crisp', label: 'Crisp white wines', value: 'white-crisp' }
  ]
}
```

#### Scale Questions (Novice path)
```typescript
{
  id: 'sweetness-preference',
  type: 'scale',
  question: 'Do you prefer dry or sweet wines?',
  scaleConfig: {
    min: 1,
    max: 10,
    minLabel: 'Very dry (no sweetness)',
    maxLabel: 'Very sweet'
  }
}
```

### 3. Taste Profile Calculation and LLM Mapping

For Novice, we compute on-device via `quiz-calculator.ts`. For Exploring/Expert, we submit free‑text to `/api/profile/map` which uses `src/lib/profile/llm-mapper.ts` to produce a `UserProfile` that conforms to `UserProfileSchema`.

#### Red Wine Preferences
- Fruitiness (1-10 scale)
- Earthiness (1-10 scale)
- Oakiness (1-10 scale)
- Acidity (1-10 scale)
- Tannins (1-10 scale)
- Sweetness (1-10 scale)
- Body preference (light/medium/full)
- Preferred varietals and regions

#### White Wine Preferences
- Similar characteristics adapted for white wines
- Higher acidity baseline
- Lower tannin levels
- Different varietal preferences

#### General Preferences
- Price range comfort zone
- Food pairing importance
- Occasion preferences
- Regional interests

### 4. Confidence Scoring

The system calculates confidence scores based on:

- **Completeness**: Percentage of required questions answered
- **Optional responses**: Bonus for answering optional questions
- **Consistency**: Alignment between related responses
- **Experience indicators**: Correlation between stated and implied experience

```typescript
function calculateConfidenceScore(responses: QuizResponse[]): number {
  const completenessScore = answeredRequired / requiredQuestions
  const optionalBonus = (optionalAnswered / optionalQuestions) * 0.2
  const consistencyBonus = calculateConsistencyBonus(responseMap)
  
  return Math.min(1, completenessScore + optionalBonus + consistencyBonus)
}
```

## User Experience Design

### 1. Progressive Onboarding

The onboarding follows a clear progression:

1. **Welcome Screen**: Sets expectations and explains benefits
2. **Quiz Flow**: Guided question-by-question experience
3. **Results Display**: Personalized profile summary
4. **Completion**: Next steps and encouragement

### 2. Educational Integration

- **Contextual help**: Info buttons provide explanations without interrupting flow
- **Jargon-free language**: Technical terms explained in accessible language
- **Progressive learning**: Concepts introduced as needed
- **Experience-appropriate content**: Explanations match user's stated experience level

### 3. Accessibility Features

#### Visual Accessibility
- High contrast color schemes
- Clear typography hierarchy
- Sufficient button sizes for touch interfaces
- Visual progress indicators

#### Screen Reader Support
- Proper ARIA labels and roles
- Descriptive text for complex interactions
- Progress announcements
- Error message associations

#### Keyboard Navigation
- Full keyboard accessibility
- Logical tab order
- Enter/Space key activation
- Focus indicators

## Implementation Guidelines

### 1. Adding New Questions

To add a new question to the quiz:

```typescript
// 1. Add to quiz-data.ts
const newQuestion: QuizQuestion = {
  id: 'new-question-id',
  type: 'single-choice',
  category: 'preferences',
  question: 'Your question text?',
  options: [
    { id: 'option1', label: 'Option 1', value: 'value1' }
  ],
  required: true,
  educationalNote: 'Optional explanation'
}

// 2. Update calculation logic in quiz-calculator.ts
function calculateTasteProfile(responses: QuizResponse[]) {
  const newQuestionValue = responseMap.get('new-question-id')
  // Handle the new response in profile calculation
}

// 3. Add tests
describe('New Question', () => {
  it('should handle new question response', () => {
    // Test the new question handling
  })
})
```

### 2. Modifying Calculation Logic

When updating taste profile calculations:

1. **Maintain backwards compatibility**: Ensure existing profiles aren't broken
2. **Add comprehensive tests**: Test edge cases and validation
3. **Document changes**: Update this documentation
4. **Consider migration**: Plan for updating existing user profiles

### 3. Customizing Educational Content

Educational content can be customized per experience level:

```typescript
export const educationalContent = {
  beginner: {
    welcome: 'Welcome message for beginners',
    tips: ['Tip 1 for beginners', 'Tip 2 for beginners']
  },
  intermediate: {
    welcome: 'Welcome message for intermediate users',
    tips: ['Tip 1 for intermediate', 'Tip 2 for intermediate']
  },
  advanced: {
    welcome: 'Welcome message for advanced users',
    tips: ['Tip 1 for advanced', 'Tip 2 for advanced']
  }
}
```

## Testing Strategy

### 1. Unit Tests

- **Calculation logic**: Test taste profile calculations with various inputs
- **Validation**: Test response validation and error handling
- **Edge cases**: Test with incomplete or invalid data

### 2. Component Tests

- **Question rendering**: Test different question types render correctly
- **User interactions**: Test option selection and navigation
- **Error states**: Test validation error display

### 3. Integration Tests

- **Complete flow**: Test full quiz completion
- **Navigation**: Test forward/backward navigation
- **Auto-save**: Test response persistence

### 4. Accessibility Tests

- **Automated testing**: Use axe-core for automated accessibility testing
- **Manual testing**: Test with screen readers and keyboard navigation
- **WCAG compliance**: Ensure AA level compliance

## Performance Considerations

### 1. Component Optimization

- **Lazy loading**: Load quiz components only when needed
- **Memoization**: Prevent unnecessary re-renders
- **Efficient state management**: Minimize state updates

### 2. Data Handling

- **Local storage**: Cache responses for recovery
- **Debounced saves**: Avoid excessive API calls
- **Efficient calculations**: Optimize taste profile calculations

## Security and Privacy

### 1. Data Protection

- **Local processing**: Taste profile calculations happen client-side
- **Minimal data collection**: Only collect necessary information
- **User consent**: Clear explanation of data usage

### 2. Validation

- **Input sanitization**: Validate all user inputs
- **Type safety**: Use TypeScript for compile-time safety
- **Runtime validation**: Use Zod schemas for runtime validation

## Future Enhancements

### 1. Adaptive Questioning

- **Dynamic question selection**: Show questions based on previous answers
- **Shortened flows**: Skip irrelevant questions for experienced users
- **Personalized explanations**: Customize educational content

### 2. Enhanced Analytics

- **Completion tracking**: Monitor where users drop off
- **Question effectiveness**: Analyze which questions provide most value
- **A/B testing**: Test different question phrasings and flows

### 3. Multi-language Support

- **Internationalization**: Support multiple languages
- **Cultural adaptation**: Adapt questions for different wine cultures
- **Regional preferences**: Include region-specific wine knowledge

## Troubleshooting

### Common Issues

#### Quiz Not Progressing
- Check that required questions are answered
- Verify validation logic is working correctly
- Ensure navigation buttons are enabled properly

#### Calculation Errors
- Verify all required responses are present
- Check for invalid response values
- Ensure calculation functions handle edge cases

#### Accessibility Issues
- Run automated accessibility tests
- Test with screen readers
- Verify keyboard navigation works

### Debugging Tools

```typescript
// Enable debug logging
const DEBUG_QUIZ = process.env.NODE_ENV === 'development'

if (DEBUG_QUIZ) {
  console.log('Quiz responses:', responses)
  console.log('Calculated profile:', result)
  console.log('Confidence score:', result.confidenceScore)
}
```

## API Integration

The onboarding system integrates with the backend through:

### 1. Profile Mapping (Exploring/Expert)
```typescript
// POST /api/profile/map (Node runtime)
// body: { experience: 'intermediate'|'expert', freeTextAnswers: Record<string,string> }
```

### 2. Profile Upsert
```typescript
// POST /api/profile/upsert (Edge runtime)
// body: UserProfile (zod-validated)
```

### 3. Response Persistence
```typescript
// Auto-save quiz responses
const saveResponses = async (responses: QuizResponse[]) => {
  localStorage.setItem('quiz_responses', JSON.stringify(responses))
}
```

This documentation provides a comprehensive guide to understanding, implementing, and maintaining the onboarding system. Regular updates should be made as the system evolves.