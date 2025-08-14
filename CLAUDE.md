# CLAUDE.md

## Feature Development Workflow

### Workflow Commands
This project includes an intelligent workflow system for breaking down work into manageable pieces:

- `pnpm run epic:generate` - Create new epic with auto-decomposition into features/tasks
- `pnpm run feature:generate` - Create standalone feature or add to existing epic
- `pnpm run task:generate` - Create individual implementation task
- `pnpm run workflow:dashboard` - View overview of all epics, features, and tasks

### Workflow Integration with Claude Code
When Claude Code encounters work that could benefit from structured planning:

1. **Epic-level work**: Major initiatives spanning multiple domains or months
   - Run `pnpm run epic:generate` to create structured breakdown
   - System will auto-generate features and tasks based on complexity analysis
   - Copy generated Linear/GitHub content to create issues

2. **Feature-level work**: User-facing functionality within a domain
   - Run `pnpm run feature:generate` for standalone features
   - Use `--epic="Epic Name"` to associate with existing epic
   - System will auto-generate tasks if feature is complex enough

3. **Task-level work**: Individual implementation units
   - Run `pnpm run task:generate` for specific technical work
   - Use `--feature="Feature Name"` to associate with existing feature

### When to Use Workflow System
Claude should suggest using the workflow system when:
- Work spans multiple domains (cases, appointments, communications, etc.)
- Estimated effort is >5 story points or >1 week
- Work involves external integrations or new infrastructure
- Multiple user types or complex business logic involved
- Work needs coordination between multiple developers

### Workflow File Structure
Generated files follow the established .claude/ pattern:

.claude/
├── epics/
│   └── epic-name/
│       ├── epic.md                    # Epic overview and progress
│       ├── copy-paste-content.md      # Linear/GitHub formatted content
│       └── features/
│           └── feature-name/
│               ├── feature.md
│               └── tasks/
│                   └── task-name.md


### Integration with Existing Planning Process
The workflow system enhances your existing planning methodology:

1. **Before starting work**: Check if `pnpm run epic:generate` or `pnpm run feature:generate` should be used
2. **Plan creation**: Use generated breakdown as starting point for detailed implementation plans
3. **Plan review**: Present both the workflow breakdown AND the detailed technical plan for approval
4. **Implementation tracking**: Update both .claude/tasks/ files AND workflow progress files
5. **Handoff documentation**: Use workflow structure for clear progress communication

### Domain Integration
The workflow system understands your existing domain structure and will:
- Suggest appropriate domains for features/tasks
- Reference existing action patterns (/app/actions/domain/)
- Maintain consistency with your established architecture
- Follow your database and API patterns

This workflow system complements but doesn't replace your detailed technical planning - it provides structure for complex initiatives while maintaining your established development practices. 

2. Claude Code Prompts
Prompt 1: Epic Planning Trigger
When you encounter a request for work that:
- Spans multiple domains (cases, appointments, communications, auth, etc.)
- Involves significant new functionality or system changes  
- Has estimated complexity >8 story points or >2 weeks effort
- Requires coordination of multiple features or external integrations

First suggest: "This appears to be epic-level work that would benefit from structured planning. Should I run `pnpm run epic:generate` to create a comprehensive breakdown with auto-generated features and tasks?"

If approved, guide them through the epic generation process and then create detailed implementation plans for the generated components.
Prompt 2: Feature Planning Trigger
When you encounter a request for work that:
- Is focused on a single user-facing capability
- Estimated at 3-13 story points or 3-10 days effort
- Involves multiple technical components or integrations
- Could benefit from task breakdown

Suggest: "This looks like feature-level work. Should I run `pnpm run feature:generate` to create a structured breakdown? If this is part of a larger epic, I can use --epic='Epic Name' to associate it."

After generation, create detailed technical implementation plans following your established methodology.
Prompt 3: Integration with Planning Process
When creating implementation plans, always:

1. Check if workflow files exist in .claude/epics/ for this work
2. If workflow files exist, reference them in your planning:
   - Include the epic/feature context
   - Reference the acceptance criteria from workflow files
   - Align your technical plan with the generated task breakdown
   - Update progress in both .claude/tasks/ AND workflow files

3. If no workflow files exist but complexity suggests they should:
   - Recommend running the appropriate workflow generation command
   - Explain how it would help structure the work
   - Offer to proceed without it if they prefer

4. Always maintain the existing planning approval process:
   - Create detailed technical plans in .claude/tasks/
   - Present for review before implementation
   - Update progress during development
   - Provide clear handoff documentation
Prompt 4: Progress Tracking Integration
When updating progress on work that has workflow files:

1. Update both locations:
   - Your detailed .claude/tasks/TASK_NAME.md file
   - The relevant workflow files in .claude/epics/

2. Format progress updates to include:
   - Technical implementation details in task files
   - User-facing progress in workflow files
   - Cross-references between the two systems

3. When completing work:
   - Mark tasks complete in both systems
   - Update the copy-paste content if Linear/GitHub issues need updating
   - Suggest running `pnpm run workflow:dashboard` to see overall progress

This dual tracking provides both technical detail for development and business context for stakeholders.
Prompt 5: Complexity Assessment Guidance
When assessing whether to suggest workflow generation, consider:

HIGH COMPLEXITY (Suggest epic:generate):
- Multiple communication channels (SMS + email + push)
- Cross-domain functionality (cases + appointments + communications)
- New infrastructure or external service integration
- Multiple user types with different workflows
- System-wide changes or architectural updates

MEDIUM COMPLEXITY (Suggest feature:generate):  
- Single domain but multiple components
- External API integration within one domain
- Complex UI with multiple views/states
- New database schema with relationships
- Workflow automation or business logic

LOW COMPLEXITY (Regular task planning):
- Single component updates
- Bug fixes or small enhancements  
- Simple CRUD operations
- UI styling or minor UX improvements
- Configuration or content changes

Use this assessment to guide recommendations while respecting developer preferences.
3. Example Integration Prompts
When Claude Code Starts a Complex Task
I notice this request involves [multiple domains/external integration/complex UI]. This appears to be [epic/feature]-level work that could benefit from structured planning.

Would you like me to:
1. Run `pnpm run epic:generate` to create a comprehensive breakdown with auto-generated features and tasks?
2. Or proceed with creating a detailed implementation plan in .claude/tasks/ following your standard methodology?

The workflow system would help by:
- Breaking down the work into manageable pieces
- Generating Linear/GitHub issue content
- Creating clear progress tracking
- Providing structured handoff documentation

What would you prefer?
When Updating Existing Workflow Work
I see this work is part of the "[Epic Name]" epic with existing workflow files. I'll:

1. Reference the acceptance criteria from .claude/epics/[epic]/features/[feature]/
2. Create detailed technical plans in .claude/tasks/[task-name].md
3. Update progress in both locations
4. Ensure alignment with the overall epic goals

The workflow files show this task should [reference acceptance criteria]. I'll create an implementation plan that addresses these requirements while following your established technical patterns.

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