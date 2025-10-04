'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

// ============================================================================
// Types
// ============================================================================

interface ChatSuggestionsProps {
  onSuggestionSelect: (suggestion: string) => void
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  context?: 'general' | 'inventory' | 'pairing' | 'learning'
  className?: string
}

import type { IconName } from '@/components/ui/Icon'

interface Suggestion {
  text: string
  icon: IconName
  category: string
  experienceLevel: ('beginner' | 'intermediate' | 'advanced')[]
}

// ============================================================================
// Predefined Suggestions
// ============================================================================

const SUGGESTIONS: Suggestion[] = [
  // General recommendations
  {
    text: "What should I drink tonight?",
    icon: "wine-glass",
    category: "Tonight",
    experienceLevel: ['beginner', 'intermediate', 'advanced']
  },
  {
    text: "Recommend a wine for a romantic dinner",
    icon: "heart",
    category: "Occasion",
    experienceLevel: ['beginner', 'intermediate', 'advanced']
  },
  {
    text: "What wine pairs well with grilled salmon?",
    icon: "utensils",
    category: "Food Pairing",
    experienceLevel: ['beginner', 'intermediate', 'advanced']
  },
  {
    text: "Suggest a wine under $30 for a dinner party",
    icon: "dollar-sign",
    category: "Budget",
    experienceLevel: ['beginner', 'intermediate', 'advanced']
  },

  // Beginner-friendly suggestions
  {
    text: "I'm new to wine. What should I try first?",
    icon: "book-open",
    category: "Learning",
    experienceLevel: ['beginner']
  },
  {
    text: "What's the difference between Cabernet and Merlot?",
    icon: "help-circle",
    category: "Learning",
    experienceLevel: ['beginner']
  },
  {
    text: "Recommend an easy-drinking red wine",
    icon: "wine-glass",
    category: "Easy Drinking",
    experienceLevel: ['beginner']
  },
  {
    text: "What wine goes with pizza?",
    icon: "utensils",
    category: "Casual Pairing",
    experienceLevel: ['beginner']
  },

  // Intermediate suggestions
  {
    text: "Compare Burgundy vs Oregon Pinot Noir",
    icon: "scale",
    category: "Comparison",
    experienceLevel: ['intermediate', 'advanced']
  },
  {
    text: "Suggest wines from emerging regions",
    icon: "globe",
    category: "Discovery",
    experienceLevel: ['intermediate', 'advanced']
  },
  {
    text: "What's drinking well from my 2018 vintage wines?",
    icon: "clock",
    category: "Timing",
    experienceLevel: ['intermediate', 'advanced']
  },
  {
    text: "Recommend a wine for aging 10+ years",
    icon: "save",
    category: "Cellar",
    experienceLevel: ['intermediate', 'advanced']
  },

  // Advanced suggestions
  {
    text: "Analyze the 2020 Bordeaux vintage quality",
    icon: "chart",
    category: "Analysis",
    experienceLevel: ['advanced']
  },
  {
    text: "Suggest natural wines with minimal intervention",
    icon: "leaf",
    category: "Natural",
    experienceLevel: ['advanced']
  },
  {
    text: "Compare Left Bank vs Right Bank Bordeaux styles",
    icon: "map",
    category: "Terroir",
    experienceLevel: ['advanced']
  },

  // Inventory-specific
  {
    text: "Which wines in my cellar need drinking soon?",
    icon: "exclamation-triangle",
    category: "Urgency",
    experienceLevel: ['intermediate', 'advanced']
  },
  {
    text: "Show me wines perfect for tonight's weather",
    icon: "sun",
    category: "Seasonal",
    experienceLevel: ['beginner', 'intermediate', 'advanced']
  },

  // Learning and education
  {
    text: "Explain wine tasting notes to me",
    icon: "book-open",
    category: "Education",
    experienceLevel: ['beginner']
  },
  {
    text: "How do I properly store opened wine?",
    icon: "save",
    category: "Storage",
    experienceLevel: ['beginner', 'intermediate']
  },
  {
    text: "What's the ideal serving temperature for Chardonnay?",
    icon: "info",
    category: "Service",
    experienceLevel: ['beginner', 'intermediate']
  }
]

// ============================================================================
// Chat Suggestions Component
// ============================================================================

export function ChatSuggestions({
  onSuggestionSelect,
  experienceLevel = 'intermediate',
  context = 'general',
  className = ''
}: ChatSuggestionsProps) {
  // Filter suggestions based on experience level and context
  const filteredSuggestions = SUGGESTIONS.filter(suggestion => {
    // Check experience level match
    const levelMatch = suggestion.experienceLevel.includes(experienceLevel)
    
    // Context-specific filtering
    let contextMatch = true
    if (context === 'inventory') {
      contextMatch = ['Tonight', 'Urgency', 'Seasonal', 'Timing'].includes(suggestion.category)
    } else if (context === 'pairing') {
      contextMatch = ['Food Pairing', 'Casual Pairing'].includes(suggestion.category)
    } else if (context === 'learning') {
      contextMatch = ['Learning', 'Education', 'Storage', 'Service'].includes(suggestion.category)
    }
    
    return levelMatch && contextMatch
  })

  // Group suggestions by category
  // const groupedSuggestions = filteredSuggestions.reduce((groups, suggestion) => {
  //   const category = suggestion.category
  //   if (!groups[category]) {
  //     groups[category] = []
  //   }
  //   groups[category].push(suggestion)
  //   return groups
  // }, {} as Record<string, Suggestion[]>)

  // Limit to most relevant suggestions (max 8)
  const limitedSuggestions = filteredSuggestions.slice(0, 8)

  if (limitedSuggestions.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Try asking me about:
        </h4>
      </div>

      {/* Quick suggestions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {limitedSuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => onSuggestionSelect(suggestion.text)}
            className="justify-start text-left h-auto p-3 hover:bg-purple-50 hover:border-purple-200 transition-colors"
          >
            <div className="flex items-start space-x-3 w-full">
              <Icon 
                name={suggestion.icon} 
                className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 font-medium">
                  {suggestion.text}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {suggestion.category}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* Experience level indicator */}
      <div className="text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
          <Icon name="user" className="w-3 h-3 mr-1" />
          {experienceLevel} level suggestions
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Contextual Suggestions (for specific scenarios)
// ============================================================================

export function ContextualSuggestions({
  context,
  onSuggestionSelect,
  className = ''
}: {
  context: 'empty_inventory' | 'first_time' | 'after_recommendation' | 'error_recovery'
  onSuggestionSelect: (suggestion: string) => void
  className?: string
}) {
  const contextSuggestions = {
    empty_inventory: [
      "Help me build my first wine collection",
      "What are essential wines every collector should have?",
      "Recommend wines for different occasions",
      "What's a good budget for starting a wine collection?"
    ],
    first_time: [
      "I'm completely new to wine. Where do I start?",
      "What's the difference between red and white wine?",
      "How do I taste wine properly?",
      "What wine tools do I need as a beginner?"
    ],
    after_recommendation: [
      "Tell me more about this wine region",
      "What food would pair well with this?",
      "Are there similar wines I might like?",
      "How should I serve this wine?"
    ],
    error_recovery: [
      "What should I drink tonight?",
      "Recommend a popular wine",
      "Help me understand wine basics",
      "Show me beginner-friendly options"
    ]
  }

  const suggestions = contextSuggestions[context] || []

  return (
    <div className={`space-y-2 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="ghost"
          onClick={() => onSuggestionSelect(suggestion)}
          className="w-full justify-start text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        >
          <Icon name="chat-bubble-left" className="w-4 h-4 mr-2" />
          {suggestion}
        </Button>
      ))}
    </div>
  )
}

// ============================================================================
// Quick Action Suggestions
// ============================================================================

type QuickAction = { text: string; icon: IconName; color: 'purple' | 'blue' | 'green' | 'orange' }

export function QuickActionSuggestions({
  onSuggestionSelect,
  className = ''
}: {
  onSuggestionSelect: (suggestion: string) => void
  className?: string
}) {
  const quickActions: QuickAction[] = [
    {
      text: "What should I drink tonight?",
      icon: "wine-glass",
      color: "purple"
    },
    {
      text: "Help me pair wine with dinner",
      icon: "utensils",
      color: "blue"
    },
    {
      text: "Recommend wines to buy",
      icon: "shopping-cart",
      color: "green"
    },
    {
      text: "Teach me about wine",
      icon: "book-open",
      color: "orange"
    }
  ]

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {quickActions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onSuggestionSelect(action.text)}
          className={`h-20 flex-col space-y-2 hover:bg-${action.color}-50 hover:border-${action.color}-200`}
        >
          <Icon name={action.icon} className={`w-6 h-6 text-${action.color}-600`} />
          <span className="text-xs text-center leading-tight">
            {action.text}
          </span>
        </Button>
      ))}
    </div>
  )
}