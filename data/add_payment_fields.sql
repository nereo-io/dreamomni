-- Add missing payment-related columns to orders table
ALTER TABLE orders 
ADD COLUMN payment_provider VARCHAR(255),
ADD COLUMN payment_method VARCHAR(255),
ADD COLUMN payssion_transaction_id VARCHAR(255),
ADD COLUMN payment_provider_fee DECIMAL(10,2);

-- Add index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_orders_payssion_transaction_id ON orders(payssion_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);