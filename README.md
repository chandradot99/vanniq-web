# Vaaniq Web

The frontend for [Vaaniq](https://github.com/chandradot99/vaaniq) — an open source AI agent platform. Build and deploy agents for voice calls, web chat, and WhatsApp using a visual drag-and-drop graph editor.

## Features

- **Visual agent builder** — drag-and-drop graph editor powered by React Flow
- **Multi-channel** — voice, chat, and WhatsApp from one interface
- **BYOK management** — bring and manage your own API keys for every provider
- **Live session debugger** — watch your agent think in real time

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [React Flow](https://reactflow.dev)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs)

## Getting Started

### Prerequisites

- Node.js 25+ (via [nvm](https://github.com/nvm-sh/nvm))
- pnpm 10+
- [Vaaniq backend](https://github.com/chandradot99/vaaniq) running on port 8000

### Setup

```bash
# 1. Clone
git clone git@github.com:chandradot99/vanniq-web.git
cd vanniq-web

# 2. Use correct Node version
nvm use

# 3. Install dependencies
pnpm install

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL if your backend runs elsewhere

# 5. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL of the Vaaniq backend API |

## Backend

This frontend requires the [Vaaniq backend](https://github.com/chandradot99/vaaniq). See that repo for setup instructions.

## License

MIT
