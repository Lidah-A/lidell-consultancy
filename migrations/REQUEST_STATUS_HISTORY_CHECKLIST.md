# Request Status History Setup Checklist

Use this checklist to enable tracking timelines in production.

## 1) Run migration in Supabase

1. Open Supabase dashboard for your project.
2. Go to SQL Editor.
3. Paste and run the file migrations/002_request_tracking_and_history.sql.
4. Confirm success with no errors.

## 2) Verify schema

Run these checks in SQL Editor:

```sql
select column_name
from information_schema.columns
where table_name = 'sourcing_requests'
  and column_name in ('tracking_number', 'carrier', 'order_status', 'estimated_delivery', 'updated_at')
order by column_name;
```

```sql
select column_name
from information_schema.columns
where table_name = 'request_status_history'
order by ordinal_position;
```

## 3) Verify app behavior

1. In admin request detail page, set tracking number/carrier/status/ETA.
2. Click Save Tracking.
3. Confirm the Status History panel shows a new timeline row.
4. Open the same request in portal.
5. Confirm Shipping Status and Tracking Timeline render correctly.

## 4) Optional: backfill one timeline event for old requests

If you want every existing request to show at least one timeline entry:

```sql
insert into request_status_history (request_id, status, note, created_at)
select r.id, coalesce(r.order_status, r.status, 'created'), 'Backfilled initial timeline event', now()
from sourcing_requests r
where not exists (
  select 1
  from request_status_history h
  where h.request_id = r.id
);
```

## 5) Safety checks

```sql
select request_id, status, tracking_number, carrier, estimated_delivery, created_at
from request_status_history
order by created_at desc
limit 20;
```

If rows appear after an admin update, timeline persistence is working.
