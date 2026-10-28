# Implementation Plan: Standalone CV Builder with Next.js 15, Tremor, Clerk Auth & MongoDB Atlas (Docker-Free)

Build a modern, standalone **CV Builder** web application in `e:\Startups\cvbuilder` with the exact functionality and aesthetics of `E:\Startups\job-app-board` (CV Builder module), powered by **Next.js 15 (App Router)**, **Tremor Blocks / Tremor Raw UI** (`@tremor/react`, `@remixicon/react`), **Clerk Authentication**, **MongoDB Atlas (via MongoDB.Driver 3.x)**, and a **.NET 10 Minimal API** backend with **QuestPDF**, completely runnable and deployable **without Docker**.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions Approved by User:**
> 1. **UI Component Library:** **Tremor Blocks / Tremor Raw** (`@tremor/react`, `@remixicon/react`, `@radix-ui/react-*`, `@tailwindcss/forms`) instead of shadcn. Tremor's clean, modern dashboard aesthetic powers the CV cards, badges, buttons, dialogs, and split-pane inputs.
> 2. **Frontend Framework:** **Next.js 15 (App Router)** + **Tailwind CSS** + **Tremor** — chosen because **Clerk** provides first-class, official support (`@clerk/nextjs`) with prebuilt `<UserButton />`, `<SignIn />`, session management, and server middleware.
> 3. **Authentication:** **Clerk Auth** (`@clerk/nextjs`). Frontend routes and API calls authenticate via Clerk session tokens. The .NET backend validates Clerk authentication and scopes all CV documents to the Clerk User ID (`sub`).
> 4. **Database:** **MongoDB Atlas** using the latest official **`MongoDB.Driver` (3.x)**. Rich hierarchical `CvPayload` objects (work experience, engagements, achievements, skills, custom sections) serialize naturally as BSON documents.
> 5. **PDF Engine:** **QuestPDF (2025.4.0)** in .NET 10, delivering pixel-perfect UK ATS-compliant single-column CVs with exact typography, margins, and template accent palettes.
> 6. **Docker-Free Independence:** Both the Next.js frontend and .NET backend run standalone without Docker. Backend runs via `dotnet run` / `dotnet publish`; frontend runs via `npm run dev` / `npm run build && npm start`.

---

## Architecture Overview

```mermaid
graph TD
    subgraph Frontend["Frontend (Next.js 15 App Router + Tremor + Tailwind CSS)"]
        UI["CV Dashboard & Split-Pane Editor (Tremor Card, Badge, Button, Dialog)"]
        ClerkUI["Clerk Auth (@clerk/nextjs)"]
        Preview["Sticky Live ATS A4 HTML Preview"]
    end

    subgraph Backend["Backend (.NET 10 Minimal API)"]
        AuthMiddleware["Clerk JWT / User Validation"]
        Endpoints["CV Builder & Settings Endpoints"]
        PDFService["QuestPDF Engine (ATS Single Column)"]
        AIAgent["CvSectionWriterAgent (AI Rewrite)"]
    end

    subgraph External["External Cloud Services"]
        Clerk["Clerk Auth Provider"]
        Atlas[("MongoDB Atlas (Database)")]
        AI["OpenAI / LLM Endpoint"]
    end

    UI -->|Session & User Identity| ClerkUI
    ClerkUI <-->|OAuth / Session| Clerk
    UI -->|HTTP + Bearer Token| AuthMiddleware
    AuthMiddleware --> Endpoints
    Endpoints -->|MongoDB.Driver 3.x (BSON)| Atlas
    Endpoints -->|Generate ATS PDF| PDFService
    Endpoints -->|AI Polish Section| AIAgent
    AIAgent -->|OpenAI SDK / MEAI| AI
```

---

## Proposed Changes

### Repository Structure (`e:\Startups\cvbuilder`)

```text
cvbuilder/
├── backend/
│   └── CvBuilder.Backend/
│       ├── CvBuilder.Backend.csproj
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Configuration/
│       │   ├── MongoDbOptions.cs
│       │   ├── ClerkOptions.cs
│       │   └── AiOptions.cs
│       ├── Data/
│       │   ├── MongoDbContext.cs
│       │   └── MongoDbInitializer.cs
│       ├── Models/
│       │   ├── UserProfile.cs
│       │   ├── CvDocument.cs
│       │   ├── CvPayload.cs
│       │   └── AgentSetting.cs
│       ├── Dtos/
│       │   └── ApiDtos.cs
│       ├── Endpoints/
│       │   ├── CvBuilderEndpoints.cs
│       │   ├── UserProfileEndpoints.cs
│       │   ├── AgentSettingsEndpoints.cs
│       │   └── EndpointExtensions.cs
│       ├── Services/
│       │   ├── ICvDocumentPdfService.cs
│       │   ├── CvDocumentPdfService.cs
│       │   ├── CvTemplatePalette.cs
│       │   ├── IAgentClientProvider.cs
│       │   └── AgentClientProvider.cs
│       └── Agents/
│           └── CvSectionWriterAgent.cs
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts              # Configured with Tremor palette & plugins
│   ├── middleware.ts                   # Clerk route protection
│   ├── .env.example
│   ├── src/
│       ├── app/
│       │   ├── layout.tsx              # ClerkProvider, Root Layout & Nav
│       │   ├── page.tsx                # CV Builder Dashboard (Cards list)
│       │   ├── cv-builder/
│       │   │   ├── page.tsx            # Alias to CV Builder Dashboard
│       │   │   └── [id]/
│       │   │       └── page.tsx        # Split-Pane CV Editor with Live Preview
│       │   ├── profile/
│       │   │   └── page.tsx            # Candidate Profile & Preferences
│       │   ├── settings/
│       │   │   └── page.tsx            # AI Agent Settings
│       │   └── sign-in/[[...sign-in]]/
│       │       └── page.tsx            # Clerk Sign-In Page
│       ├── components/
│       │   ├── Navbar.tsx              # Header with logo & Clerk <UserButton />
│       │   ├── CvCard.tsx              # Dashboard Tremor Card with badges & actions
│       │   ├── CvEditor/               # Split-pane form components (Tremor Inputs)
│       │   │   ├── PersonalSection.tsx
│       │   │   ├── SummarySection.tsx
│       │   │   ├── KeyAchievementsSection.tsx
│       │   │   ├── ExperienceSection.tsx
│       │   │   ├── SkillsSection.tsx
│       │   │   ├── EducationSection.tsx
│       │   │   ├── CertificationsSection.tsx
│       │   │   └── CustomSections.tsx
│       │   ├── CvPreview/              # Live A4 ATS preview mirroring QuestPDF
│       │   │   └── A4Preview.tsx
│       │   ├── AiSuggestionModal.tsx   # Tremor Dialog for diff / Accept candidate text
│       │   └── ToastProvider.tsx       # Toast notifications
│       └── lib/
│           ├── api.ts                  # Typed client with Clerk token injection
│           ├── types.ts                # TypeScript types matching C# DTOs
│           └── utils.ts
├── README.md
└── start-dev.ps1                       # One-click startup script for both services
```

---

### Backend Implementation Details

#### [NEW] `backend/CvBuilder.Backend/CvBuilder.Backend.csproj`
- Targets `.NET 10.0`
- Packages:
  - `MongoDB.Driver` (`3.x`, e.g. `3.2.1`)
  - `QuestPDF` (`2025.4.0`)
  - `Microsoft.AspNetCore.Authentication.JwtBearer` (`10.0.0`)
  - `Microsoft.Extensions.AI.OpenAI` & `OpenAI` (`2.10.0`)
  - `Microsoft.AspNetCore.OpenApi` (`10.0.8`)

#### [NEW] `backend/CvBuilder.Backend/Data/MongoDbContext.cs`
- Sets up `MongoClient` and `IMongoDatabase`.
- Maps `GuidRepresentation.Standard` so UUIDs serialize properly in MongoDB.
- Collections:
  - `cv_documents`: stores `CvDocument` with embedded `CvPayload` BSON.
  - `users`: stores `UserProfile` with Clerk User ID as key.
  - `agent_settings`: stores custom AI agent connection settings.

#### [NEW] `backend/CvBuilder.Backend/Endpoints/CvBuilderEndpoints.cs`
- `GET /api/users/{userId}/cvs`: Fetches user's CVs sorted by `UpdatedAt` descending.
- `POST /api/cvs`: Creates a new CV draft with default "My CV" and structured payload.
- `GET /api/cvs/{id}`: Retrieves single CV draft.
- `PUT /api/cvs/{id}`: Updates title, template, and payload. Bumps `UpdatedAt`.
- `DELETE /api/cvs/{id}`: Deletes CV draft.
- `POST /api/cvs/{id}/set-base`: Sets `IsBase = true` on this CV and resets others for this user.
- `POST /api/cvs/{id}/pdf`: Streams ATS PDF generated by `CvDocumentPdfService` with `%PDF-` validation and `FirstName-LastName-CV.pdf` filename.
- `POST /api/cvs/{id}/improve`: Invokes `CvSectionWriterAgent` for "summary", "achievements", or "work" (Case A/B).

#### [NEW] `backend/CvBuilder.Backend/Services/CvDocumentPdfService.cs`
- UK ATS CV standard: A4 portrait, 0.35" top, 0.25" bottom, 0.45" left/right margins.
- Color palettes: Classic (black), Navy (`#1F3A5F`), Teal (`#0F766E`) applied strictly to candidate name and section border lines.
- Typography: Calibri/Arial, Name 21pt, Headline 11pt, Section Headings 12pt bold ALL CAPS with 0.5pt bottom rule, Role/Dates 11pt bold, Body/bullets 10.5pt, single line spacing, hanging indents.

---

### Frontend Implementation Details (Tremor + Next.js 15 + Clerk)

#### [NEW] `frontend/package.json`
Dependencies include:
- `next`: `15.x`
- `react`: `19.x` / `18.x`
- `@clerk/nextjs`
- `@tremor/react` & `@remixicon/react`
- `@radix-ui/react-*` (dialog, dropdown-menu, select, tabs, switch, tooltip)
- `clsx`, `tailwind-merge`
- `sonner` (toasts)
- DevDependencies: `tailwindcss`, `@tailwindcss/forms`

#### [NEW] `frontend/tailwind.config.ts`
Configured with Tremor color variables and `@tailwindcss/forms` plugin according to Tremor specifications.

#### [NEW] `frontend/src/components/CvCard.tsx`
- Built with Tremor `Card`, `Badge`, `Button`, and `@remixicon/react` icons:
  - Header: Title, Tremor `Badge` with template ("Classic", "Navy", "Teal").
  - Metadata: "Updated Oct 13, 2026", Candidate Name in uppercase.
  - Highlight: Base CV has amber border and `Badge` with `RiStarFill` ("Base CV").
  - Action buttons:
    - Tremor `Button` variant="secondary": `Set as Base` (with `RiStarLine`)
    - Tremor `Button` variant="primary": `Edit` (solid blue)
    - Tremor `Button` variant="secondary": `Copy` (`RiFileCopyLine`)
    - Tremor `Button` variant="secondary": `Download` (`RiDownloadLine`)
    - Tremor `Button` variant="secondary": `Delete` (`RiDeleteBinLine`)

#### [NEW] `frontend/src/app/cv-builder/[id]/page.tsx` (Split-Pane Editor)
- Left pane:
  - Collapsible Tremor `Card` components for Personal, Summary, Key Achievements, Core Skills, Work Experience (Case A: Client Engagements, Case B: Direct Bullets), Education, Certifications, Custom Sections.
  - Tremor `TextInput`, `Textarea`, `Select`, `Button`.
  - Reordering slots with up/down icon buttons.
  - Live 250ms debounced auto-save with Tremor `Badge` ("Saving..." / "Saved").
  - "Improve with AI" buttons triggering Tremor `Dialog` modal for side-by-side diff comparison and Accept/Discard.
- Right pane:
  - Sticky live A4 container rendering ATS HTML preview with real-time reactive updates, matching QuestPDF output 1:1.

---

## Verification Plan

### Automated Build & Compilation
```powershell
# 1. Build .NET Backend
dotnet build backend/CvBuilder.Backend/CvBuilder.Backend.csproj

# 2. Build Next.js Frontend
cd frontend
npm run build
cd ..
```

### Manual End-to-End Verification
1. **Launch:** Run `dotnet run --project backend/CvBuilder.Backend` and `npm run dev` in `frontend/`.
2. **Clerk Authentication:** Open `http://localhost:3000/`. Verify Clerk sign-in / demo session initializes cleanly.
3. **Dashboard:** Verify CV cards render with Tremor cards matching screenshot, Base CV highlighted in amber, and "New CV" creates a draft.
4. **Editor & Preview:** Open `/cv-builder/:id`, edit sections, verify live reactive A4 preview, section reordering, and debounced auto-save.
5. **PDF Download:** Click "Download PDF", verify downloaded ATS PDF opens correctly with proper typography and `%PDF-` header.
6. **MongoDB Verification:** Verify documents persist in MongoDB Atlas collection `cv_documents`.
