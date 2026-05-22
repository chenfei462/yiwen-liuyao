# Vercel Deployment

This app is a Next.js project and is ready for Vercel's Next.js runtime.

## Project Settings

- Framework Preset: `Next.js`
- Root Directory: repository root
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave unset for Next.js

The committed `vercel.json` pins the install and build commands so Git and CLI deployments use the same release path.

## Environment Variables

The app falls back to the fake AI provider if no real provider key is configured. For production-like AI output, configure only one provider family in Vercel Project Settings -> Environment Variables.

OpenAI:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` optional, defaults in code

DeepSeek:

- `AI_PROVIDER=deepseek`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL` optional
- `DEEPSEEK_BASE_URL` optional, defaults to `https://api.deepseek.com`

OpenRouter:

- `AI_PROVIDER=openrouter`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` optional
- `OPENROUTER_SITE_URL` optional
- `OPENROUTER_APP_NAME` optional

Storage:

- `DATABASE_URL`: shared PostgreSQL connection string. Required for production reading-service persistence; production must not rely on `.data/readings.json` or per-instance filesystem state.

Auth:

- `ADMIN_EMAILS`: comma-separated administrator allowlist. This is the only admin entry point in the first auth release.
- `AUTH_EMAIL_FROM`: sender address for verification and password reset emails.
- `AUTH_EMAIL_PROVIDER_API_KEY`: provider credential for verification and password reset delivery.

Production deployments must use shared persistent storage for the reading-service `domain_snapshots` JSONB row plus `users`, `auth_sessions`, `password_reset_tokens`, and `email_verification_tokens`. Local development may use the `.data/auth.json` mock, but production must not rely on per-instance filesystem state for sessions or identity.

Do not copy local proxy values such as `http://127.0.0.1:...` into Vercel. Do not commit `.env.local`; this repository intentionally ignores `.env*`.

## Git Import Flow

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repository in Vercel.
3. Confirm the project settings above.
4. Add production and preview environment variables.
5. Deploy and verify the generated preview URL before promoting production traffic.

## CLI Flow

```bash
vercel link
vercel deploy
vercel deploy --prod
```

Use the CLI flow only after `vercel login` or `VERCEL_TOKEN` is available locally.

## Verification Gate

Run before publishing:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run test:e2e
```

After deploy, verify:

- Auth cookies are HttpOnly, SameSite=Lax, and Secure in production.
- `/api/admin/*` returns `401` when logged out and `403` for non-admin users.
- Verification, reset, and `next` return links use the deployed origin.
