# Bug Fix: Duplicate Credit Distribution Records

## Problem Summary

When a user purchases a yearly subscription, Creem sends two webhook events almost simultaneously:
1. `checkout.completed`
2. `subscription.paid`

Both events were processing the same payment and creating duplicate entries in:
- `credit_distribution_schedule` table
- `credit_distribution_history` table

## Root Cause

The payment processing flow was:

1. **Idempotency check** - checks `credits` table for existing record
2. **Create distribution schedule** - inserts into `credit_distribution_schedule`
3. **Create distribution history** - inserts into `credit_distribution_history`
4. **Add credits** - inserts into `credits` table (has unique constraint)

When two webhooks arrived simultaneously:
- Both passed the idempotency check (no credits record yet)
- Both created distribution schedule records (no unique constraint)
- Both created distribution history records (no unique constraint)
- Second webhook failed at credits insertion (unique constraint violation)

Result: Duplicate distribution records but only one credits record.

## Fix Applied

Added idempotency check in `createDistributionSchedule()` method in `PaymentProcessingService.ts`:

```typescript
// Check if distribution schedule already exists for this order
const { data: existingSchedule } = await supabase
  .from("credit_distribution_schedule")
  .select("id")
  .eq("order_no", params.orderNo)
  .single();

if (existingSchedule) {
  console.log(`ℹ️ Distribution schedule already exists for order ${params.orderNo}, skipping creation`);
  return;
}
```

## Recommended Database Schema Enhancement

To fully prevent race conditions at the database level, add a unique constraint:

```sql
-- Add unique constraint on order_no to prevent duplicate distribution schedules
ALTER TABLE credit_distribution_schedule
ADD CONSTRAINT credit_distribution_schedule_order_no_unique
UNIQUE (order_no);
```

This ensures that even if two webhooks reach the insert statement simultaneously, only one will succeed.

## Testing

After applying this fix:
1. The first webhook will create the distribution schedule
2. The second webhook will detect the existing schedule and skip creation
3. No duplicate records will be created

## Cleanup (if needed)

If duplicate records already exist in your database, you can clean them up:

```sql
-- Find duplicate distribution schedules
SELECT order_no, COUNT(*) as count
FROM credit_distribution_schedule
GROUP BY order_no
HAVING COUNT(*) > 1;

-- Delete duplicates (keep the earliest one)
DELETE FROM credit_distribution_schedule
WHERE id NOT IN (
  SELECT MIN(id)
  FROM credit_distribution_schedule
  GROUP BY order_no
);

-- Find and delete orphaned distribution history records
DELETE FROM credit_distribution_history
WHERE schedule_id NOT IN (
  SELECT id FROM credit_distribution_schedule
);
```

## Related Files

- `services/payment/PaymentProcessingService.ts` - Main fix location
- `app/api/creem/webhook/route.ts` - Webhook handler
- `app/api/subscription/create/route.ts` - Order creation with `is_monthly_distribution` flag
