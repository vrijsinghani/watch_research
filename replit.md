# Chronos - Watch Market Analysis Platform

## Overview

Chronos is a luxury watch market analysis platform that leverages Google's Gemini Deep Research Agent to provide comprehensive pricing trends, market insights, and investment recommendations for high-end timepieces. The application allows users to search for specific watch models (by brand, model, and reference number), triggers AI-powered research to gather data from multiple sources (auction houses, marketplaces, dealers), and presents the results through an interactive dashboard with price charts, market metrics, and extracted sales data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Charts**: Recharts for price trend visualizations
- **Animations**: Framer Motion for UI transitions
- **Design Theme**: Dark luxury aesthetic with gold accent colors (Cinzel display font, Inter body font)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Build Tool**: esbuild for server bundling, Vite for client
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Development**: Hot module replacement via Vite middleware

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client/server)
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Main Tables**:
  - `watch_analyses`: Core entity for watch market analysis records
  - `market_data_points`: Individual listings/sales data linked to analyses
  - `data_sources`: Configurable data source registry (auction houses, marketplaces)

### AI Integration
- **Provider**: Google Gemini (`@google/genai` SDK)
- **Model**: gemini-2.5-pro (Deep Research Agent)
- **Purpose**: Web-based research to gather watch pricing data from multiple platforms
- **Flow**: Search → Create analysis record → Trigger research → Poll progress → Display results

### Key Design Patterns
- **Shared Schema**: TypeScript types and Zod validation schemas shared between frontend and backend via `@shared/*` path alias
- **Storage Interface**: `IStorage` abstraction in `server/storage.ts` enables swapping data backends
- **Research Pipeline**: Multi-stage process (researching → parsing → QA → cleanup → completed) with progress tracking
- **Path Aliases**: `@/*` for client source, `@shared/*` for shared code, `@assets/*` for attached assets

## External Dependencies

### Database
- **PostgreSQL**: Required, configured via `DATABASE_URL` environment variable
- **Connection**: Uses `pg` package with connection pooling

### AI/ML Services
- **Google Gemini API**: Requires `GEMINI_API_KEY` environment variable for Deep Research functionality
- **Token Costs**: Gemini 3 Pro pricing applies (input: $2-4/M tokens, output: $12-18/M tokens)

### Data Sources (Conceptual)
The platform is designed to aggregate data from:
- Auction houses (Christie's, Sotheby's)
- Marketplaces (Chrono24, eBay)
- Dealers (Bob's Watches)
- Price aggregators (WatchCharts)

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)
- **Type Checking**: TypeScript with strict mode enabled