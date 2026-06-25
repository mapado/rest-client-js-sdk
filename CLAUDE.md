# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`rest-client-sdk` is a generic REST/Hydra (API Platform) client SDK for JavaScript/TypeScript. Instead of writing a bespoke SDK per API, you declare a **mapping** (entities, attributes, relations) plus config, and the library exposes typed repositories with CRUD methods, OAuth token handling, (de)serialization, and dirty-field tracking. The README is the user-facing reference and contains detailed usage examples.

## Commands

The package manager is **Yarn 4** via Corepack (`packageManager: yarn@4.7.0`). Run `corepack enable` if `yarn` is missing.

- `yarn test` — runs lint first (`yarn lint --quiet`) **then** Jest. Lint failures abort the test run.
- `yarn jest <path-or-pattern>` — run a single test file or pattern **without** the lint gate (e.g. `yarn jest UnitOfWork`, `yarn jest __tests__/client/AbstractClient.test.js`).
- `yarn jest -t "<test name>"` — run tests matching a name.
- `yarn lint` — `lint:types` (`tsc --noEmit`) + `lint:eslint`. Run this before considering a change done.
- `yarn lint:eslint` / `yarn lint:types` — run either half alone.
- `yarn build` — clean, then `build:types` (`tsc --emitDeclarationOnly` → `dist/types`) and `build:js` (Rollup → ESM `dist/index.mjs` + UMD `dist/index.cjs`).

CI (`.github/workflows/node.js.yml`) runs `yarn lint` + `yarn test` on Node 18/20/22/24. Releases are tag-driven via `bump2version` (`.bumpversion.cfg`); do not hand-edit the version in `package.json`.

## Testing notes

- Tests live in `__tests__/` (mirroring `src/` structure), **separate** from source. Most are `.js`, some `.ts`.
- Shared fixtures/mocks are in `__mocks__/` (token generators, storage, serializers, mappings).
- `setupJest.js` **locks `Date.now()`** to `NOW_TIMESTAMP_MOCK` for the whole suite — token-expiry logic depends on this, so don't assume real time in tests.
- HTTP is mocked with `jest-fetch-mock` / `fetch-mock`.

## Code style

- TypeScript with native **private fields (`#field`)**, ESLint (airbnb + `@typescript-eslint` + prettier), Prettier with single quotes.
- Import order is enforced (alphabetized, grouped: react → external → `@mapado/*` → internal). A pre-commit hook (husky + lint-staged) runs Prettier.

## Architecture

Entry point `src/index.ts` re-exports everything; `RestClientSdk` is the default export.

### Request lifecycle (the core flow)
`sdk.getRepository('products').find(8)` →
1. **`RestClientSdk.getRepository(key)`** (`RestClientSdk.ts`) looks up `ClassMetadata` by key, lazily instantiates and caches a repository via `generateRepository` (= `new metadata.repositoryClass(sdk, metadata, uowEnabled)`). On an unknown key it suggests the closest match using `utils/levenshtein`.
2. **`AbstractClient`** (`client/AbstractClient.ts`) is that repository. It builds the URL (`getPathBase` + id, plus `mapping.idPrefix`), then `authorizedFetch` → `makeUri` injects host/scheme/port.
3. **Token handling**: before fetching, it checks `tokenStorage.getCurrentTokenExpiresIn()`; if ≤ `EXPIRE_LIMIT_SECONDS` (300s) it refreshes first. A `401` with `invalid_grant`/`invalid_scope`/`access_denied` triggers a refresh-and-refetch; terminal failure calls `config.onRefreshTokenFailure`.
4. **Deserialize**: the response text goes through the serializer (`decode` → `denormalize`), and the normalized result is registered as "clean" in the UnitOfWork.

### Key modules
- **`Mapping` + `Mapping/ClassMetadata` + `Mapping/Attribute` + `Mapping/Relation`**: the schema. A `ClassMetadata`'s `key` is **both** the repository lookup key and what's passed to the serializer; `pathRoot` is the API endpoint (defaults to `key`). Relations (`ONE_TO_MANY`/`MANY_TO_ONE`/`MANY_TO_MANY`) are auto-registered as attributes of type `array`/`object`. `Mapping.idPrefix` is prepended to all generated URLs; `Mapping` config defaults `collectionKey: 'hydra:member'` (Hydra/API Platform shape).
- **`AbstractClient`**: the default repository with `find/findBy/findAll/create/update/delete`. **Subclass it** and override `getPathBase`/`getEntityURI` (pass the subclass as the 3rd arg to `ClassMetadata`) for custom endpoints — see README "Overriding repository".
- **`UnitOfWork`** (`UnitOfWork.ts`): tracks the last "clean" serialized state per entity id and, on `create`/`update`, computes a deep diff (via `deep-diff`) so **only dirty fields are sent** (handling relations recursively). **Disabled by default** — only active when `config.unitOfWorkEnabled` is true. Per-call opt-out via `repo.withUnitOfWork(false)` (find\* calls only).
- **`TokenStorage` + `TokenGenerator/*`**: `TokenStorage` wraps a `TokenGenerator` (ClientCredentials / Password / AuthorizationCodeFlow / ProvidedToken, all extending `AbstractTokenGenerator`) and an async storage backend (`AsyncStorageInterface`: `getItem/setItem/removeItem` returning promises). It adds `expires_at`, and **memoizes** `generateToken`/`refreshToken` (`decorator.ts` `memoizePromise`) so concurrent calls dedupe.
- **`serializer/Serializer` (abstract) + `JsSerializer` (default)**: (de)serialization is two-phase each way — read: `decode` (string→object) then `denormalize` (object→entity); write: `normalize` (entity→object) then `encode` (object→string). Inject a custom serializer as the 4th arg to `RestClientSdk`.
- **`ErrorFactory`**: maps HTTP status codes to typed errors (`BadRequestError`, `UnauthorizedError`, …) and OAuth errors (`OauthError`, `InvalidGrantError`, `InvalidScopeError`).
- **`utils/logging`**: optional request/response `Logger`, enabled via `config.loggerEnabled`.

### TypeScript generics
The SDK is parameterized by a metadata type: `new RestClientSdk<TSMetadata>(...)`, where `TSMetadata` is a `Record<key, { entity; list }>`. This is what makes `getRepository(key)` return a correctly-typed repository. Note `typescript@^3.9.6` is pinned (old) — avoid newer TS syntax.
