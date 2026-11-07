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
//   3. Paste the resulting workers.dev URL into the Figma and Studio plugin settings.

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

// Check a supplied Roblox API key without creating an asset. The upstream
// introspection response is reduced to safe status/scope booleans; never echo
// the submitted key or Roblox's raw response body back to the plugin.
async function InspectRobloxKey(request) {
    if (request.method !== "POST") {
        return JsonResponse({ error: "Method not allowed" }, 405);
    }

    let Input;
    try {
        Input = await request.json();
    } catch (_) {
        return JsonResponse({ error: "Invalid JSON" }, 400);
    }

    const ApiKey = typeof Input.apiKey === "string" ? Input.apiKey.trim() : "";
    const CreatorType = Input.creatorType === "group" ? "group" : "user";
    const CreatorId = String(Input.creatorId || "").trim();
    if (!ApiKey) return JsonResponse({ error: "Missing API key" }, 400);

    let RobloxResponse;
    try {
        RobloxResponse = await fetch(`${ROBLOX_ORIGIN}/api-keys/v1/introspect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: ApiKey }),
            redirect: "manual",
        });
    } catch (_) {
        return JsonResponse({ error: "Roblox key inspection unavailable" }, 502);
    }

    let RawText = "";
    try {
        RawText = await RobloxResponse.text();
    } catch (_) {}
    let Data = {};
    try { Data = JSON.parse(RawText); } catch (_) {}
    const RobloxMessage = String(Data.message || Data.error ||
        (Array.isArray(Data.errors) && Data.errors[0] && Data.errors[0].message) || "").toLowerCase();
    let rejectionReason = null;
    if (!RobloxResponse.ok) {
        const ExplicitIpBlock = /(?:\bip\b|internet protocol).{0,60}(?:restrict|allow|whitelist|block|deny|unauthori[sz]ed|not allowed)|(?:restrict|allowlist|whitelist|block|deny).{0,60}(?:\bip\b|address)|requester.{0,30}address/i.test(RobloxMessage);
        if (ExplicitIpBlock) rejectionReason = "ip_restricted";
        else if (/expir/.test(RobloxMessage)) rejectionReason = "expired";
        else if (/disabled|inactive/.test(RobloxMessage)) rejectionReason = "disabled";
        else if (/moderated/.test(RobloxMessage)) rejectionReason = "moderated";
        else if (RobloxResponse.status === 401) rejectionReason = "invalid_key";
        else rejectionReason = "rejected";
    }

    const AssetScope = Array.isArray(Data.scopes)
        ? Data.scopes.find(Scope => Scope && Scope.name === "asset")
        : null;
    const HasOperation = (Operation) => !!AssetScope &&
        Array.isArray(AssetScope.operations) && AssetScope.operations.includes(Operation);
    const TargetIds = AssetScope
        ? (CreatorType === "group" ? AssetScope.groupIds : AssetScope.userIds)
        : null;
    const TargetMatches = Array.isArray(TargetIds)
        ? TargetIds.includes("*") || TargetIds.includes(CreatorId)
        : null;

    console.log(JSON.stringify({
        event: "roblox_key_introspection",
        status: RobloxResponse.status,
        apiKeyPresent: !!ApiKey,
    }));

    return JsonResponse({
        status: RobloxResponse.status,
        valid: RobloxResponse.ok,
        rejectionReason,
        enabled: typeof Data.enabled === "boolean" ? Data.enabled : null,
        expired: typeof Data.expired === "boolean" ? Data.expired : null,
        assetRead: HasOperation("read"),
        assetWrite: HasOperation("write"),
        assetReadTargetMatches: HasOperation("read") ? TargetMatches : false,
        assetWriteTargetMatches: HasOperation("write") ? TargetMatches : false,
    }, 200);
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
            return JsonResponse({ ok: true, service: "figxporter", version: "2026-11-06", bridge: !!env.BRIDGE }, 200);
        }

        if (Incoming.pathname === "/diagnostics/roblox-key") {
            return InspectRobloxKey(request);
        }

        // Bridge endpoints are handled locally (KV), not forwarded to Roblox.
        if (Incoming.pathname.startsWith("/bridge/")) {
            const Code = decodeURIComponent(Incoming.pathname.slice("/bridge/".length));
            return HandleBridge(request, env, Code);
        }

        if (!Incoming.pathname.startsWith("/assets/v1/")) {
            return JsonResponse({ error: "Route not found" }, 404);
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
                redirect: "manual",
            });
        } catch (e) {
            return new Response(
                JSON.stringify({ proxyError: true, message: String(e) }),
                { status: 502, headers: { "Content-Type": "application/json", ...CorsHeaders() } }
            );
        }

        // Relay Roblox's response, adding CORS headers.
        if (RobloxResponse.status >= 300 && RobloxResponse.status < 400) {
            return JsonResponse({ proxyError: true, message: "Unexpected redirect from Roblox" }, 502);
        }
        console.log(JSON.stringify({ event: "roblox_proxy", method: request.method,
            status: RobloxResponse.status, apiKeyPresent: ForwardHeaders.has("x-api-key") }));
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
