# Pourtrait - AI Wine Sommelier

Pourtrait is an AI-powered personal wine cellar and sommelier web application designed to revolutionize how wine lovers of all experience levels manage their collections and discover new wines.

## Features

- **Smart Wine Inventory**: Manage your wine collection with automated data entry via image recognition
- **AI Sommelier**: Get personalized wine recommendations based on your taste profile
- **Mobile-First Design**: Optimized for mobile use with PWA capabilities
- **Food Pairing**: Intelligent meal-based wine pairing recommendations
- **Drinking Window Alerts**: Never miss the perfect time to enjoy your wines
- **Restaurant Wine Lists**: Scan and get recommendations from restaurant wine lists

## Quick Start

### One-Command Setup
```bash
chmod +x setup.sh && ./setup.sh
```

### Manual Setup
```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Documentation

Complete documentation is available in the `docs/` directory. A sample `.env.local.example` has been added to the repo root to simplify environment setup. Use it to populate your Vercel production environment variables.

- **[Setup & Installation](./docs/01-setup/README.md)** - Getting started, requirements, troubleshooting
- **[Development](./docs/02-development/README.md)** - Coding guidelines, testing, deployment
- **[Architecture](./docs/03-architecture/README.md)** - System design, database schema, API reference
- **[Features](./docs/04-features/README.md)** - Feature documentation and user guides
- **[Operations](./docs/05-operations/README.md)** - Monitoring, backup, performance optimization

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4, Vector embeddings
- **Deployment**: Vercel
- **Testing**: Vitest, React Testing Library

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Check code quality
npm run type-check   # Verify TypeScript
```

## Project Status

✅ **Foundation Complete** - Production-ready Next.js setup  
🚧 **In Development** - Core wine management features  
📋 **Planned** - AI sommelier integration  

## Design Principles

- **Professional Design**: No emojis, sophisticated wine-inspired aesthetics
- **Mobile-First**: Responsive design optimized for mobile devices
- **Type Safety**: Strict TypeScript throughout the application
- **Performance**: Optimized for Core Web Vitals and Lighthouse scores

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the [development guidelines](./docs/02-development/guidelines.md)
4. Submit a pull request

## License

This project is licensed under the MIT License.