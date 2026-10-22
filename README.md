# laundry-web — Folded web app

Customer and operations web interface for the Folded managed laundry service.
It talks to `laundry-api` over REST (`/api/v1`). See the product docs in the
`laundry-api` repository under `docs/`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS (lightweight UI primitives in `src/components/ui.tsx`, shaped so
  shadcn/ui can be adopted later)
- TanStack Query for server state
- React Hook Form + Zod for forms

## Development

Prerequisites: Node.js 20 LTS (`.nvmrc`) and pnpm (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE to your laundry-api
pnpm dev                     # http://localhost:3000 (run the API on another port)
```

Checks (all run in CI):

```bash
pnpm lint
pnpm typecheck
pnpm test        # Vitest + Testing Library (API calls mocked)
pnpm build
```

## What's implemented (Milestone 6: customer + admin)

- Login (phone + password) with session cookie + CSRF double-submit
- Services & prices (per-zone), home page
- Customer booking flow: zone → services/quantities → address → pickup window →
  server-computed quote → approve
- Customer "my orders" with quote approval
- Admin order queue: confirm orders and assign a partner

The API client (`src/lib/api/client.ts`) sends `credentials: 'include'` and the
`x-csrf-token` header on mutations, and unwraps the API's `{ data } / { error }`
envelopes.

## Not yet included / notes

- Partner and rider interfaces are deferred to a follow-up milestone.
- Auth uses cookies from `laundry-api`; in production the web and API must share
  a parent domain (or CORS + cookie settings configured) for the session and
  CSRF cookies to apply.
- There is no live end-to-end test in CI against a running API; tests mock the
  network. Run the app against a real `laundry-api` + MongoDB before the pilot.
