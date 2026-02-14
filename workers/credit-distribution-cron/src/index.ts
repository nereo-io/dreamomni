export interface Env {
  // Must match the CRON_SECRET configured on the Seedance app runtime.
  CRON_SECRET: string;
  // e.g. https://www.seedance.tv (no trailing slash)
  TARGET_BASE_URL: string;
}

function assertEnv(env: Env) {
  if (!env.TARGET_BASE_URL) {
    throw new Error("Missing TARGET_BASE_URL");
  }
  if (!env.CRON_SECRET) {
    throw new Error("Missing CRON_SECRET");
  }
}

async function runDistribution(env: Env): Promise<Response> {
  assertEnv(env);

  const url = new URL("/api/cron/distribute-credits", env.TARGET_BASE_URL);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cron request failed: ${res.status} ${body}`);
  }

  return new Response("ok");
}

export default {
  // Cloudflare Cron Trigger
  async scheduled(_event: any, env: Env, ctx: any) {
    ctx.waitUntil(runDistribution(env));
  },

  // Manual trigger (optional): curl the worker URL to trigger once.
  async fetch(_req: Request, env: Env) {
    try {
      await runDistribution(env);
      return new Response("ok");
    } catch (err) {
      return new Response(String(err instanceof Error ? err.message : err), {
        status: 500,
      });
    }
  },
};
