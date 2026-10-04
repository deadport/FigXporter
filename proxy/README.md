# Roblox Open Cloud CORS proxy

The Figma plugin can't call `apis.roblox.com` directly — plugin code runs in a
null-origin sandbox and Roblox's Open Cloud API doesn't send CORS headers, so the
browser blocks the request ("Failed to fetch"). This Cloudflare Worker forwards
the request server-to-server and adds the CORS headers the browser needs.

Your Roblox API key is **not** stored here — the plugin keeps sending its own
`x-api-key`, the Worker just relays it to Roblox.

## Deploy your own Worker (end users)

Every user should deploy their own Worker. The steps below take about five minutes.

### Option A — Wrangler CLI (recommended)

```bash
npm i -g wrangler
wrangler login          # opens browser, signs you into Cloudflare
cd proxy
wrangler deploy
```

Wrangler prints a URL like:

```
https://figma-to-roblox-proxy.<your-subdomain>.workers.dev
```

Copy that URL — you'll paste it into the plugin and the Studio plugin below.

### Option B — Cloudflare dashboard (no CLI)

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Worker**.
2. Name it anything (e.g. `figma-to-roblox-proxy`), click **Deploy**, then **Edit code**.
3. Paste the contents of [`worker.js`](worker.js) and click **Deploy**.
4. Copy the `*.workers.dev` URL shown at the top.

## Wire the URL into the plugin

Paste your `https://<name>.<subdomain>.workers.dev` URL into the plugin's
**Worker URL** setting (in the plugin UI). The manifest already allowlists
`https://*.workers.dev`, so any `workers.dev` subdomain works automatically.
If you use a **custom domain** instead of `workers.dev`, you'll need to add that
domain to `networkAccess.allowedDomains` in `manifest.json` and rebuild.

### Studio plugin

Paste the same URL into the **Worker URL** field in the "Figma to Roblox" dock
widget inside Roblox Studio.

## Verify the Worker is live

After deploying, visit `<your-worker-url>/ping` in a browser (or use curl).
You should get:

```json
{"ok":true}
```

The Figma plugin's **Test worker** button does the same check automatically.
