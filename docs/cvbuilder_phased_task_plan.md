# CV Builder — Phase-Wise Task-Based Implementation Plan

> [!NOTE]
> Each phase is self-contained and produces a **runnable milestone**. Tasks within a phase are ordered by dependency. Effort is estimated in hours of focused coding time.
> Frontend setup strictly follows the official [Next.js - Tremor Installation Guide](https://www.tremor.so/docs/getting-started/installation/next) (Tremor Raw + Tailwind CSS v4 + `@tailwindcss/forms` + `geist` font).

---

## Phase 0 — Project Scaffolding & Dev Environment (Tremor Next.js Standard)
**Goal:** Empty but runnable Next.js + .NET projects configured exactly according to the official Tremor Next.js installation specification, with dev startup script and repo structure.
**Milestone:** `dotnet run` serves an empty API on `:5139`; `npm run dev` serves a Tremor-styled Next.js page on `:3000` with Geist font and dark mode support.

| # | Task | Files Created / Modified | Depends On | Effort | Acceptance |
|---|------|--------------------------|------------|--------|------------|
| 0.1 | **Create repo skeleton** — Create the `backend/CvBuilder.Backend/` and `frontend/` directories with placeholder README | `README.md`, directory structure | — | 15 min | Folders exist under `e:\Startups\cvbuilder` |
| 0.2 | **Scaffold .NET 10 Minimal API** — `dotnet new webapi -n CvBuilder.Backend --use-minimal-apis` inside `backend/`, add NuGet refs: `MongoDB.Driver 3.x`, `QuestPDF 2025.4.0`, `Microsoft.AspNetCore.Authentication.JwtBearer 10.0.0`, `Microsoft.Extensions.AI.OpenAI`, `OpenAI`, `Microsoft.AspNetCore.OpenApi` | `CvBuilder.Backend.csproj`, `Program.cs`, `appsettings.json`, `appsettings.Development.json` | 0.1 | 30 min | `dotnet build` succeeds; `dotnet run` returns 200 on `/` |
| 0.3 | **Scaffold Next.js 15 frontend per Tremor Guide** — Initialize Next.js with App Router, TypeScript, Tailwind CSS, ESLint, and `src/` directory (`npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir`). Install Tremor core & Radix dependencies per doc:<br>• Core: `npm install tailwind-variants clsx tailwind-merge @remixicon/react`<br>• Primitives: `npm install @radix-ui/react-accordion @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-toggle-group @radix-ui/react-toggle @internationalized/date date-fns@3.6.0 react-day-picker@8.10.1 recharts @react-aria/datepicker @react-stately/datepicker`<br>• Font: `npm install geist`<br>• Forms: `npm install -D @tailwindcss/forms`<br>• Auth & Toast: `npm install @clerk/nextjs sonner` | `package.json`, `tsconfig.json`, `next.config.ts` | 0.1 | 30 min | `npm install` completes cleanly with all dependencies |
| 0.4 | **Configure Tremor styling & layout** — <br>1. Update `src/app/globals.css` with `@import "tailwindcss";`, `@plugin "@tailwindcss/forms";`, `@custom-variant dark (&:where(.dark, .dark *));`, and `@theme` block containing Tremor animation variables and keyframes (`hide`, `slideDownAndFade`, `slideLeftAndFade`, `slideUpAndFade`, `slideRightAndFade`, `accordionOpen`, `accordionClose`, `dialogOverlayShow`, `dialogContentShow`, `drawerSlideLeftAndFade`, `drawerSlideRightAndFade`).<br>2. Update `src/app/layout.tsx` importing `GeistSans` from `"geist/font/sans"` and applying `<html lang="en" className={`${GeistSans.className} antialiased dark:bg-gray-950`}>`. | `src/app/globals.css`, `src/app/layout.tsx` | 0.3 | 25 min | Tremor animations and typography applied; dark mode background works |
| 0.5 | **Add Tremor utilities and helpers** — <br>1. Create `src/lib/utils.ts` with `cx()` (`twMerge(clsx(...args))`), `focusInput`, `focusRing`, `hasErrorInput`, plus date formatters and debounce helper.<br>2. Create `src/lib/chartUtils.ts` with Tremor chart utilities (`chartColors`, `AvailableChartColors`, `constructCategoryColors`, `getColorClassName`, `getYAxisDomain`, `hasOnlyOneValueForKey`). | `src/lib/utils.ts`, `src/lib/chartUtils.ts` | 0.3 | 20 min | Utilities export cleanly and compile without TS errors |
| 0.6 | **Create environment configuration templates** — Configure frontend environment template (`frontend/.env.example`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_API_URL`) and backend configuration templates (`backend/CvBuilder.Backend/appsettings.Development.json` & `.env.example`: MongoDB Atlas, Clerk JWT, OpenAI). Ensure frontend contains zero direct knowledge of MongoDB or AI services. | `frontend/.env.example`, `backend/CvBuilder.Backend/.env.example`, `backend/CvBuilder.Backend/appsettings.Development.json` | 0.3 | 10 min | Clean separation of frontend UI/UX and backend services |
| 0.7 | **Create `start-dev.ps1`** — PowerShell script that launches both `dotnet run` and `npm run dev` in parallel background jobs | `start-dev.ps1` | 0.2, 0.3 | 15 min | Running `.\start-dev.ps1` starts both servers |
| 0.8 | **Configure CORS on .NET backend** — Allow `http://localhost:3000` origin with credentials | `Program.cs` | 0.2 | 10 min | Frontend fetch to backend doesn't fail on CORS |

**Phase 0 Total: ~2.5 hours**

---

## Phase 1 — Backend Core: Models, MongoDB, CRUD Endpoints
**Goal:** Fully functional REST API for CV documents, user profiles, and agent settings — all persisted in MongoDB Atlas.
**Milestone:** All CRUD endpoints pass manual Swagger/curl testing against MongoDB Atlas.

| # | Task | Files Created / Modified | Depends On | Effort | Acceptance |
|---|------|--------------------------|------------|--------|------------|
| 1.1 | **Define MongoDB Configuration** — Create `MongoDbOptions.cs` with `ConnectionString`, `DatabaseName` fields. Bind from `appsettings.json` section `"MongoDb"` | `Configuration/MongoDbOptions.cs`, `appsettings.json` | Phase 0 | 20 min | Options bind correctly from config |
| 1.2 | **Define Clerk JWT Configuration** — Create `ClerkOptions.cs` with `Authority`, `Issuer` fields for JWT validation | `Configuration/ClerkOptions.cs`, `appsettings.json` | Phase 0 | 15 min | Options bind correctly |
| 1.3 | **Define AI Configuration** — Create `AiOptions.cs` with `Endpoint`, `Model`, `ApiKey` | `Configuration/AiOptions.cs`, `appsettings.json` | Phase 0 | 10 min | Options bind correctly |
| 1.4 | **Create Domain Models** — Port `CvPayload.cs` (CvPayload, CvPersonal, CvEmployer, CvClientEngagement, CvEducationItem, CvSkillItem, CvCertificationItem, CvCustomSection), `CvDocument.cs`, `UserProfile.cs`, `AgentSetting.cs` from reference project. Remove EF-specific code (navigation props, EF extensions). Add MongoDB `[BsonId]` / `[BsonRepresentation]` attributes. | `Models/CvPayload.cs`, `Models/CvDocument.cs`, `Models/UserProfile.cs`, `Models/AgentSetting.cs` | Phase 0 | 1 hr | All models compile; BSON serialisation round-trips correctly |
| 1.5 | **Create MongoDbContext** — Singleton service wrapping `MongoClient`, exposing `IMongoCollection<CvDocument>`, `IMongoCollection<UserProfile>`, `IMongoCollection<AgentSetting>`. Configure GUID representation as Standard. | `Data/MongoDbContext.cs` | 1.1, 1.4 | 45 min | Collections accessible; insert/find works in a scratch test |
| 1.6 | **Create MongoDbInitializer** — Ensure indexes: unique on `UserProfile.ClerkUserId`, compound on `CvDocument.UserId + UpdatedAt`, unique on `AgentSetting.AgentName` | `Data/MongoDbInitializer.cs` | 1.5 | 30 min | Indexes exist in Atlas after first run |
| 1.7 | **Create API DTOs** — Request/response shapes: `CvListItemDto`, `CvDetailDto`, `CreateCvRequest`, `UpdateCvRequest`, `ImproveSectionRequest`, `UserProfileDto`, `UpdateProfileRequest`, `AgentSettingDto`, `UpdateAgentSettingRequest` | `Dtos/ApiDtos.cs` | 1.4 | 45 min | DTOs compile; JSON serialisation matches expected wire shape |
| 1.8 | **Create Endpoint Helpers** — `EndpointExtensions.cs` with `MapAllEndpoints()` that chains all endpoint groups; helper to extract Clerk user ID from `HttpContext.User` | `Endpoints/EndpointExtensions.cs` | Phase 0 | 20 min | Helper compiles and is callable from `Program.cs` |
| 1.9 | **Implement CV Builder Endpoints** — `GET /api/users/{userId}/cvs`, `POST /api/cvs`, `GET /api/cvs/{id}`, `PUT /api/cvs/{id}`, `DELETE /api/cvs/{id}`, `POST /api/cvs/{id}/set-base`. Include `SectionOrder` normalisation on every PUT (backfill missing custom IDs, prune stale keys). | `Endpoints/CvBuilderEndpoints.cs` | 1.5, 1.7, 1.8 | 2 hr | All 6 endpoints return expected status codes and bodies via Swagger |
| 1.10 | **Implement User Profile Endpoints** — `GET /api/profile`, `PUT /api/profile` (upsert by Clerk user ID). Auto-create profile on first access. | `Endpoints/UserProfileEndpoints.cs` | 1.5, 1.7, 1.8 | 45 min | Profile persists and round-trips |
| 1.11 | **Implement Agent Settings Endpoints** — `GET /api/settings/agents`, `PUT /api/settings/agents/{agentName}` | `Endpoints/AgentSettingsEndpoints.cs` | 1.5, 1.7, 1.8 | 30 min | Settings persist and round-trip |
| 1.12 | **Wire everything in Program.cs** — Register `MongoDbContext`, bind options, add JWT Bearer auth (Clerk), add CORS, OpenAPI, rate limiter, map all endpoints | `Program.cs` | 1.5–1.11 | 45 min | `dotnet run` starts clean; Swagger UI shows all endpoints |
| 1.13 | **Implement Clerk JWT Auth Middleware** — Configure `AddAuthentication().AddJwtBearer()` to validate Clerk-issued JWTs (JWKS endpoint, issuer, audience). Protect all `/api/*` routes. | `Program.cs` | 1.2, 1.12 | 45 min | Unauthenticated requests return 401; valid Clerk token returns 200 |

**Phase 1 Total: ~8.5 hours**

---

## Phase 2 — Frontend Core: Tremor Components, Auth, Dashboard
**Goal:** Build foundational Tremor Raw UI components (`Card`, `Badge`, `Button`, `Dialog`, `Input`, `Textarea`, `Select`, `Tabs`, `Divider`), Clerk auth, and CV dashboard with card list.
**Milestone:** Clerk sign-in works; dashboard renders Tremor CV cards from backend API; New CV / Delete / Copy / Set Base all functional.

| # | Task | Files Created / Modified | Depends On | Effort | Acceptance |
|---|------|--------------------------|------------|--------|------------|
| 2.1 | **Add Tremor Raw UI Component Library** — Implement modular Tremor Raw components in `src/components/ui/` per Tremor specification:<br>• `Button.tsx` (primary, secondary, light, destructive variants with `tailwind-variants` & `cx`)<br>• `Badge.tsx` (neutral, success, error, warning, template badge variants)<br>• `Card.tsx` (standard surface with border, shadow, dark mode styles)<br>• `Dialog.tsx` (accessible Radix Dialog wrapper with Tremor animations)<br>• `Input.tsx` / `Textarea.tsx` (with `focusInput`, `hasErrorInput` styling)<br>• `Select.tsx` (Radix Select with Tremor dropdown styles)<br>• `Tabs.tsx` & `Divider.tsx` | `src/components/ui/*.tsx` | Phase 0 | 1.5 hr | Tremor components render with consistent theme and interactive states |
| 2.2 | **Configure Clerk Provider** — Wrap `layout.tsx` in `<ClerkProvider>`, configure Clerk publishable key | `src/app/layout.tsx` | Phase 0 | 25 min | Clerk session initialises; `<UserButton />` visible |
| 2.3 | **Create Clerk middleware** — `middleware.ts` protecting routes except `/sign-in`. Redirect unauthenticated users to `/sign-in` | `middleware.ts` | 2.2 | 20 min | Visiting `/` unauthenticated redirects to `/sign-in` |
| 2.4 | **Create Sign-In page** — `/sign-in/[[...sign-in]]/page.tsx` with Clerk `<SignIn />` component, centred on page with dark mode styling | `src/app/sign-in/[[...sign-in]]/page.tsx` | 2.2 | 20 min | Sign-in UI renders; OAuth/email login works |
| 2.5 | **Create typed API client** — `lib/api.ts` with `fetchWithAuth()` that auto-injects Clerk bearer token. Typed methods: `listCvs()`, `createCv()`, `getCv()`, `updateCv()`, `deleteCv()`, `setBaseCv()`, `downloadPdf()`, `improveSection()`, `getProfile()`, `updateProfile()`, `getAgentSettings()`, `updateAgentSetting()` | `src/lib/api.ts` | 2.2 | 1 hr | All methods compile; `listCvs()` returns data from backend |
| 2.6 | **Create TypeScript types** — Mirror all C# DTOs and models: `CvPayload`, `CvPersonal`, `CvEmployer`, `CvClientEngagement`, `CvEducationItem`, `CvSkillItem`, `CvCertificationItem`, `CvCustomSection` | `src/lib/types.ts` | — | 45 min | Types match backend JSON wire shape exactly |
| 2.7 | **Build Navbar component** — Fixed top bar with app logo/name, Clerk `<UserButton />`, navigation links (Dashboard, Profile, Settings) styled with Tremor aesthetic. Active link highlight. Responsive mobile menu. | `src/components/Navbar.tsx` | 2.1, 2.2 | 45 min | Navbar renders across all pages with active indicators |
| 2.8 | **Build Root Layout** — Dark mode background (`dark:bg-gray-950`), Geist font, `<Navbar />`, `<Toaster />` (sonner with Tremor styles), global layout structure | `src/app/layout.tsx` | 2.7 | 30 min | Layout wraps all pages with consistent nav and toast notifications |
| 2.9 | **Build CvCard component** — Built with Tremor `Card`, `Badge`, `Button`, and `@remixicon/react` icons:<br>• Title & Template `Badge` (Classic, Navy, Teal)<br>• Metadata: "Updated X ago", Candidate Name in uppercase<br>• Base CV highlight: Amber border with `RiStarFill` "Base CV" badge<br>• Action buttons: Set as Base (`RiStarLine`), Edit (`RiEditLine`), Copy (`RiFileCopyLine`), Download (`RiDownloadLine`), Delete (`RiDeleteBinLine`) | `src/components/CvCard.tsx` | 2.1, 2.6 | 1.5 hr | Card renders all states (base, non-base); actions fire correct API calls |
| 2.10 | **Build CV Dashboard page** — Grid of `<CvCard />` components. "New CV" button (creates draft via API, navigates to editor). Empty state with Tremor illustration card. Loading skeleton. Sort by updated date. | `src/app/page.tsx` | 2.5, 2.9 | 1.5 hr | Dashboard loads CVs from API; New/Delete/Copy/SetBase work end-to-end |
| 2.11 | **Build Toast Provider** — Configure `sonner` toaster with Tremor-aligned styling for success/error notifications | `src/components/ToastProvider.tsx` | 2.1 | 15 min | Toast notifications appear on API success/error |

**Phase 2 Total: ~8.5 hours**

---

## Phase 3 — Frontend Editor: Split-Pane Form + Live Preview
**Goal:** Full split-pane CV editor with all section forms (Personal, Summary, Key Achievements, Skills, Work Experience with Case A/B, Education, Certifications, Custom Sections), section reordering, debounced auto-save, and live A4 ATS HTML preview.
**Milestone:** User can edit all CV sections; changes auto-save; right pane shows pixel-accurate A4 preview updating in real time.

| # | Task | Files Created / Modified | Depends On | Effort | Acceptance |
|---|------|--------------------------|------------|--------|------------|
| 3.1 | **Create Editor page layout** — `/cv-builder/[id]/page.tsx` with resizable split pane: left = scrollable form, right = sticky A4 preview. Top bar with CV title, template selector (Classic/Navy/Teal), save status badge ("Saving..." / "Saved"), Back to Dashboard link. | `src/app/cv-builder/[id]/page.tsx` | Phase 2 | 1.5 hr | Split pane renders; CV loads from API on mount |
| 3.2 | **Build PersonalSection form** — Tremor `Input` fields for Full Name, Headline, Email, Phone, Location. Dynamic links list (add/remove). Two-way data binding to `CvPayload.Personal`. | `src/components/CvEditor/PersonalSection.tsx` | 3.1 | 45 min | Fields populate from CV data; changes reflect in state |
| 3.3 | **Build SummarySection form** — Tremor `Textarea` for profile summary. "Improve with AI" button with `RiSparklingLine`. | `src/components/CvEditor/SummarySection.tsx` | 3.1 | 30 min | Summary editable; AI button triggers modal (wired in Phase 5) |
| 3.4 | **Build KeyAchievementsSection form** — Dynamic bullet list (add/remove/reorder). Each item is a Tremor `Textarea`. "Improve with AI" button. | `src/components/CvEditor/KeyAchievementsSection.tsx` | 3.1 | 45 min | Bullets add/remove/reorder; data persists |
| 3.5 | **Build SkillsSection form** — Dynamic skill list with Name + optional Category `Input`. Add/remove. Category grouping preview. | `src/components/CvEditor/SkillsSection.tsx` | 3.1 | 45 min | Skills add/remove; category grouping works |
| 3.6 | **Build ExperienceSection form** — Complex nested form: each Employer has Name, Role, Dates, Location, Summary.<br>• **Case A toggle**: add Client Engagements (ClientName, RoleContext, Achievements bullets).<br>• **Case B toggle**: direct Bullets list.<br>Add/remove employers, engagements, bullets. "Improve with AI" button per engagement/employer. | `src/components/CvEditor/ExperienceSection.tsx` | 3.1 | 2.5 hr | Both Case A and Case B render correctly; nested add/remove works |
| 3.7 | **Build EducationSection form** — Dynamic list of education items (Institution, Qualification, Location, Start, End, Details). Add/remove. | `src/components/CvEditor/EducationSection.tsx` | 3.1 | 30 min | Items add/remove; data persists |
| 3.8 | **Build CertificationsSection form** — Dynamic list (Name, Issuer, Date, URL). Add/remove. | `src/components/CvEditor/CertificationsSection.tsx` | 3.1 | 30 min | Items add/remove; data persists |
| 3.9 | **Build CustomSections form** — Add new custom section (with stable `Id`). Title + dynamic bullet Items list. Remove section. | `src/components/CvEditor/CustomSections.tsx` | 3.1 | 45 min | Custom sections create/delete; items add/remove |
| 3.10 | **Build Section Reordering UI** — Drag-handle or up/down arrow buttons on each collapsible section header. Reorders the `SectionOrder` array. Ensures built-in keys and `custom:{id}` refs stay in sync. | Editor page + section components | 3.2–3.9 | 1 hr | Dragging/clicking reorders sections; order persists to API |
| 3.11 | **Implement debounced auto-save** — 250ms debounce on any form change → `PUT /api/cvs/{id}`. Tremor `Badge` shows "Saving..." during request, "Saved" on success, "Error" on failure. Optimistic state. | Editor page | 3.1–3.10 | 1 hr | Changes auto-save within 250ms of last keystroke; badge updates |
| 3.12 | **Build A4Preview component** — Right pane renders a scaled A4 container (210mm × 297mm) with HTML/CSS that mirrors the QuestPDF output 1:1. Sections: Personal header (name in accent colour, headline, contact row), then sections in `SectionOrder` (Summary paragraph, Key Achievements bullets, Core Skills comma-separated/grouped, Work Experience with Case A/B sub-blocks, Education, Certifications, Custom Sections). Section headings bold ALL CAPS with accent bottom rule. Body 10.5pt Calibri/Arial. | `src/components/CvPreview/A4Preview.tsx` | 3.1, 2.6 | 2.5 hr | Preview matches QuestPDF PDF output; updates reactively on every state change |
| 3.13 | **Template accent colours in preview** — Classic = black, Navy = `#1F3A5F`, Teal = `#0F766E`. Name and heading rules change colour based on `TemplateKey`. | `A4Preview.tsx` | 3.12 | 20 min | Switching template in dropdown changes preview accents |

**Phase 3 Total: ~13 hours**

---

## Phase 4 — PDF Generation (QuestPDF Backend)
**Goal:** Backend generates pixel-perfect ATS-compliant PDF from structured `CvPayload`. Frontend downloads it.
**Milestone:** Clicking "Download PDF" on dashboard or editor produces a correctly formatted PDF file.

| # | Task | Files Created / Modified | Depends On | Effort | Acceptance |
|---|------|--------------------------|------------|--------|------------|
| 4.1 | **Create CvTemplatePalette** — Static dictionary mapping `TemplateKey` → accent `Color` (Classic → black, Navy → `#1F3A5F`, Teal → `#0F766E`) | `Services/CvTemplatePalette.cs` | Phase 1 | 15 min | Palette resolves all 3 keys |
| 4.2 | **Create ICvDocumentPdfService interface** — `byte[] GeneratePdf(CvDocument doc)` | `Services/ICvDocumentPdfService.cs` | 1.4 | 10 min | Interface compiles |
| 4.3 | **Implement CvDocumentPdfService** — Full QuestPDF document: A4 portrait, 0.35" top / 0.25" bottom / 0.45" left+right margins. Font: Calibri (Arial fallback). Sections rendered in `SectionOrder`. Name 21pt accent, headline 11pt, section headings 12pt bold ALL CAPS + 0.5pt accent rule, employer/role 11pt bold, body 10.5pt, bullets with hanging indent. Port the full 700-line renderer from reference project, adapting from EF to direct model input. | `Services/CvDocumentPdfService.cs` | 4.1, 4.2, 1.4 | 4 hr | Generated PDF opens correctly; typography matches spec; passes ATS readability check |
| 4.4 | **Add PDF endpoint** — `POST /api/cvs/{id}/pdf` streams the PDF with `Content-Disposition: attachment; filename="FirstName-LastName-CV.pdf"`. Validates `%PDF-` magic header before streaming. | `Endpoints/CvBuilderEndpoints.cs` | 4.3, 1.9 | 30 min | Endpoint returns valid PDF; browser triggers download |
| 4.5 | **Wire frontend Download button** — `CvCard` and editor top bar "Download" buttons call `downloadPdf()` from `api.ts`, trigger browser save dialog | `CvCard.tsx`, Editor page, `api.ts` | 4.4, Phase 2, Phase 3 | 30 min | Clicking Download saves a properly named PDF file |
| 4.6 | **QuestPDF license setup** — Set `QuestPDF.Settings.License = LicenseType.Community` in `Program.cs` before any document generation | `Program.cs` | 4.3 | 5 min | No license exception on PDF generation |

**Phase 4 Total: ~5.5 hours**

---

## Phase 5 — AI "Improve with AI" Feature
**Goal:** User can click "Improve with AI" on Summary, Key Achievements, or Work Experience sections. AI generates improved text; user sees a diff modal and can Accept or Discard.
**Milestone:** AI suggestions display in a side-by-side diff dialog; Accept overwrites the section and auto-saves.

| # | Task | Files Created / Modified | Depends On | Effort | Acceptance |
|---|------|--------------------------|------------|--------|------------|
| 5.1 | **Create IAgentClientProvider interface** — Resolves `IChatClient` from agent settings (custom endpoint/model/key) or falls back to default OpenAI config | `Services/IAgentClientProvider.cs` | 1.3 | 15 min | Interface compiles |
| 5.2 | **Implement AgentClientProvider** — Reads `AgentSetting` for "CvSectionWriter" from MongoDB; if found, builds `OpenAIClient` with custom endpoint/key; else uses default from `AiOptions`. Returns `IChatClient`. | `Services/AgentClientProvider.cs` | 5.1, 1.5, 1.3 | 45 min | Custom and default resolution paths work |
| 5.3 | **Implement CvSectionWriterAgent** — Port from reference project. Accepts `(cvId, section, employerIndex?, engagementIndex?)`. Builds section-specific prompt with UK English rules. Calls `IChatClient.CompleteAsync()`. Returns improved text string. Sections: `"summary"` → paragraph, `"achievements"` → bullets, `"work"` → bullets (Case A engagement or Case B employer). | `Agents/CvSectionWriterAgent.cs` | 5.2, 1.4, 1.5 | 1.5 hr | Agent returns improved text for all 3 section types |
| 5.4 | **Add Improve endpoint** — `POST /api/cvs/{id}/improve` with body `{ section, employerIndex?, engagementIndex? }`. Rate-limited (`token-bucket`). Returns `{ original, improved }`. | `Endpoints/CvBuilderEndpoints.cs` | 5.3, 1.9 | 30 min | Endpoint returns original + improved text |
| 5.5 | **Build AiSuggestionModal component** — Tremor `Dialog` with side-by-side diff: left = "Original" (red highlights for removed text), right = "Improved" (green highlights for added text). "Accept" button applies improved text to form state and triggers auto-save. "Discard" button closes modal. Loading spinner while AI processes. | `src/components/AiSuggestionModal.tsx` | Phase 2 (Dialog), Phase 3 | 1.5 hr | Modal opens with diff; Accept updates form; Discard closes |
| 5.6 | **Wire "Improve with AI" buttons** — Connect buttons in `SummarySection`, `KeyAchievementsSection`, `ExperienceSection` to open `AiSuggestionModal` with correct params | Section components | 5.5, 5.4 | 30 min | Clicking "Improve" on any supported section opens AI modal with results |
| 5.7 | **Register AI services in DI** — Add `IAgentClientProvider`, `CvSectionWriterAgent` to DI container in `Program.cs` | `Program.cs` | 5.2, 5.3 | 15 min | Services resolve without error |

**Phase 5 Total: ~5 hours**

---

## Phase 6 — Profile, Settings, Polish & Deployment Readiness
**Goal:** Profile page, AI settings page, responsive design, error handling, loading states, and production build verification.
**Milestone:** All pages complete and polished; `dotnet publish` and `npm run build` succeed; app is deployment-ready.

| # | Task | Files Created / Modified | Depends On | Effort | Acceptance |
|---|------|--------------------------|------------|--------|------------|
| 6.1 | **Build Profile page** — `/profile/page.tsx` with Tremor form: Name, Email (read-only from Clerk), Preferences (dynamic list), Cover Letter Highlights (dynamic list). Auto-save or explicit Save button. | `src/app/profile/page.tsx` | 2.5, Phase 1 (profile endpoints) | 1 hr | Profile loads/saves from API; form validates |
| 6.2 | **Build Settings page** — `/settings/page.tsx` with Tremor form for AI agent settings: Agent Name (dropdown: "CvSectionWriter"), Endpoint URL, Model, API Key (masked input). Save/Reset per agent. | `src/app/settings/page.tsx` | 2.5, Phase 1 (settings endpoints) | 1 hr | Settings persist; custom AI config overrides default |
| 6.3 | **Global error boundary** — React error boundary wrapping the app. Shows user-friendly error page with "Try Again" action. | `src/app/error.tsx`, `src/app/not-found.tsx` | Phase 2 | 30 min | Uncaught errors show error page instead of white screen |
| 6.4 | **Loading states & skeletons** — Add skeleton loaders (Tremor-styled) to Dashboard, Editor, Profile, Settings pages during data fetch | All page components | Phase 2, 3 | 45 min | No blank flashes; skeleton shows during load |
| 6.5 | **Responsive design pass** — Ensure all pages (Dashboard, Editor, Profile, Settings, Sign-In) work on mobile, tablet, desktop. Editor collapses to stacked layout on mobile (form above, preview below). | All components | Phase 2, 3 | 1.5 hr | All pages usable at 375px, 768px, 1024px, 1440px widths |
| 6.6 | **Backend error handling** — Add global exception handler mapping common exceptions to ProblemDetails (404, 400, 500). Consistent error response shape. | `ErrorHandling/GlobalExceptionHandler.cs`, `Program.cs` | Phase 1 | 45 min | API errors return RFC 7807 ProblemDetails JSON |
| 6.7 | **Backend rate limiting** — Token-bucket rate limiter on `POST /improve` and `POST /pdf` endpoints (3 concurrent, 1 per 5s replenish) | `Program.cs` | Phase 1 | 20 min | Rapid-fire requests get 429; normal usage unaffected |
| 6.8 | **Production build verification** — Run `dotnet publish -c Release` and `npm run build`. Fix any build warnings/errors. Verify both outputs serve correctly. | Build artifacts | All phases | 1 hr | Both builds succeed with 0 errors; app runs from build output |
| 6.9 | **Write README.md** — Setup instructions, prerequisites (.NET 10 SDK, Node 20+, MongoDB Atlas, Clerk account), env var documentation, dev/prod run commands, architecture diagram | `README.md` | All phases | 45 min | New developer can set up and run the project from README alone |
| 6.10 | **SEO & metadata** — Add proper `<title>`, `<meta description>`, semantic HTML, heading hierarchy, unique IDs on all interactive elements | `layout.tsx`, all pages | Phase 2, 3 | 30 min | Each page has unique title/description; Lighthouse SEO ≥ 90 |

**Phase 6 Total: ~8 hours**

---

## Summary

```mermaid
gantt
    title CV Builder Implementation Phases
    dateFormat X
    axisFormat %s hrs

    section Phase 0: Scaffolding (Tremor Standard)
    Project skeleton & Tremor setup    :p0, 0, 2.5

    section Phase 1: Backend Core
    Models, MongoDB, CRUD endpoints    :p1, 2.5, 11

    section Phase 2: Frontend Core
    Tremor UI, Auth, Dashboard        :p2, 11, 19.5

    section Phase 3: Editor & Preview
    Split-pane editor + live A4 preview :p3, 19.5, 32.5

    section Phase 4: PDF Generation
    QuestPDF ATS PDF engine            :p4, 32.5, 38

    section Phase 5: AI Improve
    AI section rewriter + diff modal   :p5, 38, 43

    section Phase 6: Polish
    Profile, settings, responsive, deploy :p6, 43, 51
```

| Phase | Description | Tasks | Estimated Effort |
|-------|-------------|-------|------------------|
| **0** | Project Scaffolding & Dev Environment (Tremor Next.js Standard) | 8 | **~2.5 hrs** |
| **1** | Backend Core: Models, MongoDB, CRUD | 13 | **~8.5 hrs** |
| **2** | Frontend Core: Tremor UI, Auth, Dashboard | 11 | **~8.5 hrs** |
| **3** | Editor: Split-Pane Form + Live Preview | 13 | **~13 hrs** |
| **4** | PDF Generation (QuestPDF) | 6 | **~5.5 hrs** |
| **5** | AI "Improve with AI" Feature | 7 | **~5 hrs** |
| **6** | Profile, Settings, Polish & Deployment | 10 | **~8 hrs** |
| | **TOTAL** | **68 tasks** | **~51 hrs** |

> [!TIP]
> **Parallelisation opportunity:** Phase 4 (PDF) and Phase 5 (AI) are independent of each other and can be worked on in parallel after Phase 3 is complete. Phase 6 items (Profile, Settings) can also start as soon as Phase 2 endpoints are ready.

> [!IMPORTANT]
> **Critical path:** Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4/5 (parallel) → Phase 6
> 
> The longest sequential chain is **~32.5 hours** (Phases 0–3), after which PDF and AI work can proceed in parallel.
