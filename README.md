<p align="center">

```
 ____             _     __        __
|  _ \ ___  _   _| |_ __\ \      / /__  __ ___   _____ _ __
| |_) / _ \| | | | __/ _ \ \ /\ / / _ \/ _` \ \ / / _ \ '__|
|  _ < (_) | |_| | ||  __/\ V  V /  __/ (_| |\ V /  __/ |
|_| \_\___/ \__,_|\__\___| \_/\_/ \___|\__,_| \_/ \___|_|

 Booking Infrastructure for Bali Tourism
```

</p>

<p align="center">
  <strong>Embeddable booking widgets, activity management, and accommodation dashboards â built for Bali's tourism ecosystem.</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-1.0.0-blueviolet?style=flat-square" alt="Version" /></a>
  <a href="#"><img src="https://img.shields.io/badge/status-production-00c853?style=flat-square" alt="Status" /></a>
  <a href="#"><img src="https://img.shields.io/badge/widgets-embeddable-blue?style=flat-square" alt="Widgets" /></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" /></a>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" /></a>
</p>

---

## The Problem

Bali tourism operators â hotels, villas, activity providers, tour guides â are stuck managing bookings through WhatsApp, spreadsheets, and disconnected OTAs. There's no simple, white-label system they can embed directly on their own site that handles the full booking lifecycle: discovery, reservation, payment, and ticket management.

## The Solution

**RouteWeaver** is a modular booking infrastructure platform. It provides embeddable widgets for accommodations and activities, admin dashboards for operators, and a complete ticket management system with payment processing. Drop a widget on any website and you have a fully functional booking engine in minutes.

No vendor lock-in. No commission fees. Your bookings, your data.

---

## Features

```
$ routeweaver --capabilities
```

| Feature | Description |
|---|---|
| ð¨ **Accommodation Dashboard** | Full management panel for hotels, villas, and guesthouses |
| ð **Activity Dashboard** | Manage tours, excursions, classes, and experiences |
| ð§© **Embeddable Widgets** | Drop-in booking widgets â embed on any website with one script tag |
| ðï¸ **Ticket Management** | Issue, modify, and cancel tickets with full audit trail |
| ð³ **Payment Processing** | Integrated payment flow â secure checkout, confirmations, receipts |
| âï¸ **Admin Panel** | Centralized admin with module selector and operator management |
| ð **Booking Analytics** | Track bookings, revenue, occupancy rates, and conversion |
| ð **Calendar Sync** | Availability calendar with real-time sync across channels |
| ð **Module Architecture** | Pick and choose â accommodations, activities, or both |
| ð¨ **White-Label Ready** | Customizable widgets that match your brand's look and feel |

---

## Architecture

```
route-weaver-system/
âââ src/
â   âââ components/
â   â   âââ accommodation/     # Accommodation dashboard & management
â   â   âââ activity/          # Activity dashboard & management
â   â   âââ admin/             # Admin panel, module selector
â   â   âââ booking/           # Booking flow & checkout
â   â   âââ tickets/           # Ticket management (modify/cancel)
â   â   âââ widgets/           # Embeddable booking widgets
â   â   âââ payments/          # Payment processing UI
â   â   âââ ui/                # Base component library (shadcn/ui)
â   âââ hooks/                 # Custom React hooks
â   âââ lib/                   # Utilities, API clients, helpers
â   âââ pages/                 # Route-level page components
â   âââ integrations/          # Supabase client, auth, storage
âââ supabase/
â   âââ migrations/            # PostgreSQL schema migrations
â   âââ functions/             # Edge Functions (payments, webhooks)
âââ widgets/
â   âââ embed.js               # Embeddable widget loader script
âââ public/                    # Static assets
```

---

## System Design

```
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â                     OPERATOR LAYER                          â
â                                                             â
â   ââââââââââââââââââ  ââââââââââââââ  ââââââââââââââââââ   â
â   â Accommodation  â  â  Activity   â  â    Admin       â   â
â   â  Dashboard     â  â  Dashboard  â  â    Panel       â   â
â   âââââââââ¬âââââââââ  âââââââ¬âââââââ  âââââââââ¬âââââââââ   â
â           âââââââââââââââââââ¼âââââââââââââââââââ            â
âââââââââââââââââââââââââââââââ¼ââââââââââââââââââââââââââââââââ
                              â
âââââââââââââââââââââââââââââââ¼ââââââââââââââââââââââââââââââââ
â                      CORE ENGINE                            â
â                              â                              â
â   ââââââââââââ  âââââââââââââ¼âââââââââââ  âââââââââââââââ  â
â   â Booking  â  â  Module Orchestrator  â  â   Ticket    â  â
â   â Engine   â  â  (Accom + Activity)   â  â   Manager   â  â
â   ââââââââââââ  ââââââââââââââââââââââââ  âââââââââââââââ  â
â                                                             â
â   ââââââââââââ  ââââââââââââââââââââââââ  âââââââââââââââ  â
â   â Payment  â  â  Calendar & Avail.   â  â  Analytics   â  â
â   â Processorâ  â  Engine              â  â  Engine      â  â
â   ââââââââââââ  ââââââââââââââââââââââââ  âââââââââââââââ  â
âââââââââââââââââââââââââââââââ¬ââââââââââââââââââââââââââââââââ
                              â
âââââââââââââââââââââââââââââââ¼ââââââââââââââââââââââââââââââââ
â                    WIDGET LAYER                             â
â                              â                              â
â   ââââââââââââââââââââââââââââ¼âââââââââââââââââââââââââââ   â
â   â              Embeddable Widget Engine                â   â
â   â     <script src="routeweaver.js"></script>           â   â
â   â                                                     â   â
â   â   âââââââââââââââ         âââââââââââââââââââ      â   â
â   â   â  Accom      â         â   Activity       â      â   â
â   â   â  Widget     â         â   Widget         â      â   â
â   â   âââââââââââââââ         âââââââââââââââââââ      â   â
â   âââââââââââââââââââââââââââââââââââââââââââââââââââââââ   â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
                              â
âââââââââââââââââââââââââââââââ¼ââââââââââââââââââââââââââââââââ
â                   SUPABASE LAYER                            â
â                              â                              â
â   âââââââââââ  ââââââââââââââ¼ââââ  âââââââââââââââââââââ   â
â   â  Auth   â  â  PostgreSQL    â  â  Edge Functions    â   â
â   â         â  â  + RLS         â  â  (Payments, Hooks) â   â
â   âââââââââââ  ââââââââââââââââââ  âââââââââââââââââââââ   â
â                                                             â
â   âââââââââââ  ââââââââââââââââââ  âââââââââââââââââââââ   â
â   â Storage â  â  Realtime      â  â  Cron / Scheduled  â   â
â   â (Media) â  â  (WebSockets)  â  â  Jobs              â   â
â   âââââââââââ  ââââââââââââââââââ  âââââââââââââââââââââ   â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
```

---

## Widget Integration

Embed a booking widget on any website in seconds:

```html
<!-- Accommodation Widget -->
<div id="routeweaver-accommodation" data-property-id="YOUR_PROPERTY_ID"></div>
<script src="https://your-domain.com/widgets/embed.js"></script>

<!-- Activity Widget -->
<div id="routeweaver-activity" data-operator-id="YOUR_OPERATOR_ID"></div>
<script src="https://your-domain.com/widgets/embed.js"></script>
```

Widgets are fully responsive, customizable via CSS variables, and work on any framework or static site.

---

## Tech Stack

```js
stack = {
  "runtime":    ["Vite 5"],
  "framework":  ["React 18"],
  "language":   ["TypeScript 5 (strict)"],
  "styling":    ["Tailwind CSS", "shadcn/ui"],
  "backend":    ["Supabase (PostgreSQL + Auth + Storage + Realtime)"],
  "edge":       ["Supabase Edge Functions (Deno)"],
  "payments":   ["Integrated payment processing"],
  "widgets":    ["Custom embeddable iframe/script system"],
  "calendar":   ["Real-time availability engine"],
  "auth":       ["Supabase Auth (operators + admins)"]
}
```

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/tanguyors/route-weaver-system.git
cd route-weaver-system

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your Supabase URL, anon key, and service keys

# Run the development server
npm run dev

# Build for production
npm run build
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Deployment

Deploy to any static hosting provider. The widget engine serves from the same domain or a CDN.

```bash
# Build
npm run build

# Deploy to Vercel / Netlify / Cloudflare Pages
# Output directory: dist/
```

---

## Stats

```
Production-ready | Modular architecture
TypeScript | React | Supabase | Widget-first
```

---

<p align="center">
  <strong>Built by <a href="https://github.com/tanguyors">@tanguyors</a></strong>
</p>

<p align="center">
  <em>Every booking starts somewhere. Make it seamless.</em>
</p>
