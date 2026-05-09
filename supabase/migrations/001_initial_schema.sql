-- LAID Growth Engine — Initial Schema
-- Multi-tenant SaaS with founding-100 lifetime tier + recurring tiers

-- =============================================================
-- USERS & AUTH (extends auth.users from Supabase Auth)
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  brand_voice_profile jsonb default '{}'::jsonb, -- extracted voice from sample posts
  industry text, -- coaching, agency, real_estate, dtc, home_services, other
  niche text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================
-- SUBSCRIPTIONS (Stripe)
-- =============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  tier text not null, -- 'founding_lifetime', 'starter_monthly', 'pro_monthly', 'agency_monthly'
  status text not null default 'active', -- active, past_due, canceled, trialing
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  founding_seat_number int, -- 1-50 for founding tier, NULL otherwise
  created_at timestamptz default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_sub_idx on public.subscriptions(stripe_subscription_id);

-- Founding seat counter (used by checkout to assign next seat #)
create table if not exists public.founding_seats (
  seat_number int primary key,
  user_id uuid references public.profiles(id),
  claimed_at timestamptz default now()
);

-- =============================================================
-- AVATARS (40+ pre-built + user customs)
-- =============================================================
create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade, -- NULL = system avatar
  name text not null,
  age int,
  gender text,
  description text,
  image_prompt text not null, -- the locked iPhone-UGC prompt
  reference_image_url text, -- generated/uploaded
  voice_id text, -- ElevenLabs voice ID
  is_system boolean default false, -- true for the 40+ pre-built
  is_clone boolean default false, -- true for self-clone / ai-clone
  tags text[] default array[]::text[],
  created_at timestamptz default now()
);

create index if not exists avatars_user_id_idx on public.avatars(user_id);
create index if not exists avatars_is_system_idx on public.avatars(is_system);

-- =============================================================
-- VIDEOS (UGC engine output)
-- =============================================================
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  avatar_id uuid references public.avatars(id),
  topic text not null,
  hook text,
  script text,
  duration_seconds int default 8,
  model text default 'kling-3-pro', -- kling-3-pro, veo-3.1, sora-2, seedance-2
  fal_request_id text,
  image_url text, -- generated still (start_image_url for video)
  video_url text, -- final video
  thumbnail_url text,
  status text default 'pending', -- pending, generating_image, awaiting_approval, generating_video, complete, failed
  error_message text,
  cost_usd numeric(10,4),
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists videos_user_id_idx on public.videos(user_id);
create index if not exists videos_status_idx on public.videos(status);

-- =============================================================
-- CONTENT ASSETS (cascade output: blog, X thread, LinkedIn, email, carousel, hooks)
-- =============================================================
create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_video_id uuid references public.videos(id),
  source_topic text,
  asset_type text not null, -- blog, x_thread, linkedin_post, email, carousel, short_script, ad_copy, hook_pack
  title text,
  body text,
  meta jsonb default '{}'::jsonb, -- slide_count, hashtags, cta, scheduled_for, etc.
  posted_to text[], -- ['x', 'linkedin', 'instagram']
  external_urls jsonb default '{}'::jsonb, -- {x: 'url', linkedin: 'url'}
  status text default 'draft', -- draft, approved, scheduled, posted, archived
  created_at timestamptz default now()
);

create index if not exists content_assets_user_id_idx on public.content_assets(user_id);
create index if not exists content_assets_type_idx on public.content_assets(asset_type);
create index if not exists content_assets_status_idx on public.content_assets(status);

-- =============================================================
-- AUDIENCE INTEL (Reddit + DM signals)
-- =============================================================
create table if not exists public.audience_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null, -- reddit, dm, comment, manual
  source_url text,
  subreddit text,
  theme text,
  pain_point text,
  quote text,
  score int default 0, -- upvotes / engagement signal
  used_in_content_id uuid references public.content_assets(id),
  created_at timestamptz default now()
);

create index if not exists audience_insights_user_id_idx on public.audience_insights(user_id);
create index if not exists audience_insights_theme_idx on public.audience_insights(theme);

-- =============================================================
-- PROSPECTS (CRM-lite)
-- =============================================================
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  handle text,
  platform text, -- x, linkedin, instagram, email
  email text,
  source text, -- dm, comment, signup, manual, affiliate
  stage text default 'new', -- new, engaged, qualified, call_booked, proposal, closed_won, closed_lost
  notes text,
  last_contact timestamptz,
  next_action text,
  next_action_date date,
  deal_value numeric(10,2),
  created_at timestamptz default now()
);

create index if not exists prospects_user_id_idx on public.prospects(user_id);
create index if not exists prospects_stage_idx on public.prospects(stage);

-- =============================================================
-- HOOKS LIBRARY (ported from hooks-library.md, system-wide)
-- =============================================================
create table if not exists public.hooks (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- educational, comparison, myth_busting, curiosity, controversy, etc.
  template text not null, -- "The reason (insert X) is so (insert Y) is because..."
  placeholder_count int default 0,
  performance_score numeric(4,2) default 0, -- 0-10 from 7-factor scoring when used
  use_count int default 0,
  is_outlier boolean default false, -- flagged as Klient Engine outlier
  created_at timestamptz default now()
);

create index if not exists hooks_category_idx on public.hooks(category);
create index if not exists hooks_outlier_idx on public.hooks(is_outlier);

-- =============================================================
-- USAGE TRACKING (for billing + paywall)
-- =============================================================
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null, -- video_generated, content_generated, hook_picked, post_scheduled
  cost_usd numeric(10,4),
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists usage_events_user_id_idx on public.usage_events(user_id);
create index if not exists usage_events_type_idx on public.usage_events(event_type);
create index if not exists usage_events_created_idx on public.usage_events(created_at);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.avatars enable row level security;
alter table public.videos enable row level security;
alter table public.content_assets enable row level security;
alter table public.audience_insights enable row level security;
alter table public.prospects enable row level security;
alter table public.usage_events enable row level security;

-- Users can read/write their own data
create policy "users own profile" on public.profiles for all using (auth.uid() = id);
create policy "users own subs" on public.subscriptions for all using (auth.uid() = user_id);
create policy "users own avatars" on public.avatars for all using (auth.uid() = user_id or is_system = true);
create policy "users own videos" on public.videos for all using (auth.uid() = user_id);
create policy "users own content" on public.content_assets for all using (auth.uid() = user_id);
create policy "users own insights" on public.audience_insights for all using (auth.uid() = user_id);
create policy "users own prospects" on public.prospects for all using (auth.uid() = user_id);
create policy "users own usage" on public.usage_events for all using (auth.uid() = user_id);

-- Hooks library is system-wide (read-only for users)
alter table public.hooks enable row level security;
create policy "hooks readable by all auth" on public.hooks for select using (auth.role() = 'authenticated');

-- Founding seats counter
alter table public.founding_seats enable row level security;
create policy "founding seats readable" on public.founding_seats for select using (true);

-- =============================================================
-- FUNCTIONS
-- =============================================================

-- Get next available founding seat number (1-50)
create or replace function public.claim_founding_seat(p_user_id uuid)
returns int as $$
declare
  next_seat int;
begin
  -- Find the lowest unclaimed seat 1-50
  select min(seat_num) into next_seat
  from generate_series(1, 50) seat_num
  where seat_num not in (select seat_number from public.founding_seats);

  if next_seat is null then
    raise exception 'All 50 founding seats are claimed';
  end if;

  insert into public.founding_seats (seat_number, user_id) values (next_seat, p_user_id);
  return next_seat;
end;
$$ language plpgsql security definer;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
