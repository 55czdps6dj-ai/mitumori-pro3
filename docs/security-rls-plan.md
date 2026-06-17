# Security / RLS Plan

## Current Temporary Gate

The app is protected by a temporary password gate:

- `APP_ACCESS_PASSWORD`: password entered on `/login`
- `AUTH_COOKIE_SECRET`: signing secret for the HttpOnly session cookie

This is for home testing only. It blocks casual access to the Vercel URL, but it is not the final company authentication model.

## Future Company Authentication

Replace the temporary password gate with Microsoft Entra ID / Microsoft 365 login.

Expected flow:

1. User signs in with company Microsoft 365 account.
2. App receives authenticated user identity.
3. Supabase requests are tied to that identity.
4. RLS policies decide what the user can read or update.

## Supabase Tables Currently Used

The application currently reads and writes:

- `appointments`
- `staff`

These tables contain business and personal data, including customer names, phone numbers, addresses, move dates, estimate data, and staff records.

## Required RLS Baseline

Before company production use:

1. Enable RLS on `appointments`.
2. Enable RLS on `staff`.
3. Block anonymous read/write.
4. Allow read/write only for authenticated company users.
5. Add role-based restrictions before using real customer data broadly.

Minimum baseline SQL shape:

```sql
alter table appointments enable row level security;
alter table staff enable row level security;

create policy "authenticated users can read appointments"
on appointments
for select
to authenticated
using (true);

create policy "authenticated users can insert appointments"
on appointments
for insert
to authenticated
with check (true);

create policy "authenticated users can update appointments"
on appointments
for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can read staff"
on staff
for select
to authenticated
using (true);
```

This baseline is intentionally simple. It is acceptable for a small internal pilot, but it is not enough for mature production.

## Production Hardening

For production, add these columns and policies:

- `company_id`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at` for soft delete

Then tighten policies so users can only access rows for their company or assigned role.

Recommended roles:

- `admin`: manage settings, staff, all estimates
- `reception`: create and update reception records
- `estimator`: update assigned estimates
- `viewer`: read-only access

## Operational Rules

- Do not put service role keys in browser code.
- Do not use `NEXT_PUBLIC_` for secrets.
- Do not store real customer data in test environments.
- Use dummy customer data until Microsoft login and RLS are confirmed.
- Prefer soft delete over hard delete for auditability.
