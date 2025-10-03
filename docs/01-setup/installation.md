# Installation Guide

Complete installation guide for Pourtrait AI Wine Sommelier.

## Prerequisites

- Node.js 18.18.0 or higher
- npm 9.0.0 or higher
- Git
- Code editor (VS Code recommended)

## One-Command Setup (Recommended)

If you have Node.js 18+ installed, run:

```bash
chmod +x setup.sh && ./setup.sh
```

This will:
- ✅ Install all dependencies
- ✅ Set up environment files
- ✅ Run type checking and tests
- ✅ Build the project
- ✅ Verify everything works

## Manual Setup (Step by Step)

### 1. Install Node.js

Choose one of the following methods:

#### Option A: Using nvm (Recommended)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload terminal or run:
source ~/.nvm/nvm.sh

# Install Node.js
nvm install 18.18.0
nvm use 18.18.0
```

#### Option B: Using Homebrew (macOS)
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18
```

#### Option C: Direct Download
- Visit [nodejs.org](https://nodejs.org/)
- Download Node.js 18.18.0 LTS
- Run the installer

### 2. Verify Installation
```bash
node --version  # Should show v18.18.0 or higher
npm --version   # Should show 9.0.0 or higher
```

### 3. Install Project Dependencies
```bash
npm install
```

### 4. Set Up Environment Variables
```bash
# Copy the template
cp .env.local.example .env.local

# Edit with your values
nano .env.local  # or use your preferred editor
```

### 5. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## What's Already Configured

✅ **Next.js 14** with TypeScript and App Router  
✅ **Tailwind CSS** with wine-inspired design system  
✅ **ESLint + Prettier** for code quality  
✅ **Vitest** testing framework with example tests  
✅ **Supabase** client configuration  
✅ **Professional folder structure** following Next.js best practices  
✅ **CI/CD pipeline** with GitHub Actions  
✅ **Vercel deployment** configuration  
✅ **TypeScript strict mode** with proper type definitions  

## Available Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted
npm run type-check   # Run TypeScript type checking

# Testing
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
```

## Next Steps

After installation, see:
- [../02-development/README.md](../02-development/README.md) for development guidelines
- [troubleshooting.md](./troubleshooting.md) for common issues