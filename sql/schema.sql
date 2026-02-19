-- Create table for Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  subreddit text not null,
  url text,
  author text,
  post_id text unique not null, -- Reddit post ID
  upvotes int default 0,
  comment_count int default 0,
  created_at timestamptz default now(),
  crawled_at timestamptz default now()
);

-- Create table for Comments (optional, if we want to store comments)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  content text,
  author text,
  comment_id text unique not null, -- Reddit comment ID
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Create policy to allow read access to everyone
create policy "Public posts are viewable by everyone"
  on public.posts for select
  using ( true );

create policy "Public comments are viewable by everyone"
  on public.comments for select
  using ( true );

-- Create policy to allow insert/update only by service role (crawler)
-- Ideally, use a secure way, but for now we can rely on Service Role Key bypass RLS
-- Or explicit policy if needed.
