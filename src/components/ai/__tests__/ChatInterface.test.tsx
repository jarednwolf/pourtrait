import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'

// Mock the hooks
const mockSendMessage = vi.fn()
const mockClearChat = vi.fn()
const mockSubmitFeedback = vi.fn()

vi.mock('@/hooks/useAIRecommendations', () => ({
  useAIChat: () => ({
    messages: [],
    loading: false,
    error: null,
    conversationId: 'test-conversation',
    sendMessage: mockSendMessage,
    submitFeedback: mockSubmitFeedback,
    clearChat: mockClearChat,
    removeMessage: vi.fn(),
    startNewConversation: vi.fn(),
    getConversationContext: vi.fn(),
    isAuthenticated: true
  })
}))

// Mock UI components
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}))

vi.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  )
}))

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  )
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>
}))

// Mock the chat components
vi.mock('../ChatMessage', () => ({
  ChatMessage: ({ message }: any) => <div data-testid="chat-message">{message.content}</div>
}))

vi.mock('../ChatSuggestions', () => ({
  ChatSuggestions: ({ onSuggestionSelect }: any) => (
    <div data-testid="chat-suggestions">
      <button onClick={() => onSuggestionSelect('What should I drink tonight?')}>
        What should I drink tonight?
      </button>
    </div>
  )
}))

vi.mock('../TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">AI is typing...</div>
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat interface for authenticated users', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText('AI Sommelier')).toBeInTheDocument()
    expect(screen.getByText('Your personal wine expert')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask me about wine/)).toBeInTheDocument()
  })

  it('shows welcome message when no messages exist', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText('Welcome to your AI Sommelier')).toBeInTheDocument()
    expect(screen.getByText(/Ask me anything about wine/)).toBeInTheDocument()
  })

  it('allows users to type and send messages', async () => {
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText(/Ask me about wine/)
    const sendButton = screen.getByTestId('icon-arrow-right').closest('button')
    
    fireEvent.change(input, { target: { value: 'What wine should I drink tonight?' } })
    fireEvent.click(sendButton!)
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('What wine should I drink tonight?')
    })
  })

  it('renders basic chat interface elements', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText('AI Sommelier')).toBeInTheDocument()
    expect(screen.getByText('Your personal wine expert')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask me about wine/)).toBeInTheDocument()
  })
})