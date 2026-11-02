# ClassPulse — Intelligent Classroom Attendance & Academic Registry

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dhananjaya-noir/classpulse)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-teal.svg)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A modern, high-speed, cloud-connected classroom attendance management application designed to make taking attendance fast, reliable, and effortless.

Built specifically for high-density classrooms (e.g. 70+ students), **ClassPulse** reduces the manual attendance call-out process to a few seconds:
1. Open the session.
2. Tap **"MARK EVERYONE PRESENT"**.
3. Identify and tap absent students to mark them **Absent**.
4. Instantly download the verified absentee list or multi-sheet Excel / PDF report.

---

## 🌟 Key Features

- **⚡ High-Speed Attendance Engine**:
  - One-click **MARK EVERYONE PRESENT** bulk action.
  - One-click status toggling (`Present [P]`, `Absent [A]`, `Late [L]`, `Excused [E]`).
  - Search by USN or Name with instant `/` keyboard shortcut.
  - Undo stack for reversing individual and batch changes.
  - Zero-friction workflow: mark 70 students in under 15 seconds.

- **📁 Multi-Format Report & Export Engine**:
  - **Download Absentees Only**: Instant one-click download for faculty submission.
  - **Excel (.xlsx)**: 3-sheet structured workbook:
    - *Sheet 1: Absentees* (Serial No, USN, Full Name)
    - *Sheet 2: Complete Attendance* (Serial No, USN, Full Name, Status, Time Marked)
    - *Sheet 3: Attendance Summary* (Course, Semester, Section, Date, Counts, Percentage)
  - **CSV (.csv)**: UTF-8 BOM encoded for seamless opening in Microsoft Excel and Google Sheets.
  - **PDF (.pdf)**: Formal, print-ready document with institutional header, KPI statistics cards, and formatted absentee tables.
  - **Zero-Absentee Handling**: Automatically detects and formats 100% attendance without generating blank lists.

- **👥 Student Roster Management**:
  - Bulk import via CSV, Excel (`.xlsx`), or direct spreadsheet copy-paste.
  - Intelligent column detection (USN, Roll Number, Student Name, Section) with fallback column mapper.
  - Validation engine: detects duplicates within import batch, duplicates against existing database records, and malformed rows.
  - Built-in **70-Student Realistic Demo Roster** for immediate testing.
  - Downloadable CSV/Excel roster templates.

- **🔒 Security & Relational Database Architecture**:
  - PostgreSQL hosted on Supabase.
  - Row Level Security (RLS) enabled across all tables.
  - Enforced data isolation: users can only read and write their own classrooms.
  - Preserves historical name and USN snapshots in attendance records even after roster updates.

- **📱 Offline Resilience & Cloud Sync**:
  - Local caching via IndexedDB (Dexie).
  - Background synchronization engine with idempotent replay.
  - Visual sync state indicators: *Cloud Synced*, *Saving...*, *Pending Offline*, and *Local Sandbox*.

- **🎨 Modern Editorial Design System**:
  - Inspired by Linear, Raycast, and Stripe.
  - Warm neutral surfaces, sophisticated emerald/teal accents, restrained coral status badges.
  - Tabular numerals (`tabular-nums`) for crisp alignment of USNs and percentages.
  - Persistent Light and Dark themes with zero visual flicker.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling & Motion** | Tailwind CSS 4, Framer Motion, Lucide React |
| **Backend & Database** | Supabase, PostgreSQL 17, Row Level Security (RLS) |
| **Data & File Processing** | SheetJS (`xlsx`), PapaParse, jsPDF, jsPDF-AutoTable |
| **Local Storage** | Dexie (IndexedDB) with optimistic offline sync |
| **Hosting & CI/CD** | Vercel (Production Static SPA), GitHub |
| **Quality Assurance** | Vitest (Automated test suites) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+` (Tested on Node `v24`)
- npm or pnpm
- A Supabase account (free tier compatible)
- A Vercel account

### 1. Clone the Repository

```bash
git clone https://github.com/dhananjaya-noir/classpulse.git
cd classpulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
VITE_DEFAULT_TIMEZONE=Asia/Kolkata
```

> **Note**: If you run ClassPulse without Supabase keys, it automatically runs in **Local Sandbox Mode**, using local IndexedDB storage so you can test all features offline right away.

### 4. Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Open `supabase/schema.sql` from this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
4. The script creates:
   - `profiles`
   - `classes`
   - `students`
   - `class_enrollments`
   - `subjects`
   - `attendance_sessions`
   - `attendance_records`
   - Indexes and Row Level Security (RLS) policies.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

Run the Vitest test suite:

```bash
npm test
# or
npx vitest run
```

Tests verify:
- 70-student bulk marking workflows.
- Attendance percentage math (`Present / Total * 100`).
- Duplicate USN and malformed row detection.
- Undo stack reversion.
- Tab-separated spreadsheet paste parsing.

---

## 🚢 Vercel Deployment Guide

ClassPulse is pre-configured with `vercel.json` for single-page application (SPA) routing on Vercel.

### Option A: Automatic Git Deployment (Recommended)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete ClassPulse production release"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com).
3. Click **Add New... -> Project**.
4. Import your `classpulse` repository from GitHub.
5. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL (`https://<project-ref>.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase publishable/anon key
6. Click **Deploy**. Vercel will build and serve your app globally on edge CDN.

### Option B: Vercel CLI Deployment

```bash
npm i -g vercel
vercel login
vercel
```

---

## 📂 Project Structure

```
classpulse/
├── public/                 # Static assets & favicon
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── attendance/    # Fast attendance tables, stats bar, finalize modal
│   │   ├── common/        # Buttons, Badges, Modals, Inputs, StatCards
│   │   ├── layout/        # AppShell, Header, Sidebar
│   │   └── roster/        # Student modals, class creation, Excel/CSV importer
│   ├── contexts/          # AuthContext, ThemeContext, ToastContext
│   ├── lib/
│   │   ├── db.ts          # Dexie IndexedDB models
│   │   ├── export.ts      # Excel (3 sheets), CSV (UTF-8 BOM), and PDF engines
│   │   ├── import.ts      # Auto-header detection and validation
│   │   ├── sampleData.ts  # 70-student realistic engineering roster
│   │   ├── storage.ts     # Unified repository (Supabase + Local Cache)
│   │   ├── supabase.ts    # Supabase client singleton
│   │   ├── sync.ts        # Idempotent cloud sync queue
│   │   └── utils.ts       # Percentage math and date formatters
│   ├── pages/             # Dashboard, Attendance, Roster, History, Reports, Settings
│   ├── tests/             # Vitest test specs
│   ├── types/             # TypeScript models for Supabase and application state
│   ├── App.tsx            # Main application router
│   ├── main.tsx           # React DOM root with context providers
│   └── index.css          # Design system & Tailwind CSS configuration
├── supabase/
│   ├── migrations/        # SQL migration files
│   └── schema.sql         # Consolidated database schema & RLS rules
├── vercel.json            # Vercel SPA routing configuration
└── package.json
```

---

## 📄 License

MIT License. Designed and engineered for academic productivity.
