# Quick Setup Guide for Pourtrait

## Overview

This guide will get you from zero to deployed in the fastest way possible. Most services can be configured automatically via CLI/SDK.

## 🚀 Automated Setup (5 minutes)

Run the automated setup script:

```bash
./scripts/setup-services.sh
```

This will automatically configure:
- ✅ **Supabase** - Database, authentication, storage
- ✅ **Vercel** - Hosting, deployment, environment variables  
- ✅ **Application Secrets** - JWT tokens, CRON secrets
- ✅ **Push Notifications** - VAPID keys generation
- ✅ **Environment Variables** - Complete .env.local file

## 🔧 Manual Setup Required (10 minutes)

After running the automated setup, you'll need to manually configure these APIs:

### 1. OpenAI API (Required for AI features)
```bash
# Go to: https://platform.openai.com/api-keys
# Create API key, then update .env.local:
OPENAI_API_KEY=sk-your_actual_key_here
```

### 2. Google Vision API (Required for wine label scanning)
```bash
# Go to: https://console.cloud.google.com/
# Enable Vision API, create API key, then update .env.local:
GOOGLE_VISION_API_KEY=your_actual_key_here
```

### 3. Resend Email API (Required for notifications)
```bash
# Go to: https://resend.com/
# Create account, get API key, then update .env.local:
RESEND_API_KEY=re_your_actual_key_here
```

## 🎯 Optional Services (can add later)

These enhance the app but aren't required for launch:

### Error Tracking (Recommended)
```bash
# Sentry: https://sentry.io/
SENTRY_DSN=https://your_sentry_dsn_here
```

### Analytics (Recommended)
```bash
# PostHog: https://posthog.com/
POSTHOG_API_KEY=phc_your_posthog_key_here
```

### Vector Database (Better AI recommendations)
```bash
# Pinecone: https://pinecone.io/
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX_NAME=wine-recommendations
```

### Caching (Better performance)
```bash
# Upstash Redis: https://upstash.com/
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Team Notifications
```bash
# Slack webhook for alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook
```

## 🚀 Deploy to Production

Once your .env.local is configured:

```bash
# 1. Test locally
npm run build
npm run dev

# 2. Deploy to production
git add .
git commit -m "Initial production setup"
git push origin main

# 3. Verify deployment
npm run verify:production
```

## 📋 Service Setup Checklist

### Core Services (Required)
- [ ] **Supabase** - Automated via script
- [ ] **Vercel** - Automated via script  
- [ ] **OpenAI API** - Manual setup required
- [ ] **Google Vision API** - Manual setup required
- [ ] **Resend Email** - Manual setup required

### Enhanced Services (Optional)
- [ ] **Sentry** - Error tracking
- [ ] **PostHog** - Analytics
- [ ] **Pinecone** - Vector database
- [ ] **Upstash Redis** - Caching
- [ ] **Slack** - Team notifications

## 🔧 CLI Commands Reference

```bash
# Full automated setup
./scripts/setup-services.sh

# Setup individual services
./scripts/setup-services.sh --supabase
./scripts/setup-services.sh --vercel
./scripts/setup-services.sh --env

# Verify configuration
npm run env:check

# Deploy
git push origin main

# Monitor
npm run monitor:production
```

## 🆘 Troubleshooting

### Common Issues

**"Supabase CLI not found"**
```bash
npm install -g supabase
```

**"Vercel CLI not found"**
```bash
npm install -g vercel
```

**"Environment variables not working"**
```bash
# Check .env.local exists and has correct values
cat .env.local | grep -v "your_"
```

**"Build failing"**
```bash
# Check for missing required environment variables
npm run env:check
```

### Getting Help

1. **Check the logs**: All scripts log to `/tmp/` with timestamps
2. **Verify environment**: Run `npm run env:check`
3. **Test individual services**: Use the health check endpoint
4. **Check documentation**: See `docs/05-operations/` for detailed guides

## 🎉 Success!

Once everything is set up, you should have:

- ✅ Supabase database with all tables and security policies
- ✅ Vercel deployment with automatic CI/CD
- ✅ All environment variables configured
- ✅ Monitoring and error tracking active
- ✅ Production-ready wine sommelier app!

Your app will be available at your Vercel URL and ready for users.

---

**Total Setup Time**: ~15 minutes  
**Automated**: ~5 minutes  
**Manual API Setup**: ~10 minutes  

**Next**: Start adding wines and testing the AI recommendations! 🍷