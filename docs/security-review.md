# Security review — 2026-10-03

Scope: local source review, dependency advisory audit, isolated regression checks,
and build validation. No penetration test against production or destructive DB
tests were performed. This is not a claim that all vulnerabilities are removed.

## Patched

### Privilege escalation through unverified admin email (high, conditional)

Previously public `registerAccount` called `accountRole(email, role)` and granted
`platform_admin` whenever the supplied email appeared in `PLATFORM_ADMIN_EMAILS`.
Email verification is intentionally absent. An attacker who knew an unregistered
allowlisted email could therefore obtain an admin role without mailbox ownership.
Login also promoted pre-existing ordinary accounts when their email was allowlisted.
Admin functionality is Phase 2, so current business impact is limited by the lack
of implemented admin routes. The privilege assignment itself was unsafe.

Public signup now rejects reserved admin emails and writes only the validated
organizer/attendee role. Login requires BOTH an explicitly provisioned database
admin role and the allowlist. Existing normal accounts are never implicitly promoted.
Provisioning an admin requires a trusted operator to verify ownership and set the
database role; do not add an unauthenticated provisioning endpoint.
`CONTRACT.md` is unchanged; its admin bootstrap description needs human reconciliation
with this security restriction before Phase 2. Review any previously created admin
accounts manually; this patch does not remove accounts or invalidate existing JWTs.

### Weak signup password validation (medium)

Signup previously accepted one-character passwords. New accounts now require at
least 12 Unicode code points while retaining the existing bcrypt 72-byte maximum.
Existing passwords still work; no forced reset or password data rewrite was done.

### Missing anti-framing protection (medium, defense in depth)

Application responses previously configured no anti-framing headers, exposing UI
to framing where browser cookie behavior permits authenticated interaction.
Added CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `object-src 'none'`,
`base-uri 'self'`, nosniff and a restrictive referrer policy. This is a limited CSP,
not a complete script-source/XSS policy. Authentication and authorization remain
mandatory independently of these headers.

### Dependencies with published advisories

- Auth.js: next-auth 5.0.0-beta.30 -> beta.32; @auth/core pinned to 0.41.3.
  Advisories: GHSA-8fpg-xm3f-6cx3, GHSA-7rqj-j65f-68wh,
  GHSA-xmf8-cvqr-rfgj, GHSA-x445-f3h2-j279.
  Existing concrete user/role checks already mitigate the fail-open pattern;
  email-provider/OAuth issues are not directly used by this credentials-only app.
- Drizzle ORM 0.44.7 -> 0.45.3: GHSA-gpj5-g38j-94v9. Current reviewed queries use
  fixed identifiers and parameterized values; application-level SQL injection was
  not demonstrated. Upgrade removes the vulnerable identifier implementation.
- PostCSS override 8.5.28 removes vulnerable nested Next.js PostCSS:
  GHSA-fxqj-rqcc-2cmp, GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q,
  GHSA-r28c-9q8g-f849. No untrusted CSS compilation endpoint was found.
- esbuild override 0.25.12 removes vulnerable 0.18.20 nested in Drizzle tooling:
  GHSA-67mh-4wv8-2f99. The esbuild development server is not used by app routes.

## Outstanding risks / required follow-up

- `bun audit` still reports **braces 3.0.3 / GHSA-vfj7-8cjw-p6xm (high)**.
  The registry's latest release is also 3.0.3 at review time. Do not label this
  dependency audit clean. Avoid processing untrusted glob patterns and reassess
  when an upstream patch is published; no application route accepting globs was found.
  Verified path: eslint-config-next -> @next/eslint-plugin-next -> fast-glob ->
  micromatch -> braces. This is development/lint tooling, not a demonstrated
  internet-facing route in the deployed app.
- No shared login/signup rate limiter exists. Password length does not prevent
  credential stuffing or account-creation abuse. A production solution needs an
  approved shared counter/store or gateway/WAF policy, covering both Server Actions
  and the Credentials callback. A process-local map is not a serverless solution.
- JWT roles can stay valid until the configured eight-hour expiry after a DB role
  change. Immediate revocation needs an approved session/version policy.
- Database credentials were pasted into this conversation. Rotate the Supabase DB
  password and any shared authentication secret through the owner's deployment
  workflow and update all environments. No remote credential rotation was performed.
- No live cross-account/tenant, race-condition, or browser exploit test was run.
  Source review found owner filters on ticket queries and organizer workspace checks;
  that observation is not equivalent to an end-to-end security certification.

## Regression checks

`bun scripts/checks/security.check.ts` covers admin role resolution and headers.
`bun scripts/checks/signup-security.check.mjs` invokes signup with reserved email,
weak password and forged admin role; rejected requests must never reach the DB.
`bun scripts/checks/auth.check.ts` covers unsafe redirects and JWT configuration.
All three are included in CI, without writing to the shared Supabase database.

## Verification results

- ESLint and TypeScript: passed after patches.
- Production build: passed; `jose` emits Edge Runtime warnings about
  CompressionStream/DecompressionStream. A passing build does not validate every
  authenticated Edge flow.
- All three security/auth regression scripts: passed.
- `drizzle-kit check`: passed without applying migrations.
- Local HTTP smoke test: `/` and `/signin` return 200; unauthenticated `/tickets`
  and `/dashboard` redirect to `/signin` with 307. All four responses include the
  CSP and DENY framing headers.
- Dependency audit: reduced from six flagged package names to one (`braces`);
  audit still exits nonzero. No zero-vulnerability claim is made.
- Local development server restarted on port 3000. No commit, push or production
  deployment was performed.

Advisory details: `https://github.com/advisories/<GHSA identifier>`.
