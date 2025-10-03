// Core UI Components
export { Button, buttonVariants } from './Button'
export type { ButtonProps } from './Button'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './Card'
export type { CardProps } from './Card'

export { Input } from './Input'
export type { InputProps } from './Input'

export { Badge, badgeVariants } from './Badge'
export type { BadgeProps } from './Badge'

export { Alert, AlertTitle, AlertDescription } from './Alert'
export type { AlertProps } from './Alert'

export { Icon, iconRegistry, getAvailableIcons } from './Icon'
export type { IconProps, IconName } from './Icon'

export { CameraCapture } from './CameraCapture'
export { ImageUpload } from './ImageUpload'

// Error Handling Components
export { ErrorBoundary, useErrorHandler } from './ErrorBoundary'
export { ErrorAlert } from './ErrorAlert'

// Loading Components
export { LoadingSpinner } from './LoadingSpinner'
export { LoadingState, WineCardSkeleton, ChatMessageSkeleton, RecommendationSkeleton } from './LoadingState'
export { AsyncOperationWrapper, AIOperationWrapper, ImageProcessingWrapper, DataOperationWrapper } from './AsyncOperationWrapper'

// PWA Components
export { PWAInstallPrompt, PWAInstallButton } from './PWAInstallPrompt'
export { OfflineIndicator, OfflineStatusBadge, useNetworkStatus } from './OfflineIndicator'

// Re-export variant types for external use
export type { 
  ButtonVariants, 
  CardVariants, 
  InputVariants, 
  BadgeVariants, 
  AlertVariants 
} from '@/lib/design-system/variants'