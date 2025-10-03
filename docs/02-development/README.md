# Development Documentation

This directory contains all development guidelines and practices for Pourtrait.

## Overview

Pourtrait follows modern React/Next.js development practices with strict TypeScript, comprehensive testing, and professional code quality standards.

## Documents in this section

- **[guidelines.md](./guidelines.md)** - Coding standards and best practices
- **[testing.md](./testing.md)** - Testing strategies and examples
- **[deployment.md](./deployment.md)** - Deployment procedures and CI/CD

## Quick Reference

### Daily Development Commands
```bash
npm run dev          # Start development server
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code quality
npm run type-check   # Verify TypeScript types
```

### Before Committing
```bash
npm run lint:fix     # Fix linting issues
npm run format       # Format code
npm run test         # Run all tests
npm run build        # Verify build works
```

## Key Principles

- **TypeScript First**: Strict typing throughout the application
- **Mobile First**: Responsive design starting with mobile
- **Professional Design**: No emojis, professional icons only
- **Test Driven**: Write tests alongside features
- **Performance Focused**: Optimize for Core Web Vitals

## Next Steps

- New to the project? Start with [guidelines.md](./guidelines.md)
- Setting up tests? See [testing.md](./testing.md)
- Ready to deploy? Check [deployment.md](./deployment.md)