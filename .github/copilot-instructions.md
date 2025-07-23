# Journal - AI Coding Assistant Instructions

## Project Overview
This is a **newspaper/content management system** built with **Nuxt 3**, **Supabase**, and **TailwindCSS**. The architecture supports article publishing, content curation ("La Veille"), user management, and AI-powered search with embeddings.

## Key Architecture Patterns

### Database & Data Layer
- **Supabase backend** with PostgreSQL + Row Level Security (RLS)
- **Type-safe database access** via generated `types/database.types.ts`
- **Composables pattern** for data operations in `composables/useDb.ts`
- **AI embeddings** for semantic search functionality

### Authentication & Authorization
- **Invite-only system** (signup disabled in supabase config)
- **Magic link authentication** for members
- **Role-based access**: `/internal/*` routes require authentication
- **Anonymous voting** system using persistent cookies (`anonymous_id`)

### Content Management
- **Rich text editing** with Tiptap editor
- **Document processing** via Pandoc WASM for ODT/DOCX/MD imports
- **Categories with icons** using Nuxt Icon (`mingcute:` prefix)
- **Draft/publish workflow** with featured articles support
- **File storage** in Supabase buckets for covers/attachments

## Critical Development Workflows

### Local Development
```bash
bun dev                    # Start development server
```

### Database Changes
- **Always use migrations** in `supabase/migrations/`
- **Update existing migration file but do not run it locally nor create new ones unless asked for**; instead, send a migration SQL command to the user to run manually against the already existing database.
- **Edge functions** in `supabase/functions/` for serverless operations

### Content Processing
- **Pandoc integration** for document imports (see `utils/pandoc.ts`)
- **Markdown support** with TiptapMarkdown extension
- **Metadata extraction** from URLs via `/api/metadata` endpoint

## Project-Specific Conventions

### Component Patterns
- **ArticleCard.vue**: Standard article display with categories and covers
- **TypeScript props** with `defineProps<{ article: ArticleWithCategories }>()`
- **Nuxt UI components** (UBadge, UButton) for consistent styling
- **Color scheme**: Amber primary (`bg-[var(--color-amber-150)]`), custom design system

### Routing & Layouts
- **File-based routing** with Nuxt conventions
- **Internal admin** at `/internal/*` (protected routes)
- **Dynamic slugs** for articles and categories
- **Responsive layouts**: Desktop header, mobile footer

### Data Patterns
- **Composable functions** return typed objects (e.g., `ArticleWithCategories`)
- **Real-time subscriptions** using Supabase realtime
- **Vote aggregation** with computed counts, not stored totals
- **Anonymous user handling** via cookie-based identification

### Edge Functions
- **CORS handling** via shared `_shared/cors.ts`
- **AI search** using Supabase AI with embeddings
- **Webhook integrations** (HelloAsso, email notifications)

## Integration Points

### External Services
- **Vercel Analytics** integrated in `app.vue`
- **YouTube API** for metadata extraction in link processing
- **Email templates** in `supabase/templates/` for auth flows
- **Supabase AI** for semantic search and embeddings

### Content Flow
1. **Articles**: Draft → Review → Publish → Featured (optional)
2. **La Veille**: Link submission → Vote aggregation → Editorial curation
3. **Issues**: Publication grouping with article associations
4. **Categories**: Icon-tagged organization with many-to-many relationships

### Search & Discovery
- **Vector search** via edge function with similarity thresholds
- **Category filtering** with dynamic badge generation
- **Featured content** promotion on homepage
- **Real-time voting** without page refreshes

## File Organization
- `composables/`: Reusable business logic (database, filters, document processing)
- `components/`: Vue components following atomic design principles
- `pages/`: File-based routing with nested structures for admin areas
- `server/api/`: Nuxt server endpoints for metadata and utilities
- `supabase/`: Database schema, functions, and configuration
- `types/`: TypeScript definitions, primarily generated database types, do NOT modify manually

When implementing features, prioritize type safety, follow the composables pattern for data access, and maintain the clean separation between public content display and internal admin functionality. Ensure you always use optimized NuxtJS patterns for performance and maintainability.
