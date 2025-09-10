# CLAUDE.md

## Feature Development Workflow

### Structured Feature Planning
When Claude Code encounters work that would benefit from structured planning, it will:
1. Detect complexity and suggest feature breakdown
2. Ask planning questions directly in chat
3. Generate organized feature and task structure
4. Provide individual copy/paste blocks for Linear/GitHub issues
5. Create organized files in .claude/features/

### Complexity Detection
Claude should suggest feature planning when requests involve:
- Multiple components (UI + API + database)
- External integrations or new infrastructure
- Complex UI with multiple views/states
- Estimated effort >5 story points or >3 days
- Cross-domain functionality
- Business logic or workflow automation

### Feature Planning Process

#### Step 1: Detection and Suggestion
When complex work is detected, respond:

"This appears to be feature-level work involving [specific complexity factors]. I can create a structured breakdown with individual copy/paste blocks for Linear and GitHub.

Would you like me to create a structured feature breakdown? I'll ask a few planning questions and generate organized tasks with ready-to-use issue content."

#### Step 2: Interactive Planning Questions
If user agrees, ask these questions **one at a time, waiting for each response**:

1. "**Feature Name**: What should we call this feature?"
2. "**User Story**: Complete this - 'As a [user type], I want [capability] so that [benefit]'"
3. "**Primary Domain**: Which domain? (cases/appointments/communications/auth/analytics/dashboard/mobile/other)"
4. "**Acceptance Criteria**: What are the key requirements? (List the main things it must do)"
5. "**Story Points**: Estimated complexity? (3/5/8/13/21)"
6. "**Dependencies**: Any technical or business dependencies?"
7. "**Priority**: Business priority? (Low/Medium/High/Critical)"

#### Step 3: Task Generation Logic
Based on the feature details, automatically generate appropriate tasks:

**Communication Features:**
- SMS features → "SMS Integration", "SMS Scheduling", "Delivery Tracking"
- Email features → "Email Templates", "Email Delivery", "Email Analytics"
- Push features → "Push Setup", "Notification Preferences", "Real-time Delivery"

**Dashboard Features:**
- Dashboard mentions → "Dashboard Components", "Data Integration", "Analytics Widgets"
- Reporting → "Report Engine", "Export Functionality", "Scheduled Reports"

**Case Management:**
- Case workflow → "Case State Management", "Assignment Logic", "History Tracking"
- Case search → "Search Infrastructure", "Advanced Filtering", "Search Analytics"

**Appointment Features:**
- Booking → "Calendar Integration", "Booking Flow", "Availability Management"
- Scheduling → "Schedule Management", "Conflict Detection", "Reminder System"

#### Step 4: Generate Copy/Paste Content
After collecting information, provide individual copy/paste blocks in this exact format:

```
## 📋 Copy/Paste Content Generated

### LINEAR FEATURE ISSUE
```
Title: [Feature Name]

Description:
[User Story]

[Feature description]

## Acceptance Criteria
[List acceptance criteria as checkboxes]

## Technical Notes
- Primary Domain: [domain]
- Dependencies: [dependencies]
- Story Points: [points]

## Definition of Done
- [ ] Code reviewed and merged
- [ ] Unit tests written and passing
- [ ] Integration tests completed
- [ ] Documentation updated
- [ ] Feature tested in staging

Labels: feature, [domain]
Story Points: [points]
Priority: [priority]
```

### GITHUB FEATURE ISSUE
```
**Feature:** [Feature Name]

## User Story
[User Story]

## Description
[Feature description]

## Acceptance Criteria
[List acceptance criteria as checkboxes]

## Technical Implementation
- **Domain:** [domain]
- **Dependencies:** [dependencies]
- **Files to modify:** /src/features/[domain]/

Labels: enhancement, feature, [domain]
Story Points: [points]
```

### TASK 1 - LINEAR ISSUE
```
Title: [Task 1 Name]

Description:
[Task 1 description]

## Technical Requirements
[List technical requirements as checkboxes]

## Acceptance Criteria
- [ ] Implementation completed per requirements
- [ ] Unit tests written with >80% coverage
- [ ] Integration verified
- [ ] Error handling implemented
- [ ] Documentation updated

Parent Feature: [Feature Name]
Labels: task, [domain], implementation
Story Points: [task points]
```

### TASK 1 - GITHUB ISSUE
```
**Task:** [Task 1 Name]
**Parent Feature:** [Feature Name]

## Description
[Task 1 description]

## Technical Requirements
[List requirements as checkboxes]

## Files to Create/Modify
- /src/features/[domain]/[relevant files]

Labels: task, implementation, [domain]
Story Points: [task points]
```

[Repeat for each generated task...]

#### Step 5: File Creation
After providing copy/paste content, create these files:

**.claude/features/[feature-slug]/feature.md**
**.claude/features/[feature-slug]/tasks/[task-slug].md** (for each task)
**.claude/features/[feature-slug]/copy-paste-content.md** (all content in one file)

Then show the file structure created and offer to create detailed implementation plans.

### Task Breakdown Templates

#### SMS/Communication Tasks:
1. **API Integration** (3 pts): Set up external service (Twilio, SendGrid, etc.)
2. **Scheduling System** (5 pts): Background jobs, timing, automation
3. **Delivery Tracking** (2 pts): Status monitoring, failure handling

#### Dashboard/UI Tasks:
1. **UI Components** (5 pts): React components, responsive design
2. **Data Integration** (3 pts): API connections, real-time updates
3. **Analytics/Charts** (8 pts): Visualization, metrics, drill-down

#### Case/Appointment Tasks:
1. **Data Model** (3 pts): Database schema, migrations
2. **Business Logic** (5 pts): Core functionality, validation
3. **UI Interface** (5 pts): Forms, lists, workflows

#### Integration Tasks:
1. **External API Setup** (3 pts): Client setup, authentication
2. **Data Sync** (5 pts): Bidirectional sync, conflict resolution
3. **Error Handling** (2 pts): Retry logic, monitoring

### Response Format Rules
- Always provide individual copy/paste blocks clearly separated
- Use consistent formatting for Linear vs GitHub
- Include appropriate labels and story points
- Reference the correct domain and file paths
- Provide both feature-level and task-level issues
- Create organized file structure
- Offer to create detailed implementation plans after breakdown

## Plan & Review

### Before starting work
- Always assess complexity and suggest feature planning when appropriate
- If feature planning is used, create both breakdown AND detailed implementation plan
- Write all plans to appropriate .claude/ locations
- Always ask for review before implementation

### While implementing
- Update both .claude/tasks/ files AND feature progress files
- Cross-reference between feature acceptance criteria and technical progress

## Project Overview

This is a Next.js web application for OdisAI, an end-to-end ai-native, small animal clinic, veterinary practice management software. 

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build production application
- `npm run start` - Start production server

### Database Type Generation
- `npm run codegen` - Generate TypeScript types from Supabase schema (requires project ID)
- `npm run codegen:local` - Run local codegen script (./scripts/run-codegen.sh)

Note: The Next.js config ignores TypeScript and ESLint errors during builds.

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **UI Components**: shadcn/ui with Radix UI primitives, Tailwind CSS
- **State Management**: Zustand for client state
- **Audio Processing**: Deepgram SDK for speech-to-text transcription
- **Email**: React Email with SendGrid/Resend
- **AI**: OpenAI SDK for content generation

### Project Structure (Refactored for Next.js 15 Best Practices)

This project follows a modern Next.js 15 App Router architecture with feature-based organization:

```
/Users/s0381806/Development/odis-ai/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Route groups for auth pages
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── dashboard/
│   │   │   ├── appointments/
│   │   │   ├── cases/
│   │   │   ├── current-case/
│   │   │   ├── export-center/
│   │   │   ├── find-case/
│   │   │   ├── teams/
│   │   │   └── templates/
│   │   └── case/[id]/
│   ├── actions/                      # Server actions by domain
│   ├── api/                          # API routes
│   ├── globals.css
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
├── src/                              # Source directory (NEW)
│   ├── components/                   # All reusable components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── forms/                    # Form components
│   │   ├── layout/                   # Layout components
│   │   ├── landing/                  # Landing page components  
│   │   └── shared/                   # Shared components across features
│   ├── features/                     # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   ├── appointments/
│   │   ├── cases/
│   │   ├── patients/
│   │   └── templates/
│   ├── lib/                          # Shared utilities and configurations
│   │   ├── auth/
│   │   ├── db/
│   │   ├── email/
│   │   ├── validations/
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── hooks/                        # Global custom hooks
│   ├── store/                        # Global state management
│   ├── providers/                    # Context providers
│   │   ├── deepgram-provider.tsx
│   │   ├── microphone-provider.tsx
│   │   ├── email-provider.tsx
│   │   └── providers.tsx             # Combined providers
│   └── types/                        # Global TypeScript types
├── emails/                           # Email templates
├── infrastructure/                   # Infrastructure code
├── supabase/                         # Supabase config
└── docs/                            # Documentation
```

### Key Refactoring Changes Made

#### 1. **Source Directory Structure**
- **NEW**: Added `src/` directory to separate source code from configuration
- **Improved**: Clear separation between app routing and reusable components
- **Benefit**: Better organization and easier navigation for large codebases

#### 2. **Route Groups Implementation**
- **NEW**: `app/(auth)/` for authentication routes
- **NEW**: `app/(dashboard)/` for protected dashboard routes
- **Benefit**: Better URL organization without affecting the actual URLs

#### 3. **Feature-Based Architecture**
- **Maintained**: `src/features/` with domain-driven design
- **Enhanced**: Each feature has its own components, hooks, lib, and types
- **Benefit**: Scalable architecture that grows with the application

#### 4. **Component Organization**
- **Consolidated**: All components now in `src/components/`
- **Categorized**: UI, forms, layout, landing, and shared components
- **Benefit**: Easier to find and maintain components

#### 5. **Provider Consolidation**
- **NEW**: `src/providers/providers.tsx` combines all context providers
- **Simplified**: Root layout now uses single `<Providers>` component
- **Benefit**: Cleaner root layout and easier provider management

#### 6. **TypeScript Path Mappings**
Updated `tsconfig.json` with comprehensive path mappings:
```json
{
  "paths": {
    "@/*": ["./*"],
    "@/src/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/store/*": ["./src/store/*"],
    "@/types/*": ["./src/types/*"],
    "@/providers/*": ["./src/providers/*"],
    "@/features/*": ["./src/features/*"]
  }
}
```

### Server Actions Architecture
All server actions are organized by domain in `/app/actions/` and re-exported through `/app/actions/index.ts`:

- **Authentication**: Sign in/up, password reset, user management
- **Cases**: CRUD operations for medical cases 
- **Appointments**: Appointment management and retrieval
- **Generations**: AI content generation from templates and transcriptions
- **Email**: Template-based email sending and React email components
- **Templates**: CRUD for content generation templates

**Import pattern**: `import { createCase, getCase } from "@/app/actions"`

### Updated Import Patterns

#### Old Import Patterns (Before Refactoring):
```typescript
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { useTranscription } from "@/hooks/use-transcription"
import { cn } from "@/lib/utils"
```

#### New Import Patterns (After Refactoring):
```typescript
import { Button } from "@/src/components/ui/button"
import { createClient } from "@/src/lib/supabase/server"
import { useTranscription } from "@/src/hooks/use-transcription"
import { cn } from "@/src/lib/utils"
```

### Database Schema
Uses Supabase with normalized schema including:
- `cases` - Medical cases with status/type enums
- `appointments` - Appointment scheduling
- `transcriptions` - Audio transcription storage
- `soap_notes` - Medical SOAP notes
- `generations` - AI-generated content
- `templates` - Content generation templates

Types are auto-generated from Supabase schema in `database.types.ts`.

### Key Features
- **Real-time transcription**: Deepgram integration for live audio-to-text
- **AI-powered content generation**: OpenAI integration for SOAP notes and medical documentation
- **Email system**: Template-based email with React Email components
- **Case management**: Complete medical case workflow
- **Authentication**: Supabase Auth with middleware protection

### State Management
- **Zustand store** (`/src/store/use-case-store.tsx`) manages:
  - Recording state and transcriptions
  - Case actions (recordings, SOAP notes)
  - Current case and appointment data
  - Microphone and connection states

### Infrastructure
- Terraform configuration for AWS Lambda deployment
- Scripts for build and deployment automation
- Supabase local development support

## Important Notes

### Development Guidelines
- Follow the new `src/` directory structure for all new components and utilities
- Use the updated import patterns with `@/src/` prefixes
- Organize new features in `src/features/[domain]/` with proper subdirectories
- Use route groups for organizing related pages without affecting URLs

### Build and Deployment
- All protected routes require authentication via middleware
- Audio transcription requires Deepgram API credentials
- AI features require OpenAI API configuration
- Email functionality requires SendGrid or Resend configuration
- Database types should be regenerated after schema changes using codegen commands

### Code Quality
- The project uses TypeScript strict mode
- ESLint and TypeScript errors are ignored during builds (configured in next.config.ts)
- All UI components use the `cn` utility function for conditional styling
- Components follow shadcn/ui patterns and conventions

This refactored architecture provides a solid foundation for scaling the OdisAI veterinary practice management platform while maintaining clean separation of concerns and following Next.js 15 best practices.