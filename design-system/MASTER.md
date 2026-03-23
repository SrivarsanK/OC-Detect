# OralGuard Master Design System

> Source of Truth for Visual Design & UX Consistency. Inspired by UI/UX Pro Max Intelligence.

## 1. Product Context
- **Type**: Healthcare / Specialist Diagnostic Tool
- **Target Audience**: Oncologists, Dental Surgeons, Triage Specialists
- **Core Value**: AI-assisted triage with high explainability (XAI)
- **Desired Tone**: Precise, Authoritative, Secure, Modern

## 2. Visual Style: "Specialist Glass"
- **Theme**: Dark Mode by default (Preferred by clinical specialists for reduced eye strain)
- **Primary Style**: Minimalism with subtle Glassmorphism
- **Border Radius**: `lg` (12px) for cards, `full` for status indicators
- **Effects**: 
  - Glass: `bg-slate-900/50 backdrop-blur-md border border-slate-800`
  - Glow: `shadow-[0_0_15px_rgba(6,182,212,0.1)]` (Cyan glow for active cases)

## 3. Color Palette: "Clinical Deep"
| Token | HEX | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| Background | `#020617` | `bg-slate-950` | Root background |
| Surface | `#0f172a` | `bg-slate-900` | Section/Card background |
| Primary (Accent) | `#06b6d4` | `text-cyan-500` | Branding, primary actions, active state |
| Success (Low Risk) | `#10b981` | `text-emerald-500` | Healthy tissue, sync success |
| Warning (Uncertain) | `#f59e0b` | `text-amber-500` | Re-scan required, uncertainty |
| Critical (High Risk) | `#f43f5e" | `text-rose-500` | Positive finding, high triage priority |
| Text Main | `#f8fafc` | `text-slate-50` | Primary content |
| Text Muted | `#94a3b8` | `text-slate-400` | Labels, timestamps, metadata |

## 4. Typography: "ClearScan"
- **Headings**: `font-outfit` (Outfit) - Modern, clean, professional.
- **Body**: `font-inter` (Inter) - High legibility for data.
- **Weights**: 
  - `Header`: 600 (Semibold)
  - `Labels`: 500 (Medium)
  - `Body`: 400 (Regular)

## 5. UI Components & Layout
- **Layout**: Bento Grid (Dynamic cards with varying sizes)
- **Navigation**: Sidebar (Icon-centric, Collapsible)
- **Tables**: Row-based with hover highlighting and "priority status" color strips
- **Charts**: 
  - Confidence: Radial Gauge
  - Case Distribution: Area Chart (Subtle)

## 6. UX Guidelines (Specialist Mode)
- **Density**: 12px or 16px gaps (`gap-3` or `gap-4`). Prioritize information over whitespace.
- **Transitions**: `duration-200 ease-out` for hover states.
- **Accessibility**: 
  - Minimum 4.5:1 contrast for clinical findings.
  - Interactive areas ≥44px.
- **Anti-Patterns to Avoid**:
  - No emojis for status (Use Lucide Icons).
  - No "friendly/playful" animations (Keep it professional).
  - No raw Hex colors in code (Use Tailwind tokens).
