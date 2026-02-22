# LeadEngine SaaS Setup & Deployment Guide

Congratulations! Your multi-tenant lead generation platform is ready. Follow these steps to take it live.

## 1. Local Verification (Optional)
If you want to run the app on your computer first:
1.  Open your terminal in `d:\ALI\leadin`.
2.  Run `npm run dev`.
3.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 2. Pushing to GitHub
1.  Go to [GitHub.com](https://github.com/) and create a new **Private** repository named `leadengine-saas`.
2.  In your terminal, run these commands:
    ```bash
    git init
    git add .
    git commit -m "Initial commit: LeadEngine SaaS"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/leadengine-saas.git
    git push -u origin main
    ```

## 3. Deploying to Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New" > "Project"**.
3.  Import the `leadengine-saas` repository from GitHub.
4.  **Environment Variables**: In the "Environment Variables" section, add all the keys from your `.env.local`:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `GOOGLE_PLACES_API_KEY`
    - `VERCEL_CRON_SECRET` (Create a long random string here)
5.  Click **Deploy**.

## 4. Setting up the Daily Automation (Cron)
1.  Once deployed, go to the **Settings > Cron Jobs** tab in Vercel.
2.  Add a new Cron Job:
    - **Path**: `/api/cron/process-leads`
    - **Schedule**: `0 0 * * *` (This means every day at midnight).
3.  Ensure the `Authorization` header sent by the cron job matches your `VERCEL_CRON_SECRET`.

## 5. Multi-Tenant Testing
1.  Open your live URL.
2.  **User A**: Sign up with one email, create a "Real Estate" campaign.
3.  **User B**: Sign up with a different email, create a "Dentists" campaign.
4.  Trigger the cron job manually or wait for the daily cycle.
5.  Verify that User A **cannot** see User B's leads!
