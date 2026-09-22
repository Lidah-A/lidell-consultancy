-- Run this SQL in your Supabase SQL editor to enable request tracking fields
-- and persistent status history timeline.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add tracking-related columns to sourcing_requests.
ALTER TABLE IF EXISTS sourcing_requests
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS order_status text,
  ADD COLUMN IF NOT EXISTS estimated_delivery date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Keep updated_at current when rows are changed.
CREATE OR REPLACE FUNCTION set_sourcing_requests_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sourcing_requests_updated_at ON sourcing_requests;
CREATE TRIGGER trg_sourcing_requests_updated_at
BEFORE UPDATE ON sourcing_requests
FOR EACH ROW
EXECUTE FUNCTION set_sourcing_requests_updated_at();

-- Store timeline events for shipping/order status updates.
CREATE TABLE IF NOT EXISTS request_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  status text,
  tracking_number text,
  carrier text,
  estimated_delivery date,
  note text,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_status_history_request_id
  ON request_status_history(request_id);

CREATE INDEX IF NOT EXISTS idx_request_status_history_created_at
  ON request_status_history(created_at DESC);
