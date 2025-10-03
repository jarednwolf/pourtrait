import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock the hooks with more realistic behavior
const mockSendMessage = vi.fn()
const mockGetAccessToken = vi.fn()

vi.mock('@/hooks/useAIRecommendations', () => ({
  useAIChat: () => ({
    messages: [],
    loading: false,
    error: null,
    conversationId: 'test-conversation',
    sendMessage: mockSendMessage,
    submitFeedback: vi.fn(),
    clearChat: vi.fn(),
    removeMessage: vi.fn(),
    startNewConversation: vi.fn(),
    getConversationContext: vi.fn(),
    isAuthenticated: true
  })
}))

// Mock UI components
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
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

describe('ChatInterface Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAccessToken.mockResolvedValue('mock-token')
    
    // Mock successful API response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          message: 'I recommend a nice Pinot Noir for tonight.',
          confidence: 0.85,
          validationPassed: true,
          experienceLevel: 'intermediate'
        }
      })
    } as Response)
  })

  it('should handle complete chat flow', async () => {
    render(<ChatInterface />)
    
    // Verify initial state
    expect(screen.getByText('Welcome to your AI Sommelier')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask me about wine/)).toBeInTheDocument()
    
    // Type a message
    const input = screen.getByPlaceholderText(/Ask me about wine/)
    fireEvent.change(input, { target: { value: 'What wine should I drink tonight?' } })
    
    // Send the message
    const sendButton = screen.getByTestId('icon-arrow-right').closest('button')
    fireEvent.click(sendButton!)
    
    // Verify sendMessage was called
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('What wine should I drink tonight?')
    })
    
    // Verify input is cleared
    expect(input).toHaveValue('')
  })

  it('should handle suggestion clicks', async () => {
    render(<ChatInterface />)
    
    // Click on a suggestion
    const suggestion = screen.getByText('What should I drink tonight?')
    fireEvent.click(suggestion)
    
    // Verify sendMessage was called with the suggestion
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('What should I drink tonight?')
    })
  })

  it('should prevent sending empty messages', () => {
    render(<ChatInterface />)
    
    const sendButton = screen.getByTestId('icon-arrow-right').closest('button')
    
    // Button should be disabled when input is empty
    expect(sendButton).toBeDisabled()
    
    // Type something
    const input = screen.getByPlaceholderText(/Ask me about wine/)
    fireEvent.change(input, { target: { value: 'test message' } })
    
    // Button should now be enabled
    expect(sendButton).not.toBeDisabled()
  })

  it('should handle keyboard shortcuts', async () => {
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText(/Ask me about wine/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    
    // Press Enter to send
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  it('should not send on Shift+Enter', () => {
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText(/Ask me about wine/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    
    // Press Shift+Enter (should not send)
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true })
    
    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})