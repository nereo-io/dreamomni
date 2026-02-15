# seedance-credit-distribution-cron

Cloudflare Worker Cron Trigger to call Seedance credit distribution endpoint:
`GET /api/cron/distribute-credits`.

## Why

Cloudflare Pages does not run `vercel.json` cron schedules. If you deploy Seedance
to Cloudflare Pages (via `pnpm cf:deploy`), you need a separate scheduler.

## Required Env Vars

- `TARGET_BASE_URL`: e.g. `https://www.seedance.tv`
- `CRON_SECRET`: must match the `CRON_SECRET` configured on the Seedance app

## Deploy

From this folder:

```bash
wrangler deploy
```

Set the vars in Cloudflare dashboard (recommended) or via `wrangler secret put`.

