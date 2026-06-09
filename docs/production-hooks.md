# Production hooks

Dr Fold uses public HTTP hook routes for scheduled backend jobs. These routes must not use
Supabase publishable keys as secrets.

## Required secrets

- `CRON_SECRET`: shared fallback secret for scheduled jobs.
- `NOTICES_SYNC_HOOK_SECRET`: optional override for `/api/public/hooks/sync-notices`.
- `PRICE_EXTRACT_HOOK_SECRET`: optional override for `/api/public/hooks/extract-prices`.
- `DIGEST_HOOK_SECRET`: optional override for `/api/public/hooks/send-weekly-digest`.

The request must include the secret in the `x-hook-secret` header. The legacy `apikey` header is
still accepted for compatibility, but it must contain one of the private hook secrets above.

## Routes

- `POST /api/public/hooks/sync-notices`
  - Secret: `NOTICES_SYNC_HOOK_SECRET` or `CRON_SECRET`
  - Purpose: sync notices from the official notice source.
- `POST /api/public/hooks/extract-prices`
  - Secret: `PRICE_EXTRACT_HOOK_SECRET` or `CRON_SECRET`
  - Purpose: extract rent and sale price observations from notice attachments.
- `POST /api/public/hooks/send-weekly-digest`
  - Secret: `DIGEST_HOOK_SECRET` or `CRON_SECRET`
  - Purpose: send weekly notice digest emails.

If no matching private hook secret is configured, the route returns `401 Unauthorized`.
