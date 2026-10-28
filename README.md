# CV Builder

A standalone, professional CV Builder web application with pixel-perfect ATS-compliant single-column PDF export, real-time reactive preview, and AI-assisted bullet polishing.

## Architecture

- **Frontend:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Tremor Raw UI design system, Radix UI primitives, Remix Icons, Geist typography, Clerk Authentication.
- **Backend:** .NET 10 Minimal API, QuestPDF (2025.4.0) ATS PDF generation engine, MongoDB.Driver 3.x with MongoDB Atlas persistence, Microsoft.Extensions.AI / OpenAI integration.
- **Hosting & Runtime:** Docker-free standalone setup (`dotnet run` + `npm run dev`).

## Project Structure

```text
cvbuilder/
├── backend/
│   └── CvBuilder.Backend/     # .NET 10 Minimal API & QuestPDF service
├── frontend/                  # Next.js 16 + Tremor Raw frontend application
├── docs/                      # Architectural and implementation specifications
├── README.md                  # This file
└── start-dev.ps1              # Local development startup script
```

## Quick Start

### Prerequisites
- .NET 10 SDK (`dotnet --version` >= 10.0)
- Node.js (`node --version` >= 20.0)
- npm (`npm --version` >= 10.0)

### Development
1. **(Optional) Local MongoDB via Docker:**
   ```powershell
   # Start MongoDB (+ Mongo Express web UI on http://localhost:8081)
   docker compose up -d
   ```
2. **Run both backend (`http://localhost:5139`) and frontend (`http://localhost:3000`):**
   ```powershell
   .\start-dev.ps1
   ```
   *(The script will also automatically detect and start `cvbuilder-mongo` if Docker is running).*

