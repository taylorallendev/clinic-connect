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
- **Files to modify:** /app/actions/[domain]/

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
- /app/actions/[domain]/[relevant files]

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
```

## Example Usage in Claude Code

**You:** "I want to build SMS appointment reminders for the veterinary clinic"

**Claude:** "This appears to be feature-level work involving external API integration (SMS service) and cross-domain functionality (communications + appointments). I can create a structured breakdown with individual copy/paste blocks for Linear and GitHub.

Would you like me to create a structured feature breakdown? I'll ask a few planning questions and generate organized tasks with ready-to-use issue content."

**You:** "Yes"

**Claude:** "**Feature Name**: What should we call this feature?"

**You:** "SMS Appointment Reminders"

**Claude:** "**User Story**: Complete this - 'As a [user type], I want [capability] so that [benefit]'"

**You:** "As a pet owner, I want to receive SMS reminders before appointments so I don't miss them"

[Continue through all questions...]

**Claude:** [After collecting all info] "Perfect! Based on your requirements, I've analyzed this as a complex feature (8 story points) and generated 3 tasks. Here are your individual copy/paste blocks:

## 📋 Copy/Paste Content Generated

### LINEAR FEATURE ISSUE
```
Title: SMS Appointment Reminders

Description: 
As a pet owner, I want to receive SMS reminders before appointments so I don't miss them
[etc...]
```

### GITHUB FEATURE ISSUE  
```
**Feature:** SMS Appointment Reminders
[etc...]
```

### TASK 1 - LINEAR ISSUE
```
Title: Twilio SMS Integration
[etc...]
```

[And so on for each piece...]

**Files Created:**
- `.claude/features/sms-appointment-reminders/feature.md`
- `.claude/features/sms-appointment-reminders/tasks/twilio-integration.md`
- `.claude/features/sms-appointment-reminders/tasks/sms-scheduling.md`
- `.claude/features/sms-appointment-reminders/tasks/delivery-tracking.md`
- `.claude/features/sms-appointment-reminders/copy-paste-content.md`

Would you like me to create a detailed implementation plan for the first task?"

This way everything happens **inside Claude Code chat** and you get individual copy/paste blocks you can use directly in Linear and GitHub.
### Before starting work
- Always in plan mode to make a plan
- After get the plan, make sure you Write the plan to .claude/tasks/TASK_NAME.md.
- The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
- If the task require external knowledge or certain package, also research to get latest knowledge (Use Task tool for research)
- Don't over plan it, always think MVP.
- Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing
- You should update the plan as you work.
- After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.

## Project Overview

This is a Next.js web application for OdisAI, an end-to-end ai-native, small animal clinic, veterinary practice management software. 

## Development Commands

### Core Development
- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build production application
- `pnpm start` - Start production server

### Database Type Generation
- `pnpm run codegen` - Generate TypeScript types from Supabase schema (requires project ID)
- `pnpm run codegen:local` - Run local codegen script (./scripts/run-codegen.sh)

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

### Project Structure
This is a medical clinic management system with domain-driven design:

- `/app/actions/` - Server actions organized by domain (auth, cases, appointments, etc.)
- `/app/app/dashboard/` - Main dashboard pages and components
- `/components/ui/` - Reusable UI components (shadcn/ui)
- `/store/` - Client-side state management (Zustand)
- `/context/` - React context providers (Deepgram, Email, Microphone)
- `/utils/supabase/` - Supabase client utilities for browser/server/middleware
- `/supabase/migrations/` - Database schema migrations

### Server Actions Architecture
All server actions are organized by domain in `/app/actions/` and re-exported through `/app/actions/index.ts`:

- **Authentication**: Sign in/up, password reset, user management
- **Cases**: CRUD operations for medical cases 
- **Appointments**: Appointment management and retrieval
- **Generations**: AI content generation from templates and transcriptions
- **Email**: Template-based email sending and React email components
- **Templates**: CRUD for content generation templates

Import pattern: `import { createCase, getCase } from "@/app/actions"`

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
- **Zustand store** (`/store/use-case-store.tsx`) manages:
  - Recording state and transcriptions
  - Case actions (recordings, SOAP notes)
  - Current case and appointment data
  - Microphone and connection states

### Infrastructure
- Terraform configuration for AWS Lambda deployment
- Scripts for build and deployment automation
- Supabase local development support

## Important Notes
- All protected routes require authentication via middleware
- Audio transcription requires Deepgram API credentials
- AI features require OpenAI API configuration
- Email functionality requires SendGrid or Resend configuration
- Database types should be regenerated after schema changes using codegen commands