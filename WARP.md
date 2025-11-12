# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Memed.fun — React Router v7 + Vite + TypeScript SSR app with Web3 (Wagmi/ConnectKit) and Lens Protocol integration.

Commands
- Install dependencies
  - npm install
- Development server (SSR with HMR)
  - npm run dev
- Type checking
  - npm run typecheck
- Production build (outputs build/client and build/server)
  - npm run build
- Run built server
  - npm start
- Docker (from README)
  - Build: docker build -t memed .
  - Run: docker run -p 3000:3000 memed

Notes
- Lint: No linter configuration or scripts detected.
- Tests: No test runner configured; there are no test scripts. Single-test guidance not applicable.
- Node 18+ is expected (see README); create a .env for VITE_* variables used at build/runtime.

Environment
Create a .env in the project root. Key variables referenced in README and code:
- VITE_API_BASE_URL, VITE_API_TIMEOUT, VITE_API_RETRIES, VITE_ENABLE_API_CACHE
- VITE_WALLETCONNECT_PROJECT_ID, VITE_ALCHEMY_API_KEY
- VITE_LENS_API_URL
- VITE_IPFS_GATEWAY

High-level architecture
- Runtime/Build
  - Vite config: vite.config.ts uses plugins [tailwindcss(), reactRouter(), tsconfigPaths()].
  - React Router v7 SSR: build via react-router build; serve via react-router-serve using build/server/index.js (npm start).
  - TypeScript strict config with path alias '@/*' -> app/* (tsconfig.json).
- Routing/Layout
  - File-based routes under app/routes (e.g., home.tsx, about.tsx, tokenomics.tsx, and nested app/* routes).
  - routes.ts holds route configuration; $.tsx provides the 404 route; root.tsx is the root layout.
- UI/Components
  - app/components contains domain-focused UI (home, app sections like explore/launch/meme, shared components like WalletConnection, Web3ErrorBoundary, etc.).
  - Tailwind CSS used for styling (tailwindcss v4 plugin in Vite).
- Data & API layer
  - app/lib/api: client.ts (HTTP client with retries), config.ts (API/env), loaders.ts (React Router loaders).
  - app/hooks/api: useApi.ts (generic), useMemedApi.ts and domain hooks (auth, tokens, battles, staking, analytics, etc.).
  - React Router loaders integrate data fetching on route boundaries. TanStack Query is available in dependencies for client-side cache/queries.
- Web3 & Lens
  - app/providers/Web3Provider.tsx sets up Wagmi/ConnectKit context.
  - app/hooks/contracts and app/abi* wrap contract interactions (MemedToken, MemedWarriorNFT, battles, factory, etc.).
  - app/lib/lens/client.ts and Lens-related config support social integration.
  - app/config/chains.ts and app/config/contracts.ts define chain and contract metadata.
- State & Utilities
  - app/store/auth.ts uses Zustand for auth/session state.
  - app/utils/env.ts and app/types/env.d.ts centralize Vite env handling and typings.
- Assets/Static
  - public/ serves static files (favicon, service-worker.js). app/assets/ contains images used by components.

Operational tips for Warp
- Prefer npm run dev for iterative work; type-check separately with npm run typecheck.
- For SSR issues, ensure .env is present and that VITE_* values exist at build time.
- When editing routes or loaders, check both app/routes/* and app/lib/api/loaders.ts for data wiring.
