# StackSaver — Automated Self-Hosted vs. Cloud SaaS Programmatic SEO Engine

A zero-dependency, self-updating Programmatic SEO (pSEO) & interactive cost-calculator directory built to generate passive affiliate income with **$0.00 startup or hosting cost**.

## Why This Architecture Works

1. **High Buyer Intent Traffic:** Targets commercial queries where developers, founders, and IT managers are actively deciding between paying for a SaaS subscription or renting a VPS (e.g., *"self-host n8n cost vs Zapier"*, *"Coolify VPS requirements"*, *"open-source Intercom alternative"*).
2. **Double-Sided Monetization:**
   - **Self-Hosters:** Dynamically sizes the exact VPS RAM/vCPU needed and links to **Hostinger VPS, DigitalOcean ($200 Free Credit), Vultr ($100 Free Credit), Hetzner, and Railway** via `/go/[provider]/` redirect links.
   - **Non-Technical Buyers:** Links to the **Official Managed Cloud / SaaS Trial** (e.g., n8n Cloud, Notion, Make) so you earn a commission regardless of which path the user picks.
3. **Zero-Maintenance Automation:**
   - Written in pure Node.js standard library (`zero npm dependencies` — nothing to break or patch years from now).
   - `.github/workflows/auto-deploy.yml` wakes up every Monday at 06:00 UTC, queries the free GitHub API for live stars/forks/releases, updates the `"Verified: YYYY-MM-DD"` freshness signals, rebuilds **115+ static HTML pages + `sitemap.xml` + `llms.txt`**, and deploys to **GitHub Pages** or **Cloudflare Pages** for free.

---

## Quick Start (Local Preview)

Using **Python 3** (already installed on your machine — zero dependencies):

```powershell
# 1. Fetch latest live GitHub stars & release dates
python scripts/update_github_stats.py

# 2. Generate all 115+ static pages into ./dist
python scripts/build_site.py

# 3. Preview locally at http://localhost:4000
python -m http.server 4000 --directory dist
```

*(Node.js equivalent scripts `scripts/update-github-stats.mjs` and `scripts/build-site.mjs` are also included if deploying on a Node-based CI runner).*

---

## Step-by-Step Launch & Monetization Checklist ($0 Cost)

### Step 1: Sign Up for Instant-Approval Referral & Affiliate Programs
Open [`data/affiliates.json`](./data/affiliates.json) and replace the placeholder URLs (`YOUR_AFFILIATE_ID`) with your tracking links:

| Partner | Cash Payout / Commission | Cost to Join | Where to Get Your Link |
| :--- | :--- | :--- | :--- |
| **Hostinger VPS** | Up to **60% CASH per sale** ($30–$150+ via PayPal/Bank) | **$0 (Individual)** | [Hostinger Affiliates](https://www.hostinger.com/affiliates) |
| **Cloudways** | Up to **$125 CASH per sale** OR **$30 + 7% lifetime recurring** via PayPal | **$0 (Individual)** | [Cloudways Affiliate Program](https://www.cloudways.com/en/affiliate.php) |
| **Kamatera Cloud** | **$50–$100 CASH per sale** via PayPal (gives visitors $100 30-day free trial) | **$0 (Individual)** | [Kamatera Affiliates](https://www.kamatera.com/affiliates/) |
| **Contabo VPS** | Up to **€125 CASH per sale** (via CJ Affiliate publisher account) | **$0 (Individual)** | [Contabo Affiliate Program](https://contabo.com/en/affiliate-program/) |
| **Railway App** | **15% recurring commission** (cash out via Stripe) | **$0 (GitHub Login)** | [Railway Referrals](https://railway.app) |
| **n8n / Make / Notion** | **20%–30% recurring CASH** SaaS commissions | **$0 (Individual)** | [PartnerStack](https://partnerstack.com/) & [Make Affiliates](https://www.make.com/en/partners-affiliates) |

> **Tip:** All outbound links on the site route through `/go/[partner-id]/` (with `rel="nofollow sponsored"` and `noindex`), so you only ever have to edit `data/affiliates.json` once!

### Step 2: Deploy Free Forever on Cloudflare Pages or GitHub Pages
- **Option A: Cloudflare Pages (Recommended — Free `.pages.dev` subdomain or custom domain)**
  1. Push this folder to a free GitHub repository.
  2. In Cloudflare Dashboard → **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**.
  3. Set Build Command to `npm run build` and Build Output Directory to `dist`.
- **Option B: GitHub Pages (100% Automated via Included Workflow)**
  1. Push this folder to a public GitHub repository on branch `main`.
  2. Note: If deploying to `https://<username>.github.io/<repo-name>/`, set `"basePath": "/<repo-name>"` and `"domain": "https://<username>.github.io"` in `data/affiliates.json`.
  3. In your GitHub repo, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
  4. The included workflow `.github/workflows/auto-deploy.yml` will build, deploy, and auto-refresh every Monday!

### Step 3: Index Your 115+ Pages on Google, Bing & AI Search
1. Verify your site in **Google Search Console** and **Bing Webmaster Tools** (both 100% free).
2. Submit `/sitemap.xml` — this indexes all 115+ `/self-host/[tool]/`, `/alternatives-to/[saas]/`, and `/compare/[a]-vs-[b]/` pages immediately.
3. AI search engines (ChatGPT Search, Perplexity, Claude) will automatically read your generated `/llms.txt` index.
