import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

import { getSupabaseClient } from "../../models/db";
import { PayssionProvider } from "../../services/payment/PayssionProvider";
import { createOrUpdateMembership } from "../../services/membership";

type CsvRow = {
  user_uuid: string;
  user_email: string;
  total_subscriptions: number;
  provider: string;
  subscription_id: string;
  amount: number;
  currency: string;
  plan_type: string;
  status: string;
  product_id?: string;
  product_name?: string;
  created_at?: string;
};

type SubscriptionRecord = {
  user_uuid: string;
  payssion_subscription_id: string | null;
  status: string;
  plan_type: string | null;
  amount: number | null;
  currency: string | null;
  product_id: string | null;
  product_name: string | null;
  created_at: string;
};

type Args = {
  csvPath: string;
  apply: boolean;
  skipCancel: boolean;
  skipMembership: boolean;
  limit?: number;
  onlyUser?: string;
  sleepMs: number;
};

const DEFAULT_CSV =
  "docs/payssion-multi-subscription-cleanup/Supabase Multi-Subscription Leaderboard (3).csv";
const ACTIVE_STATUSES = new Set(["active", "pending", "past_due"]);
const TERMINAL_STATUSES = new Set(["canceled", "expired"]);

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {
    csvPath: DEFAULT_CSV,
    apply: false,
    skipCancel: false,
    skipMembership: false,
    sleepMs: 200,
  };

  for (const arg of args) {
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--dry-run") parsed.apply = false;
    else if (arg === "--skip-cancel") parsed.skipCancel = true;
    else if (arg === "--skip-membership") parsed.skipMembership = true;
    else if (arg.startsWith("--limit=")) {
      parsed.limit = Number(arg.split("=")[1]);
    } else if (arg.startsWith("--only-user=")) {
      parsed.onlyUser = arg.split("=")[1];
    } else if (arg.startsWith("--sleep-ms=")) {
      parsed.sleepMs = Number(arg.split("=")[1]);
    } else if (!arg.startsWith("--")) {
      parsed.csvPath = arg;
    }
  }

  return parsed;
}

function normalizeCsvPath(inputPath: string): string {
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(process.cwd(), inputPath);
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return NaN;
  return Number(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadCsv(csvPath: string): Promise<CsvRow[]> {
  const content = await fs.readFile(csvPath, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row: any) => ({
    user_uuid: String(row.user_uuid || "").trim(),
    user_email: String(row.user_email || "").trim(),
    total_subscriptions: toNumber(row.total_subscriptions),
    provider: String(row.provider || "").trim(),
    subscription_id: String(row.subscription_id || "").trim(),
    amount: toNumber(row.amount),
    currency: String(row.currency || "").trim(),
    plan_type: String(row.plan_type || "").trim(),
    status: String(row.status || "").trim(),
    product_id: row.product_id ? String(row.product_id).trim() : undefined,
    product_name: row.product_name ? String(row.product_name).trim() : undefined,
    created_at: row.created_at ? String(row.created_at).trim() : undefined,
  }));
}

function validateCsv(rows: CsvRow[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rows.length) {
    errors.push("CSV has no rows.");
    return { errors, warnings };
  }

  const providers = new Set(rows.map((row) => row.provider));
  if (providers.size !== 1 || !providers.has("payssion")) {
    warnings.push(`Unexpected providers in CSV: ${Array.from(providers).join(", ")}`);
  }

  const missingUser = rows.filter((row) => !row.user_uuid).length;
  if (missingUser > 0) warnings.push(`Rows missing user_uuid: ${missingUser}`);

  const missingSub = rows.filter((row) => !row.subscription_id).length;
  if (missingSub > 0) warnings.push(`Rows missing subscription_id: ${missingSub}`);

  const invalidTotals = rows.filter((row) => !Number.isFinite(row.total_subscriptions)).length;
  if (invalidTotals > 0) warnings.push(`Rows with invalid total_subscriptions: ${invalidTotals}`);

  return { errors, warnings };
}

async function main() {
  const args = parseArgs();
  const csvPath = normalizeCsvPath(args.csvPath);
  const apply = args.apply;
  const skipCancel = args.skipCancel;
  const skipMembership = args.skipMembership;

  console.log("\n== Payssion multi-subscription cleanup ==");
  console.log(`CSV: ${csvPath}`);
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`Cancel extra subscriptions: ${skipCancel ? "NO" : "YES"}`);
  console.log(`Update membership: ${skipMembership ? "NO" : "YES"}`);

  const rows = await loadCsv(csvPath);
  const { errors, warnings } = validateCsv(rows);
  if (errors.length) {
    console.error("\nCSV validation failed:");
    for (const err of errors) console.error(`- ${err}`);
    process.exit(1);
  }
  if (warnings.length) {
    console.warn("\nCSV validation warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  const uniqueMap = new Map<string, CsvRow>();
  const duplicates: string[] = [];
  for (const row of rows) {
    if (!row.user_uuid) continue;
    if (uniqueMap.has(row.user_uuid)) {
      duplicates.push(row.user_uuid);
    } else {
      uniqueMap.set(row.user_uuid, row);
    }
  }
  if (duplicates.length > 0) {
    console.warn(`\nDuplicate user_uuid entries in CSV: ${duplicates.length}`);
  }

  let targets = Array.from(uniqueMap.values());
  if (args.onlyUser) {
    targets = targets.filter(
      (row) => row.user_uuid === args.onlyUser || row.user_email === args.onlyUser
    );
  }
  if (args.limit && Number.isFinite(args.limit)) {
    targets = targets.slice(0, args.limit);
  }

  console.log(`\nTargets: ${targets.length} users`);

  const supabase = getSupabaseClient();
  const payssionProvider = apply && !skipCancel ? new PayssionProvider() : null;

  let processedUsers = 0;
  let canceledCount = 0;
  let membershipUpdated = 0;
  let cancelFailures = 0;
  let missingKeepSub = 0;
  let mismatchCounts = 0;

  for (const row of targets) {
    processedUsers += 1;
    const { data: subs, error } = await supabase
      .from("subscriptions")
      .select(
        "user_uuid,payssion_subscription_id,status,plan_type,amount,currency,product_id,product_name,created_at"
      )
      .eq("user_uuid", row.user_uuid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`\n[${row.user_uuid}] Failed to load subscriptions:`, error.message);
      continue;
    }

    const subscriptions = (subs || []) as SubscriptionRecord[];
    const activeLike = subscriptions.filter((sub) => ACTIVE_STATUSES.has(sub.status));
    if (Number.isFinite(row.total_subscriptions) && activeLike.length !== row.total_subscriptions) {
      mismatchCounts += 1;
      console.warn(
        `[${row.user_uuid}] Active count mismatch: CSV=${row.total_subscriptions}, DB=${activeLike.length}`
      );
    }

    const keepSub = subscriptions.find(
      (sub) => sub.payssion_subscription_id === row.subscription_id
    );

    if (!keepSub) {
      missingKeepSub += 1;
      console.warn(`\n[${row.user_uuid}] Keep subscription not found in DB: ${row.subscription_id}`);
      continue;
    }

    const toCancel = subscriptions.filter((sub) => {
      if (!sub.payssion_subscription_id) return false;
      if (sub.payssion_subscription_id === row.subscription_id) return false;
      return !TERMINAL_STATUSES.has(sub.status);
    });

    if (!skipCancel && toCancel.length > 0) {
      console.log(`\n[${row.user_uuid}] Cancel ${toCancel.length} subscriptions (keep ${row.subscription_id})`);
      for (const sub of toCancel) {
        if (!sub.payssion_subscription_id) continue;
        if (!apply || !payssionProvider) {
          console.log(`- DRY-RUN cancel ${sub.payssion_subscription_id} (${sub.status})`);
          continue;
        }

        const ok = await payssionProvider.cancelSubscription(sub.payssion_subscription_id);
        if (ok) {
          canceledCount += 1;
          console.log(`- canceled ${sub.payssion_subscription_id}`);
        } else {
          cancelFailures += 1;
          console.warn(`- cancel failed ${sub.payssion_subscription_id}`);
        }

        if (args.sleepMs > 0) await sleep(args.sleepMs);
      }
    }

    if (!skipMembership) {
      const planType =
        (keepSub.plan_type || row.plan_type).toLowerCase() === "yearly"
          ? "yearly"
          : "monthly";

      if (!apply) {
        console.log(
          `[${row.user_uuid}] DRY-RUN update membership to ${planType} (keep ${row.subscription_id})`
        );
      } else {
        await createOrUpdateMembership(row.user_uuid, planType);
        membershipUpdated += 1;
        console.log(`[${row.user_uuid}] membership updated to ${planType}`);
      }
    }
  }

  console.log("\n== Summary ==");
  console.log(`Processed users: ${processedUsers}`);
  console.log(`Missing keep subscription: ${missingKeepSub}`);
  console.log(`Active count mismatches: ${mismatchCounts}`);
  console.log(`Canceled subscriptions: ${canceledCount}`);
  console.log(`Cancel failures: ${cancelFailures}`);
  console.log(`Membership updated: ${membershipUpdated}`);

  if (!apply) {
    console.log("\nDry-run complete. Use --apply to execute changes.");
  }
}

main().catch((error) => {
  console.error("\nFatal error:", error);
  process.exit(1);
});
