# Progressive Web App (PWA) Implementation

## Overview

Pourtrait implements comprehensive Progressive Web App capabilities to provide a native app-like experience across all devices. The PWA implementation focuses on offline functionality, push notifications, and seamless installation while maintaining the full feature set of the web application.

## Features

### Core PWA Capabilities

- **App Installation**: One-click installation on mobile and desktop devices
- **Offline Functionality**: Core wine inventory features work without internet connection
- **Push Notifications**: Drinking window alerts and recommendation notifications
- **App-like Experience**: Standalone display mode with custom splash screen
- **Responsive Design**: Optimized for mobile, tablet, and desktop usage

### Offline-First Architecture

The PWA implements an offline-first approach for critical wine management features:

- Wine inventory browsing and searching
- Adding new wines to inventory (synced when online)
- Viewing wine details and drinking windows
- Basic AI recommendations using cached data
- Consumption tracking and notes

## Technical Implementation

### Service Worker Configuration

The PWA uses `next-pwa` with custom caching strategies:

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Static assets caching
    // API response caching
    // Image caching
  ]
})
```

### Caching Strategies

1. **Static Assets**: Cache-first strategy for images, fonts, and CSS
2. **API Responses**: Network-first with fallback to cache for wine data
3. **User Data**: IndexedDB storage for offline access
4. **Images**: Stale-while-revalidate for wine photos

### Offline Data Management

#### IndexedDB Storage

The offline cache service uses IndexedDB for persistent storage:

- **Wine Inventory**: Complete wine collection with metadata
- **User Preferences**: Taste profiles and settings
- **Recommendations**: Cached AI recommendations
- **Sync Queue**: Pending operations for when connection returns

#### Data Synchronization

```typescript
// Automatic sync when connection restored
useEffect(() => {
  if (isOnline && hasPendingSync) {
    syncPendingChanges()
  }
}, [isOnline, hasPendingSync])
```

## Installation Experience

### App Manifest

The PWA manifest provides rich installation metadata:

```json
{
  "name": "Pourtrait - AI Wine Sommelier",
  "short_name": "Pourtrait",
  "display": "standalone",
  "theme_color": "#7c2d12",
  "background_color": "#fef7f0",
  "icons": [...],
  "shortcuts": [...]
}
```

### Installation Prompts

- **Automatic Prompt**: Appears after 3 seconds for eligible users
- **Manual Button**: Available in navigation for immediate installation
- **Smart Timing**: Avoids interrupting critical user flows

### App Shortcuts

Quick actions available from the home screen:

1. **Add Wine**: Direct access to wine entry form
2. **Recommendations**: Jump to AI sommelier chat
3. **Scan Label**: Open camera for wine label scanning

## Push Notifications

### Notification Types

1. **Drinking Window Alerts**: When wines enter optimal drinking period
2. **Recommendation Updates**: New personalized wine suggestions
3. **Inventory Reminders**: Prompts to update wine collection

### Implementation

```typescript
// Push notification service
const subscription = await pushNotificationService.subscribe()
await pushNotificationService.showNotification({
  title: 'Wine Ready to Drink',
  body: `${wineName} is at peak drinking window`,
  actions: [
    { action: 'view', title: 'View Wine' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
})
```

### Privacy & Permissions

- **Opt-in Only**: Users must explicitly enable notifications
- **Granular Control**: Separate settings for different notification types
- **Easy Unsubscribe**: One-click notification disabling

## Offline Functionality

### Core Features Available Offline

#### Wine Inventory Management
- Browse complete wine collection
- View wine details and drinking windows
- Add new wines (synced when online)
- Update wine quantities and notes
- Search and filter inventory

#### Basic Recommendations
- Access cached AI recommendations
- View food pairing suggestions
- Browse recommendation history

#### User Experience
- Full navigation and interface
- Offline status indicators
- Sync progress feedback
- Error handling and recovery

### Limitations When Offline

- No new AI chat conversations
- Limited wine database lookups
- No real-time recommendation updates
- No image recognition for new wines

## Performance Optimizations

### Caching Strategy

1. **Critical Resources**: Cached immediately on first visit
2. **Wine Images**: Lazy loaded and cached on demand
3. **API Responses**: Cached with appropriate TTL values
4. **Static Assets**: Long-term caching with version invalidation

### Bundle Optimization

- **Code Splitting**: Separate bundles for different features
- **Lazy Loading**: Non-critical components loaded on demand
- **Image Optimization**: WebP/AVIF formats with fallbacks
- **Service Worker**: Minimal runtime for fast startup

## Testing Strategy

### PWA Functionality Tests

```typescript
// Installation prompt testing
it('should show install prompt after delay', async () => {
  render(<PWAInstallPrompt />)
  jest.advanceTimersByTime(3000)
  expect(screen.getByText('Install Pourtrait')).toBeInTheDocument()
})

// Offline functionality testing
it('should work offline with cached data', async () => {
  mockNetworkStatus(false)
  const wines = await offlineService.getCachedWines(userId)
  expect(wines).toBeDefined()
})
```

### Cross-Platform Testing

- **Mobile Browsers**: Safari, Chrome, Firefox on iOS/Android
- **Desktop Browsers**: Chrome, Firefox, Safari, Edge
- **Installation Testing**: Verify install prompts and app behavior
- **Offline Testing**: Confirm functionality without network

## Browser Support

### PWA Features Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| App Manifest | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ✅ | ⚠️ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️ | ✅ |
| Offline Storage | ✅ | ✅ | ✅ | ✅ |

⚠️ = Limited or different implementation

### Graceful Degradation

- **Unsupported Browsers**: Full web app functionality maintained
- **Limited PWA Support**: Core features work without PWA enhancements
- **Feature Detection**: Progressive enhancement based on capabilities

## Deployment Considerations

### Vercel Configuration

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### Environment Variables

Required environment variables for PWA functionality:

```bash
# Push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
PUSH_API_KEY=your_internal_api_key

# App configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Security Considerations

- **HTTPS Required**: PWA features only work over secure connections
- **VAPID Keys**: Secure storage of push notification keys
- **API Authentication**: Secure endpoints for push notification management
- **Data Encryption**: Sensitive data encrypted in IndexedDB

## Monitoring & Analytics

### PWA Metrics

Track key PWA performance indicators:

- **Installation Rate**: Percentage of users who install the app
- **Offline Usage**: Time spent using app without connection
- **Push Engagement**: Notification open and click rates
- **Sync Success**: Offline operation synchronization rates

### Performance Monitoring

```typescript
// Service worker performance tracking
self.addEventListener('fetch', (event) => {
  const start = performance.now()
  // Handle request
  const duration = performance.now() - start
  // Log performance metrics
})
```

## Troubleshooting

### Common Issues

#### Installation Not Available
- Verify HTTPS connection
- Check manifest.json validity
- Ensure service worker registration
- Confirm browser PWA support

#### Offline Functionality Not Working
- Verify service worker activation
- Check IndexedDB permissions
- Confirm caching strategy implementation
- Test network detection logic

#### Push Notifications Not Received
- Verify VAPID key configuration
- Check notification permissions
- Confirm subscription registration
- Test notification payload format

### Debug Tools

- **Chrome DevTools**: Application tab for PWA debugging
- **Lighthouse**: PWA audit and performance analysis
- **Service Worker Inspector**: Monitor SW lifecycle and caching
- **Network Tab**: Verify offline functionality

## Future Enhancements

### Planned Improvements

1. **Background Sync**: Automatic data synchronization
2. **Web Share API**: Share wine recommendations
3. **File System Access**: Export wine inventory
4. **Periodic Background Sync**: Regular data updates
5. **Advanced Caching**: ML-based cache optimization

### Experimental Features

- **Web Bluetooth**: Connect to wine storage sensors
- **WebRTC**: Peer-to-peer wine sharing
- **WebAssembly**: Client-side wine analysis
- **Payment Request API**: In-app wine purchases