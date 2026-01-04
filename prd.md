# Chronos - Product Requirements Document

## Overview

Chronos is a luxury watch market intelligence platform that aggregates pricing data from auction houses, marketplaces, and dealers worldwide. It uses Google Gemini Deep Research Agent to perform comprehensive web-based analysis, extracting structured sales data with full provenance and rich market insights to provide investors and collectors with actionable intelligence.

---

## Core Value Proposition

Users can search for any luxury watch by brand, model, and reference number. The platform then:
1. Triggers an AI-powered research agent that crawls multiple data sources
2. Extracts structured sales/listing data with dates, prices, conditions, and source URLs
3. Parses rich market insights including price statistics, trends, and condition-based pricing
4. Presents results through an interactive dashboard with charts, metrics, and exportable reports

---

## Target Users

- Watch collectors evaluating potential purchases
- Investors analyzing watch market trends
- Dealers researching competitive pricing
- Enthusiasts tracking specific models

---

## Feature Requirements

### 1. Search & Analysis Initiation

**Search Page** (`/`)
- Single search input accepting natural language queries
- Examples: "Rolex Daytona 126509", "Patek Philippe Nautilus 5712"
- Query parser that extracts brand, model, and reference number
- Known brand aliases supported: "AP" → "Audemars Piguet", "JLC" → "Jaeger-LeCoultre"
- Quick search buttons for popular watches
- Hero background image with luxury watch aesthetic

**Search Flow:**
1. User enters query
2. System parses query into brand/model/reference
3. Creates analysis record in database
4. Triggers background research (non-blocking)
5. Redirects to dashboard with loading state

### 2. AI Research Engine

**Deep Research Service**
- Provider: Google Gemini (`@google/genai` SDK)
- Model: `gemini-2.5-pro` (Deep Research Agent)
- Research duration: 2-10 minutes typical
- Maximum wait time: 60 minutes
- Poll interval: 10 seconds

**Research Prompt Requirements:**
The prompt instructs the AI to gather:
- Recent completed sale prices from auction houses (Christie's, Sotheby's, Phillips, Bonhams)
- Marketplace data (Chrono24, WatchBox, eBay, Hodinkee)
- Dealer listings (Bob's Watches, Govberg, Crown & Caliber)
- Private sales from forums (RolexForums, WatchUSeek)

**Required Data Fields per Record:**
- Exact date (e.g., "May 20, 2024")
- Source with specificity (e.g., "Phillips Geneva Watch Auction XIV")
- Listing ID, lot number, or reference
- Seller/dealer name when known
- Watch year/production date
- Direct URL to source when possible
- Price and currency
- Condition description
- Price type (Sold, Asking, Bid)

**Structured Report Format:**
The AI must return a markdown report with these sections:
1. Executive Summary
2. Price Statistics (MSRP, Avg Sold, Median Sold, Sold Range, Avg Asking, Asking Range, Spread, Trend)
3. Condition-Based Pricing (table with condition tiers and price ranges)
4. Recent Completed Sales (table with Date, Price, Condition, Source, Seller/Lot, Notes)
5. Current Listings (table format)
6. Price Trends (narrative analysis)
7. Market Analysis (factors affecting prices)
8. Special Editions and Variants
9. Sources/Bibliography

**Research Pipeline Stages:**
1. `pending` - Initial state
2. `researching` - Gemini Deep Research executing
3. `parsing` - Extracting structured data from report
4. `qa` - Quality assurance validation
5. `cleanup` - Data normalization and deduplication
6. `completed` - Success
7. `failed` - Error occurred

### 3. Research Parser

**Table Data Extraction:**
- Parse markdown tables from research report
- Extract rows matching pattern: Date | Price | Condition | Source | Seller/Lot | Notes
- Determine price type (Sold vs Asking) from section headers
- Filter invalid prices (< $100)

**Price Parsing Rules:**
- Must have `$` sign before number
- Minimum value threshold: $1,000 for luxury watches
- Parse within specific section for accuracy
- Handle markdown formatting: `**$9,850**`, `~$10,000`

**Date Parsing:**
- Support formats: "May 20, 2024", "Apr 2024", "2024-05-20"
- Handle various separators and month abbreviations

**Source Categorization:**
- Auction: Christie's, Sotheby's, Phillips, Bonhams
- Marketplace: Chrono24, WatchBox, eBay, Hodinkee, EveryWatch
- Dealer: Bob's Watches, Govberg, Crown & Caliber, DavidSW, JazTime
- Private: Forums, private sales

**Condition Normalization:**
- BNIB, Brand New → "New/Unworn"
- Mint, Unworn → "New/Unworn"
- Excellent → "Pre-Owned (Excellent)"
- Good → "Pre-Owned (Good)"
- Fair → "Pre-Owned (Fair)"

### 4. Quality Assurance

**Heuristic Checks:**
- Minimum data points: At least 5 sales for reliable analysis
- Price reasonableness: Flag outliers > 3x or < 0.33x average
- Source diversity: At least 3 unique sources preferred
- Balance: Both sold and asking prices needed
- Report completeness: Must have Executive Summary and Price Statistics

**Data Quality Score (0-100):**
- Deductions for issues found
- Score >= 60 = passed
- Includes issues array and suggestions array

**Cleanup Operations:**
- Remove duplicates (same price/source/condition)
- Normalize condition strings
- Remove extreme outliers (> 5x or < 0.2x median)
- Standardize source names

### 5. Dashboard

**Dashboard Page** (`/dashboard/:id`)

**Header Section:**
- Watch name (Brand + Model)
- Reference number
- Research status badge
- Liquidity score badge
- Share button
- Export PDF button

**Research Progress View (shown while researching):**
- Animated progress indicator
- Status message
- Progress bar (0-100%)
- Estimated time display
- Explanation of what's happening

**Market Intelligence Briefing Card:**
- Executive summary with key findings
- Confidence score (0-100) with reliability label
- Analyst consensus (BUY/HOLD/SELL)
- Volatility indicator (Low/Medium/High)

**Metrics Grid (4 cards):**
1. Global Market Price - Average sold price from actual transactions
2. Data Points - Total sales and listings analyzed
3. Sold Records - Number of completed transactions
4. Active Listings - Current market offerings

**Price Chart:**
- Area chart showing price distribution over time
- Sold prices (green)
- Asking prices (blue)
- Interactive tooltips with details
- Powered by Recharts

**Source Composition:**
- Pie chart showing distribution by source type
- Auction / Marketplace / Dealer / Private breakdown

**Price Statistics Section:**
- Official MSRP
- Average Sold Price
- Median Sold Price
- Average Asking Price
- Sold Price Range
- Asking vs Sold Spread percentage
- Recent Trend indicator

**Condition-Based Pricing Table:**
- Rows for each condition tier
- Sold price range column (green)
- Asking price range column (blue)
- Notes column

**Rich Content Sections (rendered as markdown):**
- Price Trends - Full narrative with formatting
- Market Analysis - Key factors and drivers
- Special Editions - Variants information

**Sources/Bibliography:**
- Links to original sources
- Source descriptions

**Data Tables:**
- Completed Sales table with all extracted records
- Current Listings table

### 6. History Page

**History Page** (`/history`)
- List of all completed analyses
- Each card shows:
  - Watch name and reference
  - Time since analysis
  - Market price (calculated from sold transactions)
  - Confidence score
  - Research status
- Expandable research logs for debugging
- Click to navigate to dashboard
- "New Search" button

### 7. Settings Page

**Settings Page** (`/settings`)
- Data source management
- Each source shows:
  - Name and type (Auction/Marketplace/Dealer)
  - Description
  - Status (Active/Syncing/Inactive)
  - Last sync time
  - Record count
  - Toggle switch to enable/disable
- System status summary

### 8. PDF Export

**Export Requirements:**
- Professional dark theme (background: #121214)
- Gold header bar (#D4AF37)
- CHRONOS branding with date
- Watch name and reference
- Sections:
  - Executive Summary
  - Condition-Based Pricing
  - Price Trends
  - Market Analysis
  - Market Data Summary (calculated stats)
- Multi-page support with page numbers
- Footer branding on each page
- Filename format: `Chronos_{Brand}_{Model}_{Reference}.pdf`

### 9. Navigation

**Sidebar Layout:**
- CHRONOS logo with watch icon
- Navigation items:
  - Market Search (/)
  - Analysis Dashboard (/dashboard)
  - History (/history)
  - Settings (/settings)
- Pro status indicator
- Mobile responsive with hamburger menu

---

## Data Model

### watch_analyses
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| brand | text | Watch brand (e.g., "Rolex") |
| model | text | Watch model (e.g., "Daytona") |
| reference | text | Reference number (e.g., "126509") |
| description | text | Additional description |
| marketPrice | real | Calculated average sold price |
| retailPrice | real | Official retail price |
| volatility | text | "Low", "Medium", "High" |
| liquidityScore | text | "Low", "Medium", "High" |
| confidenceScore | integer | 0-100 |
| analystConsensus | text | "BUY", "HOLD", "SELL" |
| executiveSummary | text | AI-generated summary |
| priceStatistics | jsonb | {msrp, avgSold, medianSold, etc.} |
| conditionPricing | jsonb | Array of condition tiers |
| priceTrends | text | Markdown narrative |
| marketAnalysis | text | Markdown narrative |
| specialEditions | text | Markdown narrative |
| sources | jsonb | Array of {name, url, description} |
| createdAt | timestamp | Record creation time |
| updatedAt | timestamp | Last update time |

### market_data_points
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| analysisId | varchar (FK) | Reference to watch_analyses |
| source | text | Source name (e.g., "Christie's") |
| sourceType | text | "Auction", "Marketplace", "Dealer", "Private" |
| price | real | Price in USD |
| currency | text | Currency code (default "USD") |
| priceType | text | "Sold", "Asking", "Bid" |
| condition | text | Condition description |
| description | text | Additional notes |
| location | text | Geographic location |
| listingUrl | text | Direct URL to listing |
| listingId | text | Lot number or item ID |
| seller | text | Seller/dealer name |
| watchYear | text | Year of watch production |
| saleDate | timestamp | Date of sale/listing |
| isVerified | boolean | Verification status |
| createdAt | timestamp | Record creation time |

### data_sources
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| name | text | Source name (unique) |
| type | text | "Auction", "Marketplace", "Dealer" |
| description | text | Source description |
| isEnabled | boolean | Whether source is active |
| status | text | "active", "inactive", "syncing", "error" |
| lastSyncAt | timestamp | Last sync time |
| recordCount | integer | Number of records |
| createdAt | timestamp | Record creation time |
| updatedAt | timestamp | Last update time |

### research_logs
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| analysisId | varchar (FK) | Reference to watch_analyses |
| status | text | "started", "completed", "failed" |
| prompt | text | Research prompt used |
| rawResponse | text | Full AI response |
| extractedCount | integer | Number of records extracted |
| durationSeconds | real | Research duration |
| errorMessage | text | Error details if failed |
| startedAt | timestamp | When research started |
| completedAt | timestamp | When research completed |

---

## API Endpoints

### Watch Analyses
- `GET /api/analyses` - List all analyses
- `GET /api/analyses/:id` - Get single analysis
- `POST /api/analyses` - Create new analysis
- `PATCH /api/analyses/:id` - Update analysis
- `DELETE /api/analyses/:id` - Delete analysis

### Market Data Points
- `GET /api/analyses/:analysisId/data-points` - Get data points for analysis
- `POST /api/analyses/:analysisId/data-points` - Create single data point
- `POST /api/analyses/:analysisId/data-points/bulk` - Bulk create data points

### Data Sources
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources` - Create data source
- `PATCH /api/data-sources/:id` - Update data source
- `PATCH /api/data-sources/:id/toggle` - Toggle enabled state

### Research
- `POST /api/analyses/:id/research` - Trigger deep research (async)
- `GET /api/analyses/:id/research/progress` - Get research progress

### Research Logs
- `GET /api/research-logs` - List all research logs

### Admin
- `POST /api/seed` - Seed initial data sources
- `POST /api/admin/backfill-prices` - Recalculate market prices from sold data

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight)
- **State Management**: TanStack React Query v5
- **UI Components**: shadcn/ui on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme
- **Charts**: Recharts
- **Animations**: Framer Motion
- **PDF Generation**: jsPDF
- **Markdown Rendering**: react-markdown
- **Date Formatting**: date-fns

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Build**: esbuild for server, Vite for client
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod with drizzle-zod
- **AI**: Google Gemini via @google/genai SDK

### Design System

**Color Palette:**
- Background: #121214 (near black)
- Card: #1a1a1d
- Primary: #D4AF37 (gold)
- Green (sold prices): #22c55e
- Blue (asking prices): #3b82f6
- Text: #ffffff / #a1a1aa (muted)

**Typography:**
- Display Font: Cinzel (serif, for headings)
- Body Font: Inter (sans-serif)

**Component Patterns:**
- Cards with subtle borders and gradients
- Gold accent bars for section headers
- Progress indicators with animations
- Badge variants for status indicators
- Responsive grid layouts

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| GEMINI_API_KEY | Google Gemini API key for research |
| PORT | Server port (default 5000) |

---

## Key Business Logic

### Market Price Calculation
```typescript
// Calculate from actual sold transactions, not parsed AI summary
const soldPrices = dataPoints
  .filter(d => d.priceType === "Sold" && d.price > 0)
  .map(d => d.price);
const marketPrice = soldPrices.length > 0 
  ? Math.round(soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length)
  : null;
```

### Price Parsing Validation
```typescript
// Require $ sign and minimum $1000 for luxury watches
const match = text.match(/\$\s*([\d,]+)/);
if (match) {
  const value = parseFloat(match[1].replace(/,/g, ""));
  if (value >= 1000) return value;
}
return null;
```

### Query Parsing
```typescript
// Support known brand aliases
const brandAliases = {
  "AP": "Audemars Piguet",
  "JLC": "Jaeger-LeCoultre"
};
// Extract reference patterns like "126509", "5712", "16610LN"
const refMatch = query.match(/\b([\d]{4,6}[A-Z]{0,3})\b/i);
```

---

## Testing Checklist

1. Search for "Rolex Submariner 16610" → Creates analysis, starts research
2. Progress polling updates every 3 seconds during research
3. Dashboard shows loading state while researching
4. Completed research shows all sections populated
5. Price chart renders with sold (green) and asking (blue) points
6. PDF export generates multi-page document with all sections
7. History page lists all analyses with calculated prices
8. Settings page shows data sources with toggle functionality
9. Mobile navigation works with hamburger menu
10. Error states display properly for failed research

---

## Future Enhancements (Placeholders in Code)

1. **Gemini-based QA validation** - Use AI to verify data consistency
2. **Currency conversion** - Handle non-USD prices
3. **Watch image search** - Find reference images
4. **Price alerts** - Notify when prices change
5. **Comparison tool** - Compare multiple watches
6. **Historical tracking** - Track price changes over time
7. **User accounts** - Save searches and preferences
8. **API rate limiting** - Prevent abuse
9. **Caching layer** - Cache common searches
10. **Webhook notifications** - Push updates to users

---

## File Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout.tsx          # Main layout with sidebar
│   │   │   ├── metric-card.tsx     # Reusable metric display
│   │   │   ├── price-chart.tsx     # Recharts price visualization
│   │   │   ├── listing-feed.tsx    # Market listings feed
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── search.tsx          # Home/search page
│   │   │   ├── dashboard.tsx       # Analysis dashboard
│   │   │   ├── history.tsx         # Research history
│   │   │   └── settings.tsx        # Data source settings
│   │   ├── lib/
│   │   │   ├── api.ts              # API client functions
│   │   │   └── utils.ts            # Utility functions
│   │   ├── hooks/
│   │   │   └── use-toast.ts        # Toast notifications
│   │   └── App.tsx                 # Router configuration
│   └── index.html                  # HTML entry with meta tags
├── server/
│   ├── index.ts                    # Express server setup
│   ├── routes.ts                   # API route handlers
│   ├── storage.ts                  # Database interface
│   └── services/
│       ├── deep-research.ts        # Gemini research service
│       ├── research-parser.ts      # Report parsing logic
│       └── research-qa.ts          # QA and cleanup
├── shared/
│   └── schema.ts                   # Drizzle schema & types
└── attached_assets/
    └── generated_images/           # Hero images
```

---

## Deployment Notes

- Frontend and backend served from same Express server
- Bind to `0.0.0.0:5000` for Replit compatibility
- Production build uses `serveStatic` for client assets
- Development uses Vite middleware for HMR
- Database migrations via `drizzle-kit push`

---

## Version History

- **v1.0** - Initial release with core research and dashboard
- **v1.1** - Added PDF export with professional formatting
- **v1.2** - Fixed price statistics parser (require $ sign, $1000 minimum)
- **v1.3** - Added market price backfill endpoint
- **v1.4** - Enhanced markdown rendering for rich content sections
