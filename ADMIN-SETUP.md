# Admin uploader + custom domain — setup

The code is done. These are the one-time steps only you can do in the Vercel
dashboard and at your domain registrar. Everything below is on the **Vercel**
deployment (the admin backend does **not** run on GitHub Pages — Pages is
static, so its gallery just shows the photos committed to the repo).

## What was added
- `admin/` — the uploader page, served at **ruheenasyed.com/admin**.
- `api/upload.js` — receives a photo and stores it (password-protected).
- `api/photos.js` — lists photos (public) and deletes one (password-protected).
- The main gallery calls `/api/photos` and adds any uploaded photos in.
- Typing **`admin`** anywhere on the site opens `ruheenasyed.com/admin` in a new tab.

Uploaded photos are stored in **Vercel Blob** and show for **everyone, on any device**.

---

## 1. Create the Blob store (storage)
1. Vercel dashboard → your project → **Storage** tab → **Create** → **Blob**.
2. Name it anything (e.g. `ruheena-photos`) → **Create**, and make sure it's
   **connected to this project**. Vercel then auto-injects the
   `BLOB_READ_WRITE_TOKEN` env var — you don't copy it manually.

## 2. Set the admin password
Project → **Settings → Environment Variables** → add:

| Name | Value | Environments |
|------|-------|--------------|
| `ADMIN_PASSWORD` | *(a password you choose)* | Production (and Preview if you want) |

## 3. Redeploy
Project → **Deployments** → redeploy the latest, **or** just push a commit
(this repo push already triggers it). The redeploy is what installs
`@vercel/blob` and activates the `/api` functions.

> If the deploy fails on framework detection: Settings → **Build & Development**
> → Framework Preset = **Other**, no Build Command, Output Directory = *(root/empty)*.

## 4. Point ruheenasyed.com at Vercel
Project → **Settings → Domains** → add `ruheenasyed.com` (and `www.ruheenasyed.com`).
Vercel shows the exact DNS records — add them at your registrar. They're
normally:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` (apex) | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

**Use exactly what the Vercel dashboard shows** — it occasionally differs.
DNS can take from minutes up to ~24h. Once it's verified, tick to enforce HTTPS.

---

## How to use it
1. On the site, type **`admin`** (or just visit **ruheenasyed.com/admin**).
2. Enter the admin password (saved for that browser session).
3. Drop or choose photos — they're auto-resized and uploaded.
4. They appear in the gallery for everyone. (Open pages may need a refresh.)

To remove one: on the admin page, click **Delete** under its thumbnail.

## Notes
- The password guards uploads/deletes; anyone can *view* photos (as intended).
- Photos are downscaled to ~1600px before upload to stay fast and small.
- The `api/*.js` source is public (served statically on Pages too) but holds
  **no secrets** — the password and Blob token live only in Vercel env vars.
