-- ==========================================
-- NEONOIR Supabase Schema
-- ==========================================

-- generations テーブル
create table if not exists generations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  graffiti_text  text not null,
  image_url      text not null,
  created_at     timestamptz default now()
);

-- RLS 有効化
alter table generations enable row level security;

-- ポリシー: ユーザーは自分のデータのみ参照
create policy "users can view own generations"
  on generations for select
  using (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のデータのみ挿入
create policy "users can insert own generations"
  on generations for insert
  with check (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のデータのみ削除
create policy "users can delete own generations"
  on generations for delete
  using (auth.uid() = user_id);

-- ==========================================
-- Storage バケット設定 (Supabase Dashboardで設定)
-- ==========================================
-- バケット名: generations
-- Public: true
-- ファイルサイズ制限: 10MB
-- 許可MIMEタイプ: image/png
