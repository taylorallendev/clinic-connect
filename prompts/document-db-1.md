When going through @https://docs.cursor.com/guides/advanced/large-codebases, I want to write rules for domain-specific knowledge. based on my backend and server actions, I want you to follow the guide to create a working document to be able to, like the guide said, onboard an employee just with this context on this part of the codebase.


I want to start with my supabase postgres db schema, which is important, as lots of different moving parts in the project depend on it to wrok and to always work. Here is my postgres definition according to supabase:

```
create table public.cases (
  id uuid not null default gen_random_uuid (),
  visibility public.CaseVisibility null,
  type public.CaseType null,
  status public.CaseStatus null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  constraint cases_pkey primary key (id),
  constraint cases_id_key unique (id)
) TABLESPACE pg_default;

create table public.generations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  prompt text null,
  content text null,
  template_id uuid null,
  case_id uuid null,
  constraint generations_pkey primary key (id),
  constraint generations_case_id_fkey foreign KEY (case_id) references cases (id) on update CASCADE on delete CASCADE,
  constraint generations_template_id_fkey foreign KEY (template_id) references templates (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create table public.patients (
  name text null,
  owner_name text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  case_id uuid null,
  id uuid not null default gen_random_uuid (),
  constraint patients_pkey primary key (id),
  constraint patients_id_key unique (id),
  constraint patient_case_id_fkey foreign KEY (case_id) references cases (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create table public.soap_notes (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  transcript text null,
  subjective text null,
  objective text null,
  assessment text null,
  plan text null,
  case_id uuid null,
  constraint soap_notes_pkey primary key (id),
  constraint soap_notes_id_key unique (id),
  constraint soap_notes_case_id_fkey foreign KEY (case_id) references cases (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create table public.templates (
  id uuid not null default gen_random_uuid (),
  name text null,
  type text null,
  content text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  prompt text null,
  model text null,
  constraint templates_pkey primary key (id)
) TABLESPACE pg_default;

create table public.transcriptions (
  transcript text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  case_id uuid null,
  id uuid not null default gen_random_uuid (),
  constraint transcriptions_pkey primary key (id),
  constraint transcriptions_id_key unique (id),
  constraint transcriptions_case_id_fkey foreign KEY (case_id) references cases (id)
) TABLESPACE pg_default;
```