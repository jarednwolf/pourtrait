/**
 * Onboarding Components Export Index
 * 
 * Centralized exports for all onboarding-related components
 */

export { OnboardingFlow } from './OnboardingFlow'
export { OnboardingWelcome } from './OnboardingWelcome'
export { OnboardingComplete } from './OnboardingComplete'
export { TasteProfileQuiz } from './TasteProfileQuiz'
export { QuizQuestion } from './QuizQuestion'
export { QuizProgress } from './QuizProgress'
export { QuizResult } from './QuizResult'

// Re-export types and utilities
export type { QuizQuestion as QuizQuestionType, QuizResponse, QuizResult as QuizResultType } from '@/lib/onboarding/quiz-data'
export { quizQuestions, educationalContent } from '@/lib/onboarding/quiz-data'
export { calculateTasteProfile, validateQuizResponses } from '@/lib/onboarding/quiz-calculator'