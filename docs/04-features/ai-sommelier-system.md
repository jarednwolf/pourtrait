# AI Sommelier System

## Overview

The AI Sommelier System is the core intelligence behind Pourtrait's wine recommendations. It combines OpenAI's GPT-4 with retrieval-augmented generation (RAG), professional sommelier knowledge, and strict response validation to provide personalized wine recommendations that maintain professional standards while being accessible to users of all experience levels.

## Architecture

### Core Components

1. **AI Recommendation Engine** (`src/lib/ai/recommendation-engine.ts`)
   - Main orchestrator for AI-powered recommendations
   - Integrates context analysis, RAG, and response validation
   - Handles different recommendation types (inventory, purchase, pairing)

2. **Response Validation System** (`src/lib/ai/validation.ts`)
   - Enforces professional sommelier standards
   - Validates against emoji usage (strict prohibition)
   - Ensures appropriate vocabulary for user experience level
   - Checks factual accuracy and completeness

3. **Context Analyzer** (`src/lib/ai/context-analyzer.ts`)
   - Analyzes user queries and context for comprehensive understanding
   - Extracts occasion, food pairing, preferences, and urgency information
   - Provides structured context for AI prompt generation

4. **Vector Database Service** (`src/lib/ai/vector-service.ts`)
   - Implements RAG using Pinecone vector database
   - Stores wine knowledge embeddings for similarity search
   - Enhances AI responses with relevant wine data

## Key Features

### Professional Sommelier Standards

The system maintains strict professional standards:

- **No Emojis Policy**: Automatic detection and removal of emojis
- **Professional Vocabulary**: Appropriate wine terminology for each experience level
- **Structured Responses**: Clear recommendations with reasoning
- **Educational Context**: Beginner-friendly explanations when needed

### Experience Level Adaptation

#### Beginner Level
- Simple, accessible language
- Explanation of wine terms
- Confidence-building encouragement
- Focus on approachable wines

#### Intermediate Level
- Moderate wine terminology with brief explanations
- Introduction of new concepts
- Balance of familiar and adventurous recommendations

#### Advanced Level
- Full sommelier vocabulary
- Technical details about winemaking and terroir
- Complex flavor interactions and aging potential
- Rare and unique wine suggestions

### Recommendation Types

1. **Inventory Recommendations**
   - Suggests wines from user's existing collection
   - Prioritizes drinking window urgency
   - Considers occasion and food pairing

2. **Purchase Recommendations**
   - Suggests new wines to buy
   - Based on taste profile and preferences
   - Includes price considerations and availability

3. **Food Pairing Recommendations**
   - Wine suggestions for specific dishes
   - Classic and innovative pairing principles
   - Considers user preferences within pairing guidelines

4. **Restaurant Recommendations**
   - Selections from restaurant wine lists
   - Value considerations and menu compatibility
   - Limited to available options

## API Endpoints

### POST /api/ai/recommendations

Generate comprehensive wine recommendations.

**Request Body:**
```json
{
  "query": "What should I drink with dinner tonight?",
  "context": {
    "occasion": "dinner party",
    "foodPairing": "grilled steak",
    "priceRange": {
      "min": 25,
      "max": 100,
      "currency": "USD"
    }
  },
  "includeInventory": true,
  "experienceLevel": "intermediate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "inventory",
        "wineId": "wine-123",
        "reasoning": "This Cabernet Sauvignon pairs excellently with grilled steak...",
        "confidence": 0.92,
        "educationalContext": "Cabernet Sauvignon is known for its bold tannins..."
      }
    ],
    "reasoning": "Based on your preference for full-bodied reds...",
    "confidence": 0.89,
    "educationalNotes": "When pairing wine with steak...",
    "followUpQuestions": [
      "What cooking method will you use for the steak?",
      "Are you serving any side dishes?"
    ],
    "responseMetadata": {
      "model": "gpt-4-turbo-preview",
      "tokensUsed": 245,
      "responseTime": 1250,
      "validationPassed": true,
      "confidence": 0.89
    }
  }
}
```

### POST /api/ai/chat

Conversational sommelier interface.

**Request Body:**
```json
{
  "message": "I'm new to wine. What should I try first?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant", 
      "content": "Hello! I'm your AI sommelier. How can I help you with wine today?"
    }
  ]
}
```

### GET /api/ai/metrics

Retrieve AI system performance metrics.

**Query Parameters:**
- `timeframe`: 1h, 24h, 7d, 30d
- `userId`: Optional user-specific metrics

## Response Validation

### Validation Rules

1. **Emoji Detection**: Strict prohibition with automatic removal
2. **Professional Tone**: Must use sommelier-appropriate language
3. **Vocabulary Level**: Must match user's experience level
4. **Completeness**: Must include reasoning and specific wine details
5. **Length Limits**: Appropriate response length for context
6. **Factual Accuracy**: Validation against wine misconceptions

### Validation Scoring

- **100 points**: Perfect professional response
- **-50 points**: Emoji usage (critical failure)
- **-20 points**: Unprofessional tone
- **-10 points**: Length exceeded
- **-5 points**: Vocabulary mismatch
- **-10 points**: Incomplete reasoning

Minimum passing score: 70 points

## Context Analysis

### Occasion Detection

The system automatically detects:
- **Dinner Party**: Semi-formal wine selections
- **Romantic Dinner**: Elegant, conversation-enhancing wines
- **Celebration**: Festive, special occasion wines
- **Casual Evening**: Approachable, easy-drinking wines
- **Business Dinner**: Professional, impressive selections

### Food Pairing Analysis

Extracts and analyzes:
- **Main Dish**: Primary protein or dish type
- **Cooking Method**: Grilled, roasted, braised, etc.
- **Cuisine Type**: Italian, French, Asian, etc.
- **Spice Level**: None, mild, medium, hot
- **Richness**: Light, medium, rich

### Urgency Assessment

Determines recommendation urgency:
- **High**: "Tonight", "now", "immediately"
- **Medium**: General recommendations
- **Low**: "Planning", "future", "next week"

## Vector Database (RAG)

### Wine Knowledge Storage

Wines are stored as vector embeddings containing:
- Wine name, producer, region, vintage
- Tasting notes and characteristics
- Professional ratings and reviews
- Price range and availability information

### Similarity Search

The system performs semantic search to find:
- Similar wines based on user preferences
- Relevant wine knowledge for context
- Pairing suggestions from wine database
- Expert opinions and recommendations

### Knowledge Sources

1. **User Inventory**: Personal wine collection data
2. **Wine Databases**: External wine information APIs
3. **Expert Reviews**: Professional wine ratings and notes
4. **Pairing Rules**: Classic and modern food pairing principles

## Monitoring and Analytics

### Performance Metrics

- **Average Response Time**: Target < 3 seconds
- **Average Confidence**: Target > 0.8
- **Success Rate**: Responses with confidence > 0.7
- **Cost Per Request**: Token usage and API costs
- **User Satisfaction**: Feedback and acceptance rates

### Cost Management

- **Token Optimization**: Efficient prompt engineering
- **Model Selection**: GPT-4 for quality, GPT-3.5 for speed
- **Caching**: Response caching for common queries
- **Rate Limiting**: Prevent excessive API usage

### Quality Assurance

- **Validation Monitoring**: Track validation failure rates
- **Response Quality**: Manual review of AI responses
- **User Feedback**: Integration with recommendation feedback
- **A/B Testing**: Compare different prompt strategies

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Vector Database (Pinecone)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

# Supabase (for data storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### AI Model Configuration

```typescript
export const AI_CONFIG = {
  openai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 1500
  },
  vectorDb: {
    indexName: 'wine-knowledge',
    topK: 10
  },
  responseValidation: {
    noEmojis: true,
    professionalTone: true,
    maxResponseLength: 2000
  }
}
```

## Usage Examples

### Basic Wine Recommendation

```typescript
import { useAIRecommendations } from '@/hooks/useAIRecommendations'

function WineRecommendation() {
  const { getRecommendations, loading, recommendations } = useAIRecommendations({
    includeInventory: true,
    experienceLevel: 'intermediate'
  })

  const handleGetRecommendation = async () => {
    await getRecommendations(
      "What should I drink with dinner tonight?",
      {
        occasion: "dinner party",
        foodPairing: "grilled steak"
      }
    )
  }

  return (
    <div>
      <button onClick={handleGetRecommendation} disabled={loading}>
        Get Recommendation
      </button>
      {recommendations && (
        <div>
          <h3>Recommendations:</h3>
          {recommendations.recommendations.map((rec, index) => (
            <div key={index}>
              <p>{rec.reasoning}</p>
              <p>Confidence: {(rec.confidence * 100).toFixed(0)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Chat Interface

```typescript
import { useAIChat } from '@/hooks/useAIRecommendations'

function SommelierChat() {
  const { messages, sendMessage, loading } = useAIChat()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (input.trim()) {
      await sendMessage(input)
      setInput('')
    }
  }

  return (
    <div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.confidence && (
              <small>Confidence: {(msg.confidence * 100).toFixed(0)}%</small>
            )}
          </div>
        ))}
      </div>
      <div className="input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your sommelier..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}
```

## Testing

### Test Coverage

The AI system includes comprehensive tests:

1. **Validation Tests** (`validation.test.ts`)
   - Emoji detection and removal
   - Professional tone validation
   - Vocabulary level appropriateness
   - Response completeness

2. **Context Analysis Tests** (`context-analyzer.test.ts`)
   - Occasion detection accuracy
   - Food pairing extraction
   - Urgency assessment
   - Preference analysis

3. **Recommendation Engine Tests** (`recommendation-engine.test.ts`)
   - End-to-end recommendation generation
   - Error handling and fallbacks
   - Experience level adaptation
   - Confidence calculation

### Running Tests

```bash
# Run all AI tests
npm test src/lib/ai

# Run specific test file
npm test src/lib/ai/__tests__/validation.test.ts

# Run tests with coverage
npm test -- --coverage src/lib/ai
```

## Troubleshooting

### Common Issues

1. **High Response Times**
   - Check OpenAI API status
   - Optimize prompt length
   - Consider model downgrade for speed

2. **Low Confidence Scores**
   - Review prompt templates
   - Check user profile completeness
   - Validate wine knowledge base

3. **Validation Failures**
   - Monitor emoji detection logs
   - Review professional tone patterns
   - Check vocabulary complexity

4. **High API Costs**
   - Implement response caching
   - Optimize token usage
   - Consider model selection strategy

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG_AI=true

// Or in code
process.env.DEBUG_AI = 'true'
```

This will log:
- Prompt templates used
- AI response validation results
- Context analysis details
- Performance metrics

## Future Enhancements

### Planned Features

1. **Multi-language Support**: Sommelier responses in multiple languages
2. **Voice Integration**: Voice-based wine recommendations
3. **Image Analysis**: Wine label and food photo analysis
4. **Personalization Engine**: Advanced learning from user feedback
5. **Expert Integration**: Real sommelier review and validation
6. **Mobile Optimization**: Offline-capable recommendations

### Performance Improvements

1. **Response Caching**: Cache common recommendations
2. **Prompt Optimization**: Reduce token usage while maintaining quality
3. **Model Fine-tuning**: Custom wine-specific model training
4. **Edge Computing**: Deploy AI closer to users for speed
5. **Batch Processing**: Optimize multiple simultaneous requests