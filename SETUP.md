# SplitFree — Setup Guide

## Free hosting stack
- **Frontend + API**: [Vercel](https://vercel.com) (free tier — 100 GB bandwidth, unlimited deploys)
- **Database + Auth + Realtime**: [Supabase](https://supabase.com) (free tier — 500 MB DB, 1 GB storage, 50K MAU)

---

## 1. Supabase setup

1. Go to [supabase.com](https://supabase.com) → Create a free project
2. In the Supabase dashboard, go to **SQL Editor**
3. Paste and run the contents of `supabase/schema.sql`
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Local development

```bash
cp .env.local.example .env.local
# Fill in your Supabase values in .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 3. Deploy to Vercel (free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project from GitHub
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click Deploy — done!

---

## 4. Splitwise import

1. In Splitwise: **Account → Export to CSV**
2. In SplitFree: **Groups → Import** (top right button)
3. Upload the CSV → review → click Import

---

## Features

- Groups with multiple members
- Expense splitting: equal / percentage / exact / shares
- Real-time balance updates via Supabase Realtime
- Settle up with one tap
- Activity feed
- Splitwise CSV import
- Mobile-first PWA
- 100% free, no ads, no paywalls
