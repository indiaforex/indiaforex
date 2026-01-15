# How to Deploy "IndiaForex Market Board" for Free

The easiest and best way to host this Next.js application for free is **Vercel**. Vercel is the company behind Next.js, so the compatibility is perfect.

## Prerequisites

1.  **GitHub Account**: You need a GitHub account to store your code.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.

---

## Step 1: Push Your Code to GitHub

If you haven't already pushed your code to GitHub, follow these steps in your terminal (VS Code):

1.  **Initialize Git** (if not done):
    ```powershell
    git init
    git add .
    git commit -m "Ready for deployment"
    ```

2.  **Create a Repository on GitHub**:
    *   Go to [github.com/new](https://github.com/new).
    *   Name it `india-forex-board`.
    *   Keep it **Public** (easier for free tier) or Private.
    *   Click **Create repository**.

3.  **Link and Push**:
    *   Copy the commands shown on GitHub under "…or push an existing repository from the command line".
    *   They will look like this:
        ```powershell
        git remote add origin https://github.com/YOUR_USERNAME/india-forex-board.git
        git branch -M main
        git push -u origin main
        ```

---

## Step 2: Deploy on Vercel

1.  **Go to Vercel Dashboard**: Log in to [vercel.com](https://vercel.com).
2.  **Add New Project**: Click **"Add New..."** -> **"Project"**.
3.  **Import Git Repository**:
    *   You should see your `india-forex-board` repo in the list.
    *   Click **Import**.

---

## Step 3: Configure Environment Variables (CRITICAL)

Before clicking "Deploy", you must tell Vercel your Supabase keys.

1.  In the **"Configure Project"** screen, look for **"Environment Variables"**.
2.  Add the variables from your local `.env.local` file:

    | Name | Value |
    | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | `your_supabase_project_url` |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_supabase_anon_key` |

    *(Copy these values exactly from your `.env.local` file)*.

---

## Step 4: Finish & Live

1.  Click **Deploy**.
2.  Vercel will build your project (this takes about 1-2 minutes).
3.  Once done, you will get a live URL (e.g., `https://india-forex-board.vercel.app`).

## Verification

*   Visit the live URL.
*   Check that the **Dashboard**, **Forum**, and **Auth** (Login) work.
*   **Note on Auth**: You might need to add your new Vercel domain to your **Supabase Auth Redirect URLs** setting:
    *   Go to Supabase Dashboard -> Authentication -> URL Configuration.
    *   Add `https://your-project-name.vercel.app/**` to "Redirect URLs".

---

## Alternative: Netlify

If you prefer, **Netlify** is also a great free option. The steps are very similar:
1.  Login to Netlify with GitHub.
2.  "Import from Git".
3.  Add Environment Variables in "Site Settings" -> "Environment variables".
