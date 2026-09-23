-- Run this SQL in your Supabase SQL editor to add per-order messaging and invoices.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  sender_email text,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'client')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_messages_request_id_created_at
  ON request_messages(request_id, created_at);

CREATE TABLE IF NOT EXISTS order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  client_name text,
  client_email text,
  currency text NOT NULL DEFAULT 'USD',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  due_date date,
  notes text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_order_invoices_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_invoices_updated_at ON order_invoices;
CREATE TRIGGER trg_order_invoices_updated_at
BEFORE UPDATE ON order_invoices
FOR EACH ROW
EXECUTE FUNCTION set_order_invoices_updated_at();
