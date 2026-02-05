# Deploying ShopQ

ShopQ is a quick shopping list app. It's 100% client-side with localStorage persistence, so the server just serves static files. This makes it extremely cheap to host.

## Option 1: Fly.io (Recommended)

**Cost:** Free tier available (3 shared-cpu-1x 256MB VMs)

```bash
# Install flyctl if not installed
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# From the shopq directory:
cd lodestar/apps/2026-02-03-shopq

# Create the app (first time only)
fly apps create shopq

# Deploy
fly deploy

# Set custom domain (requires DNS setup)
fly certs add shopq.com
```

### DNS Setup for shopq.com
Point your domain to Fly.io:
- **A record:** @ → fly.io IP (run `fly ips list` to get it)
- **AAAA record:** @ → fly.io IPv6 (if available)

Or use CNAME if using a subdomain.

## Option 2: Railway

**Cost:** $5/month minimum after trial

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From the shopq directory:
cd lodestar/apps/2026-02-03-shopq

# Initialize and deploy
railway init
railway up
```

### DNS Setup for Railway
Railway provides a default URL like `shopq-production.up.railway.app`.
For custom domain, add it in Railway dashboard → Settings → Domains.

## Option 3: Static Hosting (Simplest)

Since ShopQ is 100% client-side, you can host just the `public/` folder on:
- **GitHub Pages** (free)
- **Vercel** (free)
- **Netlify** (free)
- **Cloudflare Pages** (free)

Example with Vercel:
```bash
cd public
npx vercel
```

## Health Check

All deployments should verify the health endpoint works:
```bash
curl https://your-domain.com/api/health
# Should return: {"status":"ok"}
```

## Environment Variables

ShopQ doesn't require any environment variables. Optional:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - production/development

## Architecture Notes

- **No database:** All data stored in browser localStorage
- **No auth:** No user accounts
- **No backend APIs:** Just static file serving
- **Extremely light:** ~50KB total including all assets

This makes ShopQ ideal for free hosting tiers and edge deployment.
