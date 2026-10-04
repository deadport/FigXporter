// Cloudflare Worker — CORS proxy for the Roblox Open Cloud Assets API.
//
// A Figma plugin runs in a null-origin sandbox, so calls to apis.roblox.com are
// blocked by CORS (the x-api-key header forces a preflight that Roblox does not
// answer). This Worker sits in between: the plugin calls the Worker, the Worker
// forwards the request server-to-server (no CORS there) to Roblox, and adds the
// CORS headers the browser requires on the way back.
//
// The plugin keeps sending its own x-api-key, so this Worker never stores any
// credentials — it is a transparent relay scoped to apis.roblox.com only.
//
// Deploy:
//   1. npm i -g wrangler   (or use the Cloudflare dashboard "Quick edit")
//   2. wrangler deploy     (from this proxy/ folder)
//   3. Copy the resulting https://<name>.<subdomain>.workers.dev URL into both
//      manifest.json (allowedDomains) and src/Converters.js (ROBLOX_ASSETS_API).

const ROBLOX_ORIGIN = "https://apis.roblox.com";

// Headers we relay from the plugin to Roblox.
const FORWARD_REQUEST_HEADERS = ["x-api-key", "content-type"];

// Bridge: how long a stored export survives if Studio never picks it up (seconds).
const BRIDGE_TTL_SECONDS = 3600;

function CorsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "x-api-key, content-type",
        "Access-Control-Max-Age": "86400",
    };
}

function JsonResponse(Data, Status) {
    return new Response(JSON.stringify(Data), {
        status: Status,
        headers: { "Content-Type": "application/json", ...CorsHeaders() },
    });
}

// Figma <-> Studio handoff over the Worker.
//   POST /bridge/:code  — Figma stores an .rbxmx payload keyed by a session code.
//   GET  /bridge/:code  — Studio polls and retrieves it; by default the entry is
//                         cleared on read so the same export isn't inserted twice.
//                         Pass ?peek=1 to read without clearing.
async function HandleBridge(request, env, Code) {
    if (!env.BRIDGE) {
        return JsonResponse({ error: "Bridge KV namespace not bound" }, 500);
    }
    if (!Code) {
        return JsonResponse({ error: "Missing session code" }, 400);
    }

    if (request.method === "POST") {
        const Body = await request.text();
        if (!Body) {
            return JsonResponse({ error: "Empty body" }, 400);
        }
        await env.BRIDGE.put(Code, Body, { expirationTtl: BRIDGE_TTL_SECONDS });
        return JsonResponse({ ok: true, code: Code }, 200);
    }

    if (request.method === "GET") {
        const Stored = await env.BRIDGE.get(Code);
        if (Stored === null) {
            return JsonResponse({ pending: true }, 404);
        }
        const Url = new URL(request.url);
        if (Url.searchParams.get("peek") !== "1") {
            await env.BRIDGE.delete(Code);
        }
        return new Response(Stored, {
            status: 200,
            headers: { "Content-Type": "application/xml", ...CorsHeaders() },
        });
    }

    return JsonResponse({ error: "Method not allowed" }, 405);
}

export default {
    async fetch(request, env) {
        // Preflight — answer it ourselves so the browser lets the real request through.
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CorsHeaders() });
        }

        const Incoming = new URL(request.url);

        // Health check — used by the plugin's "Test worker" button.
        if (Incoming.pathname === "/ping") {
            return JsonResponse({ ok: true }, 200);
        }

        // Bridge endpoints are handled locally (KV), not forwarded to Roblox.
        if (Incoming.pathname.startsWith("/bridge/")) {
            const Code = decodeURIComponent(Incoming.pathname.slice("/bridge/".length));
            return HandleBridge(request, env, Code);
        }

        // Forward the exact path + query (e.g. /assets/v1/assets) to Roblox.
        const Target = ROBLOX_ORIGIN + Incoming.pathname + Incoming.search;

        const ForwardHeaders = new Headers();
        for (const Name of FORWARD_REQUEST_HEADERS) {
            const Value = request.headers.get(Name);
            if (Value) ForwardHeaders.set(Name, Value);
        }

        // Read the body fully so multipart uploads forward reliably.
        const Body = request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await request.arrayBuffer();

        let RobloxResponse;
        try {
            RobloxResponse = await fetch(Target, {
                method: request.method,
                headers: ForwardHeaders,
                body: Body,
            });
        } catch (e) {
            return new Response(
                JSON.stringify({ proxyError: true, message: String(e) }),
                { status: 502, headers: { "Content-Type": "application/json", ...CorsHeaders() } }
            );
        }

        // Relay Roblox's response, adding CORS headers.
        const ResponseHeaders = new Headers(RobloxResponse.headers);
        for (const [Key, Value] of Object.entries(CorsHeaders())) {
            ResponseHeaders.set(Key, Value);
        }

        return new Response(RobloxResponse.body, {
            status: RobloxResponse.status,
            statusText: RobloxResponse.statusText,
            headers: ResponseHeaders,
        });
    },
};
