# VaaniqWeb — CLAUDE.md

> Read this at the start of every session. Frontend counterpart to the Vaaniq Python monorepo.

**Backend repo:** `github.com/chandradot99/vaaniq` (FastAPI, runs on port 8000)
**This repo:** `github.com/chandradot99/vaaniq-web` (Next.js, runs on port 3000)

---

## What This Is

The frontend for Vaaniq — an open source AI agent platform. Businesses build and deploy agents for voice, chat, and WhatsApp using a visual graph editor.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 15 (App Router) | Framework + routing |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | Component library (Radix UI based, copy-paste into `components/ui/`) |
| React Flow (`@xyflow/react`) | Visual graph editor for agent builder |
| TanStack Query | Server state / API calls |
| Zustand + persist | Client state (auth tokens, UI state) |
| Node.js 25 (via nvm) | Runtime — always use `nvm use 25.8.0` |

---

## Project Structure

```
app/
  (auth)/           ← login, register — no sidebar
    login/page.tsx
    register/page.tsx
  (dashboard)/      ← protected pages — sidebar layout
    layout.tsx      ← sidebar nav
    agents/page.tsx
    api-keys/page.tsx
  layout.tsx        ← root layout (Providers, fonts)
  page.tsx          ← redirects to /agents
  providers.tsx     ← QueryClient + Toaster

components/
  ui/               ← shadcn components (never edit manually)

lib/
  api.ts            ← base fetch client (reads access_token from localStorage)
  utils.ts          ← cn() helper

store/
  auth.ts           ← Zustand auth store (tokens, user, logout)

types/
  index.ts          ← shared TypeScript types mirroring backend schemas
```

---

## API Client

All API calls go through `lib/api.ts`. It:
- Reads `access_token` from localStorage automatically
- Throws `ApiError(status, message)` on non-2xx
- Returns `undefined` on 204

```ts
import { api, ApiError } from "@/lib/api";

const agents = await api.get<Agent[]>("/v1/agents");
await api.post("/v1/agents", { name: "Bot" });
await api.delete(`/v1/agents/${id}`);
```

Backend base URL comes from `NEXT_PUBLIC_API_URL` in `.env.local` (default: `http://localhost:8000`).

---

## Auth Flow

Tokens stored in Zustand + `localStorage` (via `persist` middleware).
- `useAuthStore().setTokens(access, refresh, orgId, role)` — call after login/register
- `useAuthStore().logout()` — clears state + localStorage
- `localStorage.getItem("access_token")` — read by `lib/api.ts` automatically

No middleware-based route protection yet — add `middleware.ts` when needed.

---

## Adding shadcn Components

```bash
npx shadcn@latest add <component>
```

Never edit files in `components/ui/` manually — they're managed by shadcn.

---

## Running Locally

```bash
nvm use 25.8.0
npm run dev      # http://localhost:3000
```

Backend must be running on port 8000:
```bash
# In vaaniq/ repo:
uv run uvicorn vaaniq.server.main:app --reload
```

---

## Key Conventions

- All pages under `(dashboard)/` have the sidebar layout — add new pages there
- All pages under `(auth)/` have the centered card layout
- Use TanStack Query for all server state — `useQuery` to fetch, `useMutation` to write
- Use `toast.success()` / `toast.error()` from `sonner` for user feedback
- Types in `types/index.ts` mirror the backend Pydantic response schemas exactly

## What NOT To Do

- **Don't commit or push unless the user explicitly asks**
- **Don't edit `components/ui/` files** — use `npx shadcn@latest add` instead
- **Don't use `localStorage` directly outside of `lib/api.ts` and `store/auth.ts`**
- **Don't add API routes** — this app has no backend; all data comes from the FastAPI server
