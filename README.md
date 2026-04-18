<div align="center">

# 🌾 KrishiSetu

### Farm-to-Table Marketplace connecting Indian farmers directly with customers

*No middlemen. Fair prices. Farm-fresh produce delivered to your door.*

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

[Live Demo](#) · [Android APK](#) · [Video Walkthrough](#) · [Report Bug](https://github.com/Shradda23623/krishisetu/issues)

</div>

---

## About the Project

**KrishiSetu** (Hindi for *"Farmer's Bridge"*) is a full-stack e-commerce platform that lets Indian farmers list their produce — vegetables, fruits, dairy, grains, spices, pickles, dry fruits, jaggery and oils — and sell it directly to consumers. The platform removes middlemen from the supply chain so farmers earn more and customers pay less for fresher produce.

The app supports **two user roles** with separate dashboards (Farmer and Customer), real-time **Stripe-powered checkout**, **Google Maps**-based nearby-farmer discovery, and a **multi-language UI** so it's accessible across India.

> Built as a final-year student project to demonstrate full-stack web development with modern tools and real backend integrations.

---

## Key Features

| Area | Feature |
|---|---|
| **Auth** | Email/password signup & login with role selection (Farmer / Customer), password reset, protected routes, Supabase Row-Level Security |
| **Shop** | Browse by 9 product categories, full-text search, filter by price range, organic-only toggle, product reviews & ratings |
| **Checkout** | Real **Stripe Embedded Checkout** with webhook-driven order confirmation |
| **Farmer Dashboard** | Add / edit / delete products, upload images, set delivery location via map picker, track & update order status |
| **Customer Dashboard** | View all orders, track delivery status, view order details and history |
| **Nearby Farmers** | Google Maps integration with haversine distance calculation to find farmers near you |
| **i18n** | Multi-language support (English + regional languages) via React Context |
| **Themes** | System-aware dark / light mode toggle |
| **Responsive** | Mobile-first design with a dedicated mobile bottom navigation bar |
| **Performance** | React Query caching, skeleton loading states, lazy-loaded images |

---

## Tech Stack

**Frontend**
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for build tooling
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- [React Router](https://reactrouter.com/) for routing
- [TanStack React Query](https://tanstack.com/query) for server state
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for forms & validation
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide React](https://lucide.dev/) for icons

**Backend & Infrastructure**
- [Supabase](https://supabase.com/) — PostgreSQL database, authentication, Row-Level Security, Storage
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno) — serverless API for Stripe checkout + webhook handling
- [Stripe](https://stripe.com/) — embedded checkout & payment processing
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) — location picker & nearby-farmer map

**Quality & Tooling**
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) — unit tests
- [Playwright](https://playwright.dev/) — end-to-end tests
- [ESLint](https://eslint.org/) + [TypeScript-ESLint](https://typescript-eslint.io/) — code quality
- [GitHub Actions](https://github.com/features/actions) — CI for lint, test, build

---

## Architecture

```
┌───────────────────────┐      ┌────────────────────────┐
│   React + Vite SPA    │      │   Supabase Postgres    │
│   (hosted on Vercel)  │◄────►│   + Row-Level Security │
│                       │      │   + Auth               │
│   • Customer UI       │      └──────────┬─────────────┘
│   • Farmer UI         │                 │
│   • Cart / Checkout   │                 │ triggers / RPC
└───────────┬───────────┘                 ▼
            │                  ┌──────────────────────────┐
            │  fetch()         │  Supabase Edge Functions │
            └─────────────────►│  (Deno, serverless)      │
                               │                          │
                               │  • create-checkout ──────┼──► Stripe API
                               │  • payments-webhook ◄────┼──  Stripe webhook
                               │  • get-maps-key ─────────┼──► Google Maps
                               └──────────────────────────┘
```

Payment flow: customer clicks checkout → frontend calls `create-checkout` edge function → edge function creates Stripe session → embedded checkout renders → on success Stripe hits the `payments-webhook` edge function → order status is flipped to `confirmed` in the database.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.x or newer
- A free [Supabase](https://supabase.com/) account
- A free [Stripe](https://stripe.com/) account (test mode is fine)
- *(Optional)* A [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key) — only needed for the Nearby Farmers map

### 1. Clone & install

```bash
git clone https://github.com/Shradda23623/krishisetu.git
cd krishisetu
npm install
```

### 2. Configure environment variables

Copy the template and fill in your own values:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholders with keys from your Supabase and Stripe projects. Stripe's publishable key goes into a second file:

```bash
echo 'VITE_PAYMENTS_CLIENT_TOKEN="pk_test_your_key_here"' > .env.development
```

### 3. Set up Supabase

In your Supabase project, run the SQL migrations from `supabase/migrations/` (in chronological order) to create all the tables, policies and triggers. Then deploy the edge functions:

```bash
npx supabase functions deploy create-checkout
npx supabase functions deploy payments-webhook
npx supabase functions deploy get-maps-key
```

Add your Stripe secret key as a Supabase secret:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
```

### 4. Run the app

```bash
npm run dev
```

Open **http://localhost:8080** in your browser.

---

## Project Structure

```
krishisetu/
├── public/                      # Static assets (logo, favicon)
├── src/
│   ├── assets/                  # Category images & hero backgrounds
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (Button, Card, Dialog...)
│   │   ├── skeletons/           # Loading skeleton components
│   │   └── *.tsx                # Feature components (Navbar, ProductCard, Map...)
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.tsx      #   Session + role management
│   │   ├── CartContext.tsx      #   Persistent shopping cart
│   │   ├── I18nContext.tsx      #   Language switching
│   │   └── ThemeContext.tsx     #   Dark / light mode
│   ├── hooks/                   # Custom hooks (useDbProducts, useOrders...)
│   ├── integrations/
│   │   └── supabase/            # Supabase client + auto-generated DB types
│   ├── lib/                     # Utilities (stripe, productUtils, cn)
│   ├── pages/                   # Route components (16 pages)
│   ├── App.tsx                  # Router + providers
│   └── main.tsx                 # Entry point (wrapped in ErrorBoundary)
├── supabase/
│   ├── migrations/              # SQL schema migrations
│   └── functions/               # Deno edge functions
├── .github/workflows/ci.yml     # GitHub Actions CI
└── tests/e2e/                   # Playwright E2E tests
```

---

## Testing

```bash
npm run lint          # ESLint
npm test              # Vitest unit tests (run once)
npm run test:watch    # Vitest in watch mode
npx playwright test   # Playwright E2E tests
```

Every push to `main` runs lint + unit tests + a production build via **GitHub Actions** (`.github/workflows/ci.yml`).

---

## Deployment

The frontend is a static bundle that runs anywhere. The recommended free path:

1. Push this repo to GitHub
2. Import it into [Vercel](https://vercel.com/) (it auto-detects Vite)
3. Add all variables from `.env.example` in **Project Settings → Environment Variables**
4. Deploy

Supabase hosts the database and edge functions. Stripe stays in test mode until you're ready to go live.

---

## Roadmap

- [ ] Android build via Capacitor (APK ready)
- [ ] iOS build via Capacitor
- [ ] Push notifications for order updates
- [ ] Farmer-customer in-app chat
- [ ] AI-powered crop recommendation for farmers
- [ ] Real-time delivery tracking map
- [ ] Regional language voice search

---

## Contributing

Contributions, issues and feature requests are welcome. Fork the repo, create a feature branch, open a PR.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

## Author

**Shradda Bharti**
- GitHub: [@Shradda23623](https://github.com/Shradda23623)

---

## Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Supabase](https://supabase.com/) for the backend-as-a-service
- [Stripe](https://stripe.com/) for payments
- All the farmers who inspired this project

<div align="center">

**If you find this project useful, please give it a star on GitHub!**

</div>
