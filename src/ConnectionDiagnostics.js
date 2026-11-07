// Read-only authentication checks. Never return or log credentials.
async function DiagnoseConnection(fetchRequest, worker, apiKey, exportKey, uploaderType, uploaderId) {
    const path = "/assets/v1/operations/00000000-0000-0000-0000-000000000000";
    const probe = async (base, key) => {
        try {
            const response = await fetchRequest(base + path, { headers: { "x-api-key": key } });
            return response.status;
        } catch (_) {
            return "network/CORS";
        }
    };
    const results = await Promise.all([worker, "https://apis.roblox.com"].map(async base => ({
        status: await probe(base, apiKey),
        invalidKeyStatus: await probe(base, "figxporter-invalid-key-control")
    })));
    let keyInspection;
    try {
        const response = await fetchRequest(worker + "/diagnostics/roblox-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey, creatorType: uploaderType, creatorId: uploaderId })
        });
        keyInspection = await response.json();
    } catch (_) {
        keyInspection = { error: "network/CORS" };
    }
    return {
        inputMatchesExportKey: apiKey === exportKey,
        worker: results[0],
        direct: results[1],
        keyInspection
    };
}

module.exports = DiagnoseConnection;
