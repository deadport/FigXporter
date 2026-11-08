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
wrangler kv namespace create BRIDGE
# Copy the returned namespace ID into wrangler.toml before deploying.
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

The Figma plugin's **Test** button checks Roblox authentication without creating
assets. It also compares a SHA-256 fingerprint to confirm the Worker received the
same key as the plugin. Credentials are not logged or stored by the Worker.

## Authentication works directly but fails through the Worker

An Assets API `401 Invalid API Key` can also mean an IP restriction. The key
inspection endpoint provides the more specific Roblox error, including
`API key may not be used from this IP address.` The plugin reports that as an IP
restriction rather than assuming the key was copied incorrectly.

Check the key's IPv4 **and** IPv6 allowlist in Creator Dashboard. `0.0.0.0/0`
only covers IPv4. For cross-zone Worker requests to Cloudflare-proxied origins,
Cloudflare documents the shared Workers client IPv6 address
`2a06:98c0:3600::103`. If this is the origin being rejected, the specific CIDR
entry is `2a06:98c0:3600::103/128`; it does not allow every IPv6 address.
Preserve the other intended entries, save the key settings, and run **Test**
again. Changing or regenerating the secret alone does not establish that the
Worker's origin is allowed.

1. Open Creator Dashboard → API Keys and edit the key used in FigXporter.
2. Under Security, add `2a06:98c0:3600::103/128` to the allowed IPv6 addresses.
   Keep the other intended entries. If address fields are hidden, enable
   Restrict IP addresses to edit them, preserving any IPv4 entries still needed.
3. Click Save Changes To Key.
4. In FigXporter, click Test next to Worker URL. Confirm the key is valid,
   Assets Read/Write are enabled, and the creator target matches, then convert.

This is a public shared Cloudflare address, not a credential or your computer's
IP. Apply the same rule when creating a replacement key. The plugin's Help
section includes these steps as well.

The rule above is specific to the Cloudflare cross-zone route. With another
proxy provider, authorize that proxy's actual public outbound IP. For requests
sent directly from a computer, authorize that connection's public IP instead.
The computer's IP alone does not authorize requests sent by a separate proxy.

See [Cloudflare's Worker IP header documentation](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip-in-worker-subrequests).
