# Teepresso Clone — Batch Photo T-Shirt Platform 🎓👕

A graduation and batch apparel platform built with **Next.js 14**, **Tailwind CSS**, and **TypeScript**, specifically designed for effortless 1-click deployment on **Vercel** with custom subdomains.

---

## 🌟 Features Included

1. **Editorial Landing Page (`/`)**:
   - Hero section with dual-view T-Shirt Mockup (Front collage + Back jersey print).
   - Real-time layout switcher (`Square`, `Honeycomb`, `Chain`).
   - Dynamic batch progress counter pill and friends-joined indicators.
   - Interactive pricing packages (`Basic ₹150`, `Salina ₹150`, `Top ₹200`) with a class-size slider.
   - Step-by-step workflow guide and FAQ accordion.
   - Floating WhatsApp support button.

2. **4-Step Batch Creator Wizard (`/create`)**:
   - **Step 1: Batch Info**: College Name (with popular Indian college suggestions), Course/Section, Graduating Year, Duration (3/4/5 yrs) with auto-calculated batch range (e.g., `2023 - 2027`).
   - **Step 2: Organizer Contact**: Email & WhatsApp phone number.
   - **Step 3: Pack Selection**: Basic, Salina (+ Keepsake Frame), Top (+ Tapify NFC Keychain), and Express priority dispatch toggle (+20%).
   - **Step 4: Design**: Front shape (`Square`, `Honeycomb`, `Chain`), back design templates, roll digits count, and college logo toggle.
   - **Sticky Live Preview**: Real-time shirt mockup, people count slider, and instant cost summary breakdown.

3. **Organizer Dashboard (`/dashboard/[batchId]`)**:
   - Live metrics: Total Joined, Photos Submitted, Sizes Collected, Layout Type.
   - Size breakdown badge counter (XS, S, M, L, XL, 2XL, 3XL).
   - Roster table with photo thumbnails, jersey names, roll numbers, and quick actions.
   - 1-Click WhatsApp share link generator & QR invite helper.
   - Manual member addition modal for offline classmates.
   - Export formatted `.csv` roster file for garment manufacturers.
   - Real-time live shirt mosaic showing uploaded classmate photos.

4. **Student Join Flow (`/join/[batchId]`)**:
   - Mobile-first, friction-free interface designed for students clicking WhatsApp links.
   - Photo upload or sample portrait picker.
   - Jersey name & roll number customization with interactive size chart guide.
   - Live personal mockup preview of their name & face on the shirt.
   - Celebratory confetti explosion upon submission.

5. **Batch Portal (`/batches`)**:
   - Search and return to any active batch by college, department, or organizer email.

---

## 🚀 Local Development

```bash
cd batch-tees-platform
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 How to Deploy to Netlify (Step-by-Step)

### Option A: Via GitHub (Recommended)
1. Push this repository to GitHub (e.g., `https://github.com/Var7745/tshirt-print`).
2. Log in to [Netlify](https://app.netlify.com).
3. Click **"Add new site"** → **"Import an existing project"**.
4. Select **GitHub** and choose the `tshirt-print` repository.
5. Netlify will automatically apply settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node.js Version:** `22.12.0` (required for SQLite `node:sqlite`)
   - **Plugin:** `@netlify/plugin-nextjs`
6. Click **"Deploy site"**. Your platform will be deployed with automatic global CDN and SSL!

---

## 🌐 How to Deploy to Vercel (Step-by-Step)

### Option A: Via GitHub (Recommended)
1. Push this folder to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Batch Apparel Platform"
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```
2. Go to [https://vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** → **"Project"**.
4. Import your GitHub repository.
5. Keep default settings (Framework preset: Next.js) and click **"Deploy"**.
6. Your website is live in ~60 seconds!

---

## 🔗 How to Configure a Subdomain on Vercel

### 1. Free Vercel Subdomain (e.g. `yourbrand.vercel.app`)
- In your Vercel Project Dashboard:
  - Go to **Settings** → **Domains**.
  - Edit the default domain to whatever name you want (e.g. `teepresso-india.vercel.app` or `mycollegebatch.vercel.app`).
  - It becomes active immediately with free automatic SSL!

### 2. Custom Subdomain (e.g. `app.yourdomain.com` or `tees.yourcollege.com`)
- In your Vercel Project Dashboard:
  - Go to **Settings** → **Domains**.
  - Type your subdomain (e.g., `batch.yourbrand.com`) and click **Add**.
  - Vercel will show you the DNS record to add:
    - **Type**: `CNAME`
    - **Name**: `batch` (or your subdomain prefix)
    - **Value**: `cname.vercel-dns.com`
  - Add this `CNAME` record in your domain registrar (GoDaddy, Namecheap, Cloudflare, Hostinger, etc.).
  - Within 2-10 minutes, Vercel will verify the record and automatically provision an SSL certificate!
