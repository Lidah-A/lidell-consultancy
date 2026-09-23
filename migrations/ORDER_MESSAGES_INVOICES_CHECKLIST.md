# Order Messages and Invoices Setup Checklist

## 1) Run migration

1. Open Supabase SQL Editor.
2. Run migrations/003_order_messages_and_invoices.sql.

## 2) Verify tables

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('request_messages', 'order_invoices');
```

## 3) Verify columns quickly

```sql
select column_name
from information_schema.columns
where table_name = 'request_messages'
order by ordinal_position;
```

```sql
select column_name
from information_schema.columns
where table_name = 'order_invoices'
order by ordinal_position;
```

## 4) App verification

1. Open admin request detail.
2. Send an order message and confirm it appears.
3. Open same request in portal and confirm message thread appears.
4. Save invoice in admin and confirm portal invoice panel shows it.
5. Upload a large image and confirm upload succeeds with compression.
