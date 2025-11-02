# Technical Requirements

Complete technical requirements and dependencies for Pourtrait.

## System Requirements

### Development Environment
- **Node.js**: 18.18.0+ (LTS recommended)
- **Package Manager**: npm 9+ or yarn 1.22+
- **Operating System**: macOS, Linux, or Windows with WSL2
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 2GB free space for dependencies and build artifacts

### Required Tools
- **Git**: Version control
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - Auto Rename Tag

## Core Dependencies

### Framework & Runtime
```json
{
  "next": "14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.3"
}
```

### Styling & UI
```json
{
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.2.0"
}
```

### Backend & Database
```json
{
  "@supabase/supabase-js": "^2.38.5",
  "@supabase/ssr": "^0.4.0"
}
```

### Validation & Utilities
```json
{
  "zod": "^3.22.4"
}
```

### Development Tools
```json
{
  "eslint": "^8.56.0",
  "eslint-config-next": "14.0.4",
  "@typescript-eslint/eslint-plugin": "^6.17.0",
  "@typescript-eslint/parser": "^6.17.0",
  "prettier": "^3.1.1",
  "prettier-plugin-tailwindcss": "^0.5.9"
}
```

### Testing Framework
```json
{
  "vitest": "^1.1.3",
  "@vitejs/plugin-react": "^4.2.1",
  "@testing-library/react": "^14.1.2",
  "@testing-library/jest-dom": "^6.2.0",
  "@testing-library/user-event": "^14.5.1",
  "jsdom": "^23.0.1"
}
```

## External Services

### Required Services
1. **Supabase** (Database & Auth)
   - PostgreSQL database
   - Authentication service
   - File storage
   - Real-time subscriptions

2. **OpenAI** (AI Sommelier)
   - GPT-4 API access
   - Text embeddings API
   - Image analysis (future)

3. **Vercel** (Deployment)
   - Hosting platform
   - Serverless functions
   - Edge network
   - Analytics

### Optional Services
1. **Google Vision API** (Image Recognition)
   - Wine label recognition
   - OCR for wine lists

2. **Resend** (Email Service)
   - Transactional emails
   - Notifications

3. **Wine Database APIs**
   - Wine.com API
   - Vivino API
   - Wine-Searcher API

## Environment Variables

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Optional
```bash
# Image Processing
GOOGLE_VISION_API_KEY=your_google_vision_api_key

# Wine APIs
WINE_API_KEY=your_wine_database_api_key

# Email
RESEND_API_KEY=your_resend_api_key
```

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Bundle Size
- **Initial Bundle**: < 200KB gzipped
- **Total JavaScript**: < 500KB gzipped
- **Images**: WebP format, optimized sizes

### Lighthouse Scores
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

## Security Requirements

### Authentication
- Supabase Auth with Row Level Security (RLS)
- JWT token validation
- Secure session management
- Password strength requirements

### Data Protection
- HTTPS everywhere
- Environment variable security
- Input validation with Zod
- SQL injection prevention via Supabase

### API Security
- Rate limiting
- CORS configuration
- API key protection
- Error message sanitization

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

## Next Steps

After reviewing requirements, see [installation.md](./installation.md) for setup instructions.