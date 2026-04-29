# NaaviqWeb — CLAUDE.md

> Read this at the start of every session. Frontend counterpart to the Naaviq Python monorepo.

**Backend repo:** `github.com/chandradot99/naaviq` (FastAPI, runs on port 8000)
**This repo:** `github.com/chandradot99/naaviq-web` (Next.js, runs on port 3000)


## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 15 (App Router) | Framework + routing |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| `@base-ui/react` | Component primitives (used by all `components/ui/` files) |
| React Flow (`@xyflow/react`) | Visual graph editor for agent builder |
| TanStack Query | Server state / API calls |
| Zustand + persist | Client state (auth tokens, UI state) |
| pnpm 10 | Package manager — always use `pnpm`, never npm |
| Node.js 25 (via nvm) | Runtime — `.nvmrc` set to 25.8.0, run `nvm use` |

---

## Project Structure

```
app/                         ← Next.js routing ONLY — pages are thin shells
  (auth)/                    ← no sidebar, redirects to /agents if authenticated
    login/page.tsx
    register/page.tsx
  (dashboard)/               ← protected — redirects to /login if not authenticated
    layout.tsx               ← auth guard + <AppSidebar />, overflow-hidden (React Flow needs this)
    agents/
      page.tsx               ← <AgentsList />
      new/page.tsx           ← <CreateAgentForm />
      [id]/page.tsx          ← <AgentDetail agentId={params.id} />
    api-keys/page.tsx        ← <ApiKeysList />
  layout.tsx                 ← root layout (fonts, Providers)
  page.tsx                   ← redirects to /agents
  providers.tsx              ← ThemeProvider + QueryClient + Toaster

features/                    ← ALL business logic lives here (feature-based architecture)
  agents/
    api.ts                   ← agentsApi: list, getById, create, update, updateGraph, delete
    hooks/use-agents.ts      ← useAgents, useAgent, useCreateAgent, useUpdateAgent, useUpdateGraph, useDeleteAgent
    utils/graph-transform.ts ← toFlowGraph(), toGraphConfig(), NODE_LABELS/COLORS/DEFAULT_CONFIGS
    components/
      agents-list.tsx
      agent-card.tsx         ← Link to /agents/[id], delete stops propagation
      create-agent-form.tsx  ← name + language only; on success → /agents/[id]
      agent-detail.tsx       ← loading state + <GraphEditor>
      graph/                 ← React Flow visual editor
        graph-editor.tsx
        graph-editor-header.tsx
        agent-node.tsx
        node-palette.tsx
        node-config-panel.tsx
        config-forms/        ← one form per node type (10 files + index.ts)
  api-keys/
    api.ts
    constants.ts             ← SERVICES list, getServiceLabel()
    hooks/use-api-keys.ts
    components/
      api-keys-list.tsx
      api-key-row.tsx
  auth/
    components/
      login-form.tsx
      register-form.tsx

components/
  ui/                        ← shared UI primitives (built on @base-ui/react)
  layout/
    app-sidebar.tsx
    theme-toggle.tsx

lib/
  api.ts                     ← base fetch client (reads access_token from localStorage)
  utils.ts                   ← cn() helper

store/
  auth.ts                    ← Zustand auth store (_hasHydrated, accessToken, setTokens, logout)

types/
  index.ts                   ← TypeScript types mirroring backend schemas (Agent, GraphConfig, etc.)
```

### Where to put new code

| What | Where |
|---|---|
| New page | `app/(dashboard)/feature-name/page.tsx` — thin shell only |
| Page content | `features/feature-name/components/` |
| TanStack Query hooks | `features/feature-name/hooks/use-feature.ts` |
| API call functions | `features/feature-name/api.ts` |
| Shared across features | `components/layout/` or `components/ui/` |

---

## API Client

All calls go through `lib/api.ts` — reads `access_token` from localStorage, throws `ApiError(status, message)` on non-2xx.

```ts
import { api } from "@/lib/api";
api.get("/v1/agents")
api.post("/v1/agents", { name: "Bot" })
api.patch(`/v1/agents/${id}`, { name: "New" })
api.put(`/v1/agents/${id}/graph`, graphConfig)
api.delete(`/v1/agents/${id}`)
```

Backend base URL: `NEXT_PUBLIC_API_URL` in `.env.local` (default: `http://localhost:8000`).

---

## Auth Flow

Zustand + `localStorage` via `persist` middleware.
- `_hasHydrated` flag (set via `onRehydrateStorage`) — check this before reading auth state in components
- Dashboard layout redirects to `/login` if `!hasHydrated || !accessToken`
- Auth layout redirects to `/agents` if already authenticated

---

## Adding UI Components

**Do NOT use `pnpm dlx shadcn@latest add`** — the CLI requires Node 20+ but the project runs Node 18. Build components manually using `@base-ui/react` primitives (same pattern as existing `components/ui/` files). See `components/ui/switch.tsx` as an example of a hand-built component.

---

## Layout Rules

- Dashboard `<main>` is `overflow-hidden` — required for React Flow to fill viewport
- Pages that need scrolling must add `overflow-auto` to their own outermost container
- The graph editor uses `h-full flex flex-col` / `flex-1 min-h-0` to fill the viewport

---

## Running Locally

```bash
nvm use          # picks up .nvmrc → Node 25.8.0
pnpm dev         # http://localhost:3000
```

Backend on port 8000:
```bash
cd ../Naaviq && uv run uvicorn naaviq.server.main:app --reload
```

---

## Key Conventions

- Pages are thin shells — all logic and UI in `features/`
- TanStack Query for all server state — `useQuery` to fetch, `useMutation` to write
- `toast.success()` / `toast.error()` from `sonner` for user feedback
- Types in `types/index.ts` mirror backend Pydantic schemas exactly
- `isDirty` / setState tracking: never call `setState` synchronously inside `useEffect` (lint error) — wrap event handlers instead
- **After every change: run `pnpm lint` and fix all errors before considering the task done**

## What NOT To Do

- **Don't commit or push unless explicitly asked**
- **Don't use npm or npx** — always `pnpm` / `pnpm dlx`
- **Don't use `pnpm dlx shadcn@latest add`** — Node 18 incompatible; build manually
- **Don't call `setState` synchronously inside `useEffect`** — triggers lint error `react-hooks/set-state-in-effect`
- **Don't use `localStorage` directly** outside of `lib/api.ts` and `store/auth.ts`
- **Don't add API routes** — no backend here; all data from FastAPI server
