# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (bound to all interfaces via `--host`, file watching uses polling)
- `npm run build` — type-check (`tsc -b`) then production build to `dist/`
- `npm run lint` — ESLint over the whole project
- `npm run preview` — serve the built `dist/`

There is no test suite. `npm run build` is the type-check gate; run it and `npm run lint` to verify changes.

## Overview

React 19 + TypeScript + Vite SPA frontend for the DMP Registry — a system where users create "registries" (typed data stores: files, MongoDB, SQLite, key-value), manage per-registry users/permissions, API agents, audit logs, and settings. All data comes from a separate backend API. Styling is Tailwind CSS v4 (via `@tailwindcss/vite`, no config file); icons from `lucide-react`. Routing uses `react-router` v7 (import from `react-router`, not `react-router-dom`).

## Architecture

**API access** — `src/apiClient.ts` is a thin `fetch` wrapper (`get/post/put/putMultipart/patch/delete`) that prefixes `VITE_API_URL` and always sends `credentials: 'include'` (session-cookie auth). It returns raw `Response` objects; callers check `res.ok` and parse JSON themselves. Endpoints live under `/api/v1/...`.

**Global state via contexts** — Each context is split into a `XContext.tsx` (type + `createContext` with defaults) and a `XContextProvider.tsx` (state). Providers are stacked in `App.tsx` via `ComposeProviders`; order matters because later providers consume earlier ones (e.g. `UserContextProvider` uses `LoadingBannerContext` and `BannerContext`).
- `UserContext` — logged-in user, fetched from `/api/v1/users/auth/me` + `/api/v1/users/permissions` on mount. Bump `setResetUser` to refetch. `ProtectedRoute` redirects to `/home` when no user.
- `RegistryContext` — the currently open `registry` and `localUser` (the current user's permissions *within* that registry).
- `LoadingBannerContext` — a map of named in-flight processes (`addProcess(id)` / `removeProcess(id)`); pages gate rendering on e.g. `processes.has("loading_registry")`.
- `BannerContext` — single success/error/info banner rendered by `StandardLayout`.
- `ModalContext` — imperative global modal: `showModal({ type, ... })` where `type` is `alert | confirm | input | password | files | form | buttonless`. The common pattern for mutations is confirm modal → `buttonless` "Please wait" modal → API call → `closeModal()` + `setBanner(...)`.
- `NavContext` — mobile nav open/closed.

**Registry pages** — Every `/registries/:registryId/*` page calls `useRegistryBootstrap(registryId)` (`src/hooks/useRegistryBootstrap.tsx`), which loads registry details and `/permissions/me` into `RegistryContext` (skipping the fetch if that registry is already loaded) and exposes `reload()` and an error state; pages redirect to `/dashboard` with an error banner on failure.

**Layout & navigation** — Pages wrap content in `StandardLayout` with a `navbarLevel` (`NavbarLevel.TOP` for app-level pages, `REGISTRY` for registry pages, `HIDDEN`). The sidebar items are generated there from global user permissions (`UserPermission`) and registry-local permissions (`RegistryUserPermissions`, `isOwner`), so permission-gated navigation is edited in `StandardLayout.tsx`. Routes are all declared in `App.tsx`.

**Registry type controllers** — `RegistryDashboard` switches on `registry.type` to render one of `src/components/registryControllers/*Controller.tsx`. Adding a registry type means updating `model/RegistryType.ts` and that switch.

## Conventions

- `tsconfig` enables `erasableSyntaxOnly` and `verbatimModuleSyntax`: no TS `enum`s — use the `const` object + derived type pattern (see `model/RegistryType.ts`, `context/NavbarLevel.ts`) with `coerce…FromString` helpers to validate API strings; use `import type` for type-only imports.
- `noUnusedLocals` / `noUnusedParameters` are on, so unused code fails the build.

## Environment & deployment

- `VITE_API_URL` is set in `.env.development` / `.env.production`; it's baked in at build time.
- Pushing to `main` triggers `.github/workflows/deploy.yml`: builds the Docker image (Node build stage → nginx serving `dist/` with SPA fallback, see `nginx.conf`), passes `VITE_API_URL=https://registry-api.mnmzc.dev` as a build arg, pushes to GHCR, and redeploys via SSH + `docker compose` on the VM.
