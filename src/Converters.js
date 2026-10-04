const Conversions = require("./Conversions");
const { Flags, NotifyError, NotifyImportantMessage, AppendUnsupportedAction } = require("./Utilities");
const createHash = require("create-hash/browser");

let AbortImageUpload = false;
let ImageUploadTimeoutId;
let ImagesRemaining = 0;
let ImageUploadsReady = 0;
const ImageExports = {};
const ImageUploads = [];
const Settings = {
    //ApiKey: "",
    DefaultExport: {
        format: "PNG",
        contentsOnly: true,
        constraint: {
            type: "SCALE",
            value: 2
        }
    },
    //ApplyAspectRatio: false, // Changed to Flag (/Utilities.js)
    //ExportVectors: true, // Changed to Flag (/Utilities.js)
    ApplyZIndex: true, // Not implemented?
    ApplyLayoutOrder: true,
    UploadImages: false,
    DownloadImages: false,
    UploadEffects: false,
    CloudApiKey: "",
    UploaderId: "",
    UploaderType: "user",
    SendToStudio: false, // Bridge: push the export straight to Studio via the Worker
    BridgeCode: "",      // Bridge: session code shared with the Studio plugin
    WorkerUrl: "",       // User-deployed Cloudflare Worker base URL (required for image upload + Send to Studio)
    CustomFonts: {},     // User-defined { "Figma family name": <Roblox font asset id> } overrides (Fonts panel)
};

function WorkerBase() {
    let b = (Settings.WorkerUrl || "").trim().replace(/\/+$/, "");
    if (b && !/^https?:\/\//i.test(b)) b = "https://" + b;
    return b;
}

function AssetsApi() {
    const b = WorkerBase();
    return b ? b + "/assets/v1" : "";
}

const PLACEHOLDER_IMAGE = "rbxasset://textures/StudioSharedUI/TransparentWhiteImagePlaceholder.png";

// Roblox's Open Cloud API can't be called directly from a Figma plugin (null-origin
// sandbox + no CORS headers => "Failed to fetch"). Requests go through the user's
// deployed Cloudflare Worker (proxy/ folder). Set WorkerUrl in plugin settings.

function ConvertFill(Fill, Object) {
    if (Fill.visible === false) return [{}, 0]

    var Transparency = Fill.opacity;
    var Color3 = {R: 1, G: 1, B: 1};

    switch (Fill.type) {
        case "SOLID":
            Transparency = Fill.opacity;
            Color3 = {
                R: Fill.color.r,
                G: Fill.color.g,
                B: Fill.color.b,
            };

            break;
        case "GRADIENT_LINEAR":
            Transparency = Fill.opacity;
            Color3 = { R: 1, G: 1, B: 1 };

            if (!Object._hasExport) {
                Object._HasGradient = true;
                Object.Children.push({
                    Class: "UIGradient",
                    Enabled: Fill.visible,
                    Rotation: -(Conversions.getGradientRotation(Fill.gradientTransform) - 90),
                    Offset: { // TODO?
                        X: 0,
                        Y: 0
                    },
                    Color: Fill.gradientStops.map((Stop) => {
                        return {
                            Colour: {
                                R: Stop.color.r,
                                G: Stop.color.g,
                                B: Stop.color.b
                            },
                            TimePosition: Stop.position
                        }
                    }),
                    Transparency: Fill.gradientStops.map((Stop) => {
                        return {
                            Transparency: 1 - Stop.color.a,
                            TimePosition: Stop.position
                        }
                    })
                })
            }

            break;
    }

    // Guard against NaN/out-of-range opacity values (e.g. missing Fill.opacity) reaching the RBXMX as an invalid Transparency
    if (typeof(Transparency) !== "number" || isNaN(Transparency)) Transparency = 1;
    else if (Transparency < 0) Transparency = 0;
    else if (Transparency > 1) Transparency = 1;

    return [Color3, Transparency];
}

function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Figma's plugin sandbox does not provide TextEncoder, so we encode UTF-8 manually
function EncodeUTF8(Text) {
    const Bytes = [];
    for (let i = 0; i < Text.length; i++) {
        let Code = Text.charCodeAt(i);

        if (Code < 0x80) {
            Bytes.push(Code);
        } else if (Code < 0x800) {
            Bytes.push(0xc0 | (Code >> 6), 0x80 | (Code & 0x3f));
        } else if (Code >= 0xd800 && Code <= 0xdbff && i + 1 < Text.length) {
            // Surrogate pair
            const Low = Text.charCodeAt(++i);
            Code = 0x10000 + ((Code & 0x3ff) << 10) + (Low & 0x3ff);
            Bytes.push(0xf0 | (Code >> 18), 0x80 | ((Code >> 12) & 0x3f), 0x80 | ((Code >> 6) & 0x3f), 0x80 | (Code & 0x3f));
        } else {
            Bytes.push(0xe0 | (Code >> 12), 0x80 | ((Code >> 6) & 0x3f), 0x80 | (Code & 0x3f));
        }
    }
    return new Uint8Array(Bytes);
}

// Polls a Roblox Open Cloud "operation" until it completes, returning the resulting AssetId
async function PollAssetOperation(OperationPath, UploadId) {
    const MAX_ATTEMPTS = 40;
    const POLL_INTERVAL = 1500;

    for (let Attempt = 1; Attempt <= MAX_ATTEMPTS; Attempt++) {
        if (AbortImageUpload) throw new Error("Upload was aborted");

        await Sleep(POLL_INTERVAL);

        console.log(`[FTR][Upload] (${UploadId}) Polling operation "${OperationPath}" (attempt ${Attempt}/${MAX_ATTEMPTS})`);

        const Response = await fetch(`${AssetsApi()}/${OperationPath}`, {
            method: "GET",
            headers: {
                "x-api-key": Settings.CloudApiKey
            }
        });

        const RawText = await Response.text();
        console.log(`[FTR][Upload] (${UploadId}) Operation response (HTTP ${Response.status}):`, RawText);

        if (!Response.ok) {
            throw new Error(`Roblox operation check failed (HTTP ${Response.status}): ${RawText}`);
        }

        let Json;
        try {
            Json = JSON.parse(RawText);
        } catch (e) {
            throw new Error(`Invalid JSON received while polling Roblox operation: ${RawText}`);
        }

        if (Json.done) {
            if (!Json.response || !Json.response.assetId) {
                throw new Error(`Roblox operation finished without an AssetId: ${RawText}`);
            }

            console.log(`[FTR][Upload] (${UploadId}) AssetId received: ${Json.response.assetId}`);
            return Json.response.assetId;
        }
    }

    throw new Error(`Timed out waiting for Roblox to finish processing the uploaded image (Operation: "${OperationPath}")`);
}

// Uploads a single image directly to the Roblox Open Cloud Assets API (no external proxy), returning the resulting AssetId
async function UploadImageToRoblox(Bytes, Name, Format, UploadId) {
    console.log(`[FTR][Upload] (${UploadId}) Starting upload of "${Name}.${Format}" (${Bytes.length} bytes)`);

    if (!WorkerBase()) {
        throw new Error("Worker URL is not set. Deploy your Cloudflare Worker (see the proxy/ folder) and paste its URL in the plugin settings.");
    }

    if (!Settings.CloudApiKey || !Settings.UploaderId) {
        throw new Error("Cloud API Key / UploaderId is not set, please create one at: https://create.roblox.com/dashboard/credentials?activeTab=ApiKeysTab");
    }

    const UploaderIdNumber = parseInt(Settings.UploaderId);
    if (isNaN(UploaderIdNumber)) {
        throw new Error(`UploaderId "${Settings.UploaderId}" is not a valid number`);
    }

    const Creator = Settings.UploaderType === "group"
        ? { groupId: String(UploaderIdNumber) }
        : { userId: String(UploaderIdNumber) };

    const SanitisedName = (Name || "Image").replace(/[^a-zA-Z0-9 _-]/g, "").substring(0, 50) || "Image";

    const RequestJson = JSON.stringify({
        assetType: "Decal",
        displayName: SanitisedName,
        description: "Uploaded by Figma to Roblox",
        creationContext: {
            creator: Creator
        }
    });

    const Boundary = "FigmaToRobloxBoundary" + Math.random().toString(16).slice(2);

    const Head = EncodeUTF8(
        `--${Boundary}\r\n` +
        `Content-Disposition: form-data; name="request"\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${RequestJson}\r\n` +
        `--${Boundary}\r\n` +
        `Content-Disposition: form-data; name="fileContent"; filename="${SanitisedName}.${Format}"\r\n` +
        `Content-Type: image/${Format}\r\n\r\n`
    );
    const Tail = EncodeUTF8(`\r\n--${Boundary}--\r\n`);

    const Body = new Uint8Array(Head.length + Bytes.length + Tail.length);
    Body.set(Head, 0);
    Body.set(Bytes, Head.length);
    Body.set(Tail, Head.length + Bytes.length);

    console.log(`[FTR][Upload] (${UploadId}) POST ${AssetsApi()}/assets, creator: ${JSON.stringify(Creator)}, displayName: "${SanitisedName}"`);

    const Response = await fetch(`${AssetsApi()}/assets`, {
        method: "POST",
        headers: {
            "x-api-key": Settings.CloudApiKey,
            "Content-Type": `multipart/form-data; boundary=${Boundary}`
        },
        body: Body
    });

    const RawText = await Response.text();
    console.log(`[FTR][Upload] (${UploadId}) Roblox response (HTTP ${Response.status}):`, RawText);

    let Json;
    try {
        Json = JSON.parse(RawText);
    } catch (e) {
        throw new Error(`Invalid JSON response from Roblox (HTTP ${Response.status}): ${RawText}`);
    }

    if (!Response.ok) {
        const FirstError = Json.errors && Json.errors[0];
        const ErrMessage = (FirstError && FirstError.message) || Json.message || RawText;
        const ErrCode = FirstError && FirstError.code;
        throw new Error(`Roblox upload failed (HTTP ${Response.status}${ErrCode !== undefined ? `, code ${ErrCode}` : ""}): ${ErrMessage}`);
    }

    if (Json.done && Json.response && Json.response.assetId) {
        console.log(`[FTR][Upload] (${UploadId}) AssetId received immediately: ${Json.response.assetId}`);
        return Json.response.assetId;
    }

    if (!Json.path) {
        throw new Error(`Unexpected response from Roblox, missing operation path: ${RawText}`);
    }

    return PollAssetOperation(Json.path, UploadId);
}

let UploadQueue = [];
let UploadQueueRunning = false;
let UploadStats = { total: 0, finished: 0, failed: 0 };

function PostUploadProgress() {
    figma.ui.postMessage({
        type: "UploadProgress",
        total: UploadStats.total,
        finished: UploadStats.finished,
        failed: UploadStats.failed,
        pending: UploadQueue.length
    });
}

// Queues an image for upload, processing one at a time to respect Roblox's rate limits
function QueueImageUpload(Bytes, Name, Format, UploadId) {
    UploadQueue.push({ Bytes, Name, Format, UploadId });
    UploadStats.total += 1;
    console.log(`[FTR][Upload] (${UploadId}) Queued image "${Name}.${Format}" for upload (queue length: ${UploadQueue.length})`);
    PostUploadProgress();

    if (!UploadQueueRunning) ProcessUploadQueue();
}

async function ProcessUploadQueue() {
    UploadQueueRunning = true;

    while (UploadQueue.length > 0) {
        if (AbortImageUpload) {
            console.warn(`[FTR][Upload] Upload aborted, discarding ${UploadQueue.length} queued image(s)`);

            UploadQueue.forEach(({ UploadId }) => UpdateImage({ id: UploadId, data: { imageContent: PLACEHOLDER_IMAGE } }));
            UploadStats.failed += UploadQueue.length;
            UploadQueue = [];
            PostUploadProgress();
            break;
        }

        const { Bytes, Name, Format, UploadId } = UploadQueue.shift();

        try {
            const AssetId = await UploadImageToRoblox(Bytes, Name, Format, UploadId);
            UpdateImage({ id: UploadId, data: { assetId: AssetId } });
            UploadStats.finished += 1;
        } catch (e) {
            console.error(`[FTR][Upload] (${UploadId}) FAILED:`, e);
            NotifyError(`FAILED to upload image "${Name}", got error "${e.message}". Help can be found in the discord server https://discord.gg/DWCGss4vry`, false, {
                timeout: 5000,
                error: true,
            });
            UpdateImage({ id: UploadId, data: { imageContent: PLACEHOLDER_IMAGE } });
            UploadStats.failed += 1;
        }

        PostUploadProgress();

        // Small delay between uploads to respect Roblox's rate limits
        if (UploadQueue.length > 0) await Sleep(500);
    }

    UploadQueueRunning = false;
}

function ExportImage(Node, Properties, CustomExport, ForceReupload, FullWhiteout) {
    let AssetId = Node.getPluginData("AssetId");
    const OperationId = false; //Node.getPluginData("OperationId");

    if (AssetId && AssetId.match(/[0-9]+/)) AssetId = AssetId.match(/[0-9]+/)[0];

    console.log(`[FTR][Export] Exporting Image for Node "${Node.name}" (${Node.id}), UploadImages: ${Settings.UploadImages}, DownloadImages: ${Settings.DownloadImages}, existing AssetId: ${AssetId || "none"}`);

    Properties._ExportAsImage = true;
    //Properties.BackgroundTransparency = 0;

    // A flattened image bakes its descendants' drop shadows into the PNG, but those
    // children are never converted on their own, so their EffectRadius is otherwise lost.
    // Fold the largest descendant shadow into this node's EffectRadius so the image is
    // padded to fit the shadow — keeping grouped and ungrouped variants the same size.
    if (Node.children && Node.children.length) {
        const DescRadius = GetDescendantEffectRadius(Node, Properties.EffectRadius);
        if (DescRadius && (DescRadius.X > 0 || DescRadius.Y > 0)) Properties.EffectRadius = DescRadius;
    }

    if (!Settings.UploadImages && !Settings.DownloadImages) return Properties.Image = `rbxassetid://${AssetId}`;
    if (AbortImageUpload) return;

    // Image Hashing
    if (Node.vectorPaths) { // hash vector, Flags.ExportVectorsAsImage should be true if we get here
        var CombinedVecPaths = "";

        Node.vectorPaths.forEach(vectorPath => CombinedVecPaths = CombinedVecPaths + vectorPath.data + vectorPath.windingRule);

        // Two vectors can share identical paths but be mirrored/rotated via their transform
        // (e.g. up/down arrows) — the flip is BAKED into the exported PNG, so it must be part
        // of the hash or both would dedupe into one upload and show the same orientation.
        if (Node.relativeTransform) {
            CombinedVecPaths += JSON.stringify([Node.relativeTransform[0].slice(0, 2), Node.relativeTransform[1].slice(0, 2)]);
        }

        Properties._ImageHash = createHash("sha256").update(CombinedVecPaths).digest("hex");
    }

    let ExportNode = Node;
    let NodeWasCloned = false;
    if (Node.fills && Node.fills[0]) {
        // A node with children gets them BAKED into the exported PNG, so the image fill's
        // own hash can't identify the result — panels sharing a background texture but with
        // different text/icons would collide into one upload and all show the same picture.
        if (!Properties._ImageHash && !(Node.children && Node.children.length)) Properties._ImageHash = Node.fills[0].imageHash;

        if (FullWhiteout) {
            NodeWasCloned = true;
            ExportNode = Node.clone();
            ExportNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        } else if (Node.fills[0].opacity < 1) {
            NodeWasCloned = true;
            ExportNode = Node.clone();
            const NewFills = JSON.parse(JSON.stringify(Node.fills));
            NewFills[0].opacity = 1
            ExportNode.fills = NewFills
        }
    }

    if (!Properties._ImageHash) {
        console.warn("Exporting Image with NO ImageHash!!")
    }

    if (Flags.IgnoreImageStrokeExport) {
        if (!NodeWasCloned) {
            NodeWasCloned = true;
            ExportNode = Node.clone();
        }
        if (ExportNode.strokes) ExportNode.strokes = [];
        Properties._ExportWithoutStroke = true;
    }

    // A node that keeps its children as real Roblox instances must not ALSO bake them
    // into its exported PNG (exportAsync renders the whole subtree) — text/icons showed
    // up twice: once inside the image and once as the native (fallback-font) element,
    // slightly offset. Intentional flattens (IMG tag → _FlattenImage) still bake children
    // and skip exporting them separately, so they are left untouched here.
    if (!Properties._FlattenImage && Node.children && Node.children.length) {
        if (!NodeWasCloned) {
            NodeWasCloned = true;
            ExportNode = Node.clone();
        }
        // iterate over a snapshot — removing mutates the children array
        Array.from(ExportNode.children).forEach((Child) => Child.remove());
    }

    // Pixel-exact image bounds: Figma pads the exported PNG to everything the node renders
    // (drop shadows, outside strokes, blur) — absoluteRenderBounds is that exact extent.
    // Record the per-side overhang (in Figma px) so main.js can grow the ImageLabel to
    // match the PNG instead of guessing a symmetric EffectRadius. Computed from ExportNode
    // so a stroke-stripped clone yields the (smaller) bounds of the PNG actually uploaded.
    // Rotated nodes keep the old symmetric fallback: their render bounds are the rotated
    // AABB and would double-count the rotation Roblox applies separately.
    if (!Node.rotation && ExportNode.absoluteBoundingBox && ExportNode.absoluteRenderBounds) {
        const BB = ExportNode.absoluteBoundingBox;
        const RB = ExportNode.absoluteRenderBounds;
        const Pad = {
            L: Math.max(0, BB.x - RB.x),
            T: Math.max(0, BB.y - RB.y),
            R: Math.max(0, (RB.x + RB.width) - (BB.x + BB.width)),
            B: Math.max(0, (RB.y + RB.height) - (BB.y + BB.height)),
        };
        if (Pad.L || Pad.T || Pad.R || Pad.B) Properties._RenderPad = Pad;
    }

    if (!FullWhiteout) {
        Properties._hasExport = true;

        if (!Flags.IgnoreImageStrokeExport) Properties.Children = [];
        else {
            Properties.Children = Properties.Children.filter(Child => Child.Class === "UIStroke");
        }
    }

    //

    function TryDownloadImage(RemoveCloneAfter) {
        ImagesRemaining += 1;
        ExportNode.exportAsync(CustomExport || Settings.DefaultExport).then(Bytes => {
            figma.ui.postMessage({
                type: "ExportImage",
                data: {
                    Data: Bytes,
                    Name: Properties.Name.substr(0, 30),
                    Format: (CustomExport ? CustomExport.format : "PNG").toLowerCase()
                }
            });
            ImagesRemaining -= 1;
            // Caller handed us clone cleanup (it returns right after starting this async export)
            if (RemoveCloneAfter && NodeWasCloned) ExportNode.remove();
        });
    }

    if (!Settings.UploadImages && Settings.DownloadImages) TryDownloadImage()

    //

    // Node.id as the last resort — it's UNIQUE, unlike layer names: "TabBG"/"Title" repeat
    // across panels, and a name-based id collapsed different images into one shared upload
    // (every panel then showed the same texture, or an unresolved {FTR_...} placeholder).
    let UploadId = OperationId || Properties._ImageHash || AssetId || Node.id;

    if (!UploadId || UploadId.length < 2) NotifyError(`Node "${Node.name}" {${Node.id}} has an invalid UploadId`, true);

    //

    if (!ForceReupload && !Flags.ForceUploadImages && Node.getPluginData("ImageHash") === Properties._ImageHash) {
        if (AssetId && AssetId.length > 5 && !AssetId.match(/TransparentWhiteImagePlaceholder.png/)) {
            // Check if image hashes match

            console.log("Image has not changed, using ImageId:", AssetId)
            Properties.Image = `rbxassetid://${AssetId}`
            // TryDownloadImage exports the clone ASYNCHRONOUSLY — removing it right away
            // would kill the node before exportAsync runs. Let the download own the cleanup.
            if (Settings.DownloadImages) TryDownloadImage(true);
            else if (NodeWasCloned) ExportNode.remove();
            return;
        }

        if (OperationId) {
            // try fetching before attempting to re-upload
            console.log("Image was uploaded, checking Operation (Id):", OperationId);

            Properties.Image = `{FTR_${OperationId}}`
            Node.setPluginData("ImageHash", Properties._ImageHash);

            ImageExports[OperationId] = {
                Node: Node,
                Properties: Properties,
                UploadId: OperationId
            }

            figma.ui.postMessage({
                type: "CheckOperation",
                data: {
                    Id: OperationId
                }
            });

            if (NodeWasCloned) ExportNode.remove();
            return OperationId
        }
    }

    if (!UploadId) {
        console.warn(`UploadId is undefned for node "${Node.name}" (${Node.id})! Generating a random number..`)

        while (!UploadId || ImageUploads.find((id) => id === UploadId)) {
            UploadId = Math.random() * 1024;
        }
    }

    //Properties.UploadId = UploadId;
    Properties.Image = `{FTR_${UploadId}}`

    let IncrementImageCount = true;

    if (ImageUploads.find((id) => id === UploadId)) {
        const OtherNode = ImageExports[UploadId].Node;

        if (OtherNode.width * OtherNode.height >= Node.width * Node.height) {
            // Duplicate image, existing copy is big enough — this clone is done for.
            // (Only remove it HERE: the overwrite path below still needs ExportNode for
            // exportAsync — removing it up-front crashed with "node ... does not exist".)
            if (NodeWasCloned) ExportNode.remove();
            return UploadId;
        }

        IncrementImageCount = false;
        console.warn(`[Image Export] Overwriting Node "${OtherNode.name}" with a larger version, "${Node.name}"`)
    }
    ImageUploads.push(UploadId);
    if (IncrementImageCount) ImagesRemaining += 1;
    if (Properties._ImageHash) Node.setPluginData("ImageHash", Properties._ImageHash);

    ImageExports[UploadId] = { // Used as a placeholder
        Node: Node,
        Properties: Properties,
        Bytes: undefined, // Uint8Array
        UploadId: UploadId
    }

    if (ImageUploadTimeoutId) clearTimeout(ImageUploadTimeoutId);

    ExportNode.exportAsync(CustomExport || Settings.DefaultExport).then(Bytes => {
        if (NodeWasCloned) ExportNode.remove();
        Node.setPluginData("AssetId", "");
        Node.setPluginData("OperationId", "");

        for (const [key, value] in ImageExports) {
            if (value.Bytes == Bytes) {
                UploadId = key
                Properties.Image = `{FTR_${key}}`
                ImagesRemaining -= 1;
                return;
            };
        }

        ImageExports[UploadId].Bytes = Bytes; // Uint8Array
        if (IncrementImageCount) ImageUploadsReady += 1;

        if (!Properties._ImageHash) {
            const _ImageHash = createHash("sha256").update(Bytes).digest("hex");

            if (_ImageHash) {
                Properties._ImageHash = _ImageHash;

                if (!ForceReupload && !Flags.ForceUploadImages) {
                    if (AssetId && Node.getPluginData("ImageHash") === _ImageHash) {
                        console.log(`[FTR][Export] (${UploadId}) Node exported image has not changed, reusing AssetId:`, AssetId)

                        figma.ui.postMessage({
                            type: "ExportImage",
                            data: {
                                Data: Bytes,
                                Name: Properties.Name.substr(0, 30),
                                Format: (CustomExport ? CustomExport.format : "PNG").toLowerCase()
                            }
                        });

                        Properties.Image = `rbxassetid://${AssetId}`
                        UpdateImage({id: UploadId, data: {assetId: AssetId}});
                        return;
                    } else if (AssetId) console.warn(`[FTR][Export] (${UploadId}) Node's image has changed, re-uploading`)

                    if (OperationId) {
                        // try fetching before attempting to re-upload

                        if (Node.getPluginData("ImageHash") === _ImageHash) {
                            console.log("Image was uploaded, checking Operation (Id):", OperationId);
                            Properties.Image = `{FTR_${OperationId}}`
                            Node.setPluginData("ImageHash", _ImageHash);

                            figma.ui.postMessage({
                                type: "CheckOperation",
                                data: {
                                    Id: OperationId
                                }
                            });

                            return OperationId
                        } else console.log("Operation exists but Hashes don't match, uploading..")
                    }
                }

                if (!FullWhiteout) {
                    Properties.Children = [];
                }

                Node.setPluginData("ImageHash", _ImageHash);
            } else {
                NotifyError(`FAILED to create an image hash for Node "${Node.name}" (${Node.id}), this means it might be reuploaded every time`)
                console.warn("FAILED to create an ImageHash for Node", Node, Properties);
            }
        }

        if (AbortImageUpload) return;

        // Test post image upload with template data
        if (Flags.ImageUploadTesting) UpdateImage({id: UploadId, data: Flags.ImageUploadTestData});
        // Upload Image
        else QueueImageUpload(Bytes, Properties.Name.substr(0, 30), (CustomExport ? CustomExport.format : "PNG").toLowerCase(), UploadId);
    });

    return UploadId
}

function UpdateImage(msg, abort) {
    if (abort) {
        AbortImageUpload = true;
        ImagesRemaining = 0;
        ImageUploadsReady = 0;
        return;
    }

    var ImageInfo = ImageExports[msg.id];

    if (!ImageInfo) {
        figma.notify(`Unable to find Image Node "${msg.id}" (check console for more info)`);
        console.warn(`Failed to find Image Node "${msg.id}":`, msg);
        ImagesRemaining -= 1;
        return;
    } else if (typeof(msg.data) === "string") {
        //ImageInfo.Node.setPluginData("OperationId", "");
        //figma.notify(`Failed to upload Image Node "${msg.id}": ${msg.data}`);
        console.warn(`Failed to upload Image Node "${msg.id}":`, msg);
        ImagesRemaining -= 1
        return;
    }

    // let ModerationResult = msg.data.moderationResult

    // if (Flags.AwaitModeration && ModerationResult && (ModerationResult.moderationState != "Approved" && ModerationResult.moderationState != "MODERATION_STATE_APPROVED")) {
    //     if (msg.co && Flags.ReuploadStuckImages) {
    //         ExportImage(ImageInfo.Node, ImageInfo.Properties, false)
    //         return;
    //     }else if (ModerationResult.moderationState === "Reviewing") {
    //         figma.notify(`Image Element ${msg.id} took too long to pass moderation, Image Id: ${msg.data.assetId || msg.data.path}`)
    //         console.warn(`Image Element ${msg.id} took too long to pass moderation:`, ModerationResult, msg);
    //     } else {
    //         figma.notify(`Image Element ${msg.id} failed moderation (check console for more info); moderation state: ${ModerationResult.moderationState}`);
    //         console.warn(`Image Element ${msg.id} failed moderation:`, ModerationResult, msg);
    //     }

    //     //ImagesRemaining -= 1; return;
    // }

    let Content = msg.data.imageContent || msg.data.assetId;

    if (ImageInfo.Properties._ReplacedBy) {
        ImageInfo.Properties = ImageInfo.Properties._ReplacedBy;
        //ImageInfo.Node = ImageInfo.Properties._OriginalNode; - DON'T REPLACE NODE
    }

    if (!Content.match(/TransparentWhiteImagePlaceholder.png/)) {
        console.log(`[FTR][Export] (${msg.id}) Applying AssetId "${Content}" to Node "${ImageInfo.Node.name}"`);

        ImageInfo.Node.setPluginData("AssetId", Content);

        if (!Content.match(/rbxasset/)) {
            Content = "rbxassetid://" + Content
        }

        ImageInfo.Properties.Image = Content
        console.log(`[FTR][Export] (${msg.id}) Node "${ImageInfo.Node.name}" -> Image="${ImageInfo.Properties.Image}", ImageTransparency=${ImageInfo.Properties.ImageTransparency}, BackgroundTransparency=${ImageInfo.Properties.BackgroundTransparency}`);
    } else {
        let PreviousAssetId = ImageInfo.Node.getPluginData("AssetId");

        if (PreviousAssetId && !PreviousAssetId.match(/rbxasset/)) {
            PreviousAssetId = "rbxassetid://" + PreviousAssetId;
        }

        console.warn(`[FTR][Export] (${msg.id}) Using placeholder image for Node "${ImageInfo.Node.name}" (upload failed or disabled). Falling back to: ${PreviousAssetId || Content}`);

        ImageInfo.Properties.Image = PreviousAssetId || Content;
    }

    ImagesRemaining -= 1;
}

function GetImageFromOperation(OperationId) {
    return ImageExports[OperationId]
}

function IsDone() {
    console.log("Checking IsDone, Images Remaning:", ImagesRemaining);
    if (ImagesRemaining <= 0) {
        ImageUploads.splice(0, ImageUploads.length);
        ImageUploadsReady = 0;
        return true
    }
    return false
}


function clamp(OldOffset, X, Y) {
    var NewOffset = {X: X, Y: Y};

    if (OldOffset) {
        if (OldOffset.X > X) NewOffset.X = OldOffset.X;
        if (OldOffset.Y > Y) NewOffset.Y = OldOffset.Y;
    }

    return NewOffset;
}

// Aggregate the largest bounds-growing effect radius across a node AND all of its
// descendants. When a node is flattened into a single exported image, its children
// are NOT converted individually, so a drop shadow living on a child (e.g. a checkbox
// inside a Group) never contributes to the parent's EffectRadius — the exported image
// then isn't padded for that shadow, so it renders at a different size than an
// equivalent ungrouped node whose shadow IS counted. Walking descendants here keeps
// grouped and ungrouped variants of the same graphic exporting at the same size.
// Mirrors the per-node `effects` handler: INNER_SHADOW/NOISE/BACKGROUND_BLUR don't grow
// bounds and are skipped; radius, |offset| and spread all count.
function GetDescendantEffectRadius(Node, Current) {
    var Radius = Current;

    if (Node.effects) {
        Node.effects.forEach(Effect => {
            if (Effect.visible === false) return;
            switch (Effect.type) {
                case "INNER_SHADOW":
                case "NOISE":
                case "BACKGROUND_BLUR":
                    return;
                default:
                    if (Effect.radius) Radius = clamp(Radius, Effect.radius, Effect.radius);
                    if (Effect.offset) Radius = clamp(Radius, Math.abs(Effect.offset.x), Math.abs(Effect.offset.y));
                    if (Effect.spread) Radius = clamp(Radius, Effect.spread, Effect.spread);
            }
        });
    }

    if (Node.children) {
        Node.children.forEach(Child => {
            Radius = GetDescendantEffectRadius(Child, Radius);
        });
    }

    return Radius;
}

const PropertyTypes = {// the only return value should be nothing or an object containing properties to update
    ["clipsContent"]: (Value, Object, Node) => {
        Object.ClipsDescendants = Value;
    },
    ["targetAspectRatio"]: (Value, Object, Node) => {
        if (!Value) return;
        Object._ApplyAspectRatio = true
    },
    ["fills"]: (Value, Object, Node) => {
        if (/*Value.length > 1 ||*/ Value == figma.mixed) {
            if (Node.type !== "TEXT") return;

            AppendUnsupportedAction("Frames can only support the following 'Fill' types: Solid Colour, Image, Linear Gradient - any other must be exproted as an image!", Node)
            return console.warn(`Frame ${Object.Name} cannot have more than 1 fill`);
        } else if (Value.length === 0 /*|| Object._hasExport*/) { // if the export is exported white, _hasExport should be false so we can recover the per-item colours:
            Object.BackgroundTransparency = 0;
            return;
        }

        // Figma paints the fills array bottom→top; Roblox renders ONE base paint plus an
        // optional UIGradient. Use the top-most SOLID/IMAGE fill as the base and layer a
        // linear gradient over it when present — dropping multi-fill nodes entirely (the
        // old behaviour) left them with Roblox's default grey background.
        const VisibleFills = Value.filter(f => f && f.visible !== false);
        if (VisibleFills.length === 0) {
            Object.BackgroundTransparency = 0;
            return;
        }

        // Figma paints fills bottom→top; Roblox has ONE base paint + optional UIGradient.
        //  - top-most IMAGE fill becomes the ImageLabel content;
        //  - top-most GRADIENT_LINEAR becomes a UIGradient;
        //  - SOLID fills are alpha-composited into a single colour below. Picking just the
        //    top-most solid was wrong: a 5-12% overlay wash would REPLACE the real fill,
        //    leaving bars 88% transparent and image badges 95% transparent.
        let ImageFill = null;
        let GradientFill = null;
        for (var i = VisibleFills.length - 1; i >= 0; i--) {
            if (!ImageFill && VisibleFills[i].type === "IMAGE") ImageFill = VisibleFills[i];
            if (!GradientFill && VisibleFills[i].type === "GRADIENT_LINEAR") GradientFill = VisibleFills[i];
        }
        const Fill = ImageFill || VisibleFills[VisibleFills.length - 1];

        /*
            0: Black Fill                       BackgroundColor3 = Black; Transparency = 0
            1: Image 50% Transparency           Image = Image; ImageTransparency = 0.5
            2: Purple Fill 20% transparency      ImageColor3 = Purple (hue at 80%?)
        */

        //Object.Visible = Node.type === "GROUP" ? true : Fill.visible; // ensure a boolean, and always enable groups
        //Object.Visible = Fill.visible !== false; // ensure a boolean - REMOVED as a better way would be to set the opacity to 0

        // if (!Settings.UploadImages) {
        //     Properties.BackgroundTransparency = Properties.ImageTransparency || 0;
        //     if (Properties.ImageColor3) Properties.BackgroundColor3 = Properties.ImageColor3;
        //     return;
        // };

        if (Fill.type === "IMAGE" && /\|frame/i.test(Node.name)) {
            // Node is force-tagged |FRAME — don't rasterise/upload the image fill,
            // keep it a plain Frame. Avoids a wasted Open Cloud upload + orphan Image props.
            Object.BackgroundTransparency = 0;
            return;
        }

        if (Fill.type === "IMAGE" && (Settings.UploadImages || Flags.AlwaysExportImages)) {
            // Export image
            // Children get baked into the exported PNG, so the fill's own hash only
            // identifies the result for leaf nodes (see the matching guard in ExportImage).
            if (!(Node.children && Node.children.length)) Object._ImageHash = Fill.imageHash;
            Object.Class = "ImageLabel"; // or ImageButton?!
            Object.ImageColor3 = {R: 1, G: 1, B: 1};

            // Images can't have backgrounds from what I can tell (in figma), unless image uploading is disabled, but exporting is enabled
            if (!Settings.UploadImages) Object.BackgroundTransparency = 0;

            ExportImage(Node, Object);
        }

        if (GradientFill) ConvertFill(GradientFill, Object);

        var Color3, Transparency;
        if (ImageFill) {
            // Image content carries the visuals — its own opacity drives ImageTransparency.
            [Color3, Transparency] = ConvertFill(ImageFill, Object);
        } else {
            // Alpha-composite the paint stack (bottom→top) into one colour + opacity.
            // The gradient slot contributes WHITE (its colours live in the UIGradient,
            // which multiplies the base colour at render time).
            var Composite = null;
            var Alpha = 0;
            VisibleFills.forEach((F) => {
                var C = null;
                var A = typeof(F.opacity) === "number" && !isNaN(F.opacity) ? F.opacity : 1;
                if (F.type === "SOLID") C = { R: F.color.r, G: F.color.g, B: F.color.b };
                else if (F === GradientFill) C = { R: 1, G: 1, B: 1 };
                else return; // unsupported paint type — skip it
                if (A <= 0) return;

                if (!Composite) {
                    Composite = C;
                    Alpha = A;
                } else {
                    Composite = {
                        R: Composite.R + (C.R - Composite.R) * A,
                        G: Composite.G + (C.G - Composite.G) * A,
                        B: Composite.B + (C.B - Composite.B) * A,
                    };
                    Alpha = Alpha + A * (1 - Alpha);
                }
            });

            Color3 = Composite || { R: 1, G: 1, B: 1 };
            Transparency = Alpha; // opacity, same convention as ConvertFill's return value
        }

        if (Object.Class === "TextLabel" || Object.Class === "TextButton") {
            Object.TextColor3 = Color3;
            Object.TextTransparency = Transparency; // we do TextTransparency * _Transparency in main.js - ConvertObject()
            if (Object.Class === "TextLabel") Object.BackgroundTransparency = 0;
        } else if (Object.Class === "ImageLabel" || Object.Class === "ImageButton") {
            Object.ImageColor3 = Color3;
            Object.ImageTransparency = Transparency; // we do TextTransparency * _Transparency in main.js - ConvertObject()
            if (Object.Class === "ImageLabel") Object.BackgroundTransparency = 0;
        } else {
            Object.BackgroundColor3 = Color3;
            Object.BackgroundTransparency = Transparency;
        }
    },
    ["cornerRadius"]: (Value, Object, Node) => {
        if (Object._hasExport || Value === 0) return;

        const CornerRadius = {
            Class: "UICorner",
            Type: "UICorner",
        }

        // Roblox UICorner Scale semantics: radius = Scale * min(width, height), so Scale 0.5
        // is fully rounded. Convert px -> scale by dividing by the FULL shortest dimension;
        // the halved value is only the clamp limit (max visually possible radius in px).
        const ShortestDimension = Node.width < Node.height ? Node.width : Node.height;
        const ShortestDimensionHalved = ShortestDimension / 2;
        if (Value == figma.mixed) {
            const PropertyNames = [
                "TopLeftRadius",
                "TopRightRadius",
                "BottomLeftRadius",
                "BottomRightRadius",
            ]
            let CheckIsSizeClamped = true;

            PropertyNames.forEach(Name => {
                const OffsetValue = Node[Name.charAt(0).toLowerCase() + Name.substring(1)];

                if (CheckIsSizeClamped && OffsetValue > ShortestDimensionHalved) {
                    CheckIsSizeClamped = false;
                    AppendUnsupportedAction(`CornerRadius is larger than the Frame's shortest dimension divided by two, got ${OffsetValue}px for ${Name}, max: ${ShortestDimensionHalved}px! Roblox will clamp this.`, Node)
                }

                CornerRadius[Name] = {
                    S: Flags.ConvertCornerRadiusToScale ? OffsetValue / ShortestDimension : 0,
                    O: Flags.ConvertCornerRadiusToScale ? 0 : OffsetValue,
                };
            })


            CornerRadius
        } else {
            CornerRadius.CornerRadius = {
                S: Flags.ConvertCornerRadiusToScale ? Value / ShortestDimension : 0,
                O: Flags.ConvertCornerRadiusToScale ? 0 : Value,
            };
        }

        Object.Children.forEach((Stroke) => {
            if (Stroke.Class === "UIStroke") Stroke.LineJoinMode = Conversions.LineJoinModes.indexOf("ROUND");
        })

        Object._HasCorners = true;
        Object.Children.push(CornerRadius);
    },
    ["effects"]: (Value, Object, Node) => {
        Value.forEach(Effect => {
            switch (Effect.type) {
                case "INNER_SHADOW":
                case "NOISE":
                case "BACKGROUND_BLUR":
                    break;
                default:
                    if (Effect.radius) {
                        Object.EffectRadius = clamp(Object.EffectRadius, Effect.radius, Effect.radius);
                    }
                    if (Effect.offset) {
                        Object.EffectRadius = clamp(Object.EffectRadius, Effect.offset.x, Effect.offset.y);
                    }
                    if (Effect.spread) {
                        Object.EffectRadius = clamp(Object.EffectRadius, Effect.spread, Effect.spread);
                    }

                    // Don't rasterise TEXT into an image just because it has an effect (e.g. a drop
                    // shadow) — that turns editable text into a flat image. Keep text as a TextLabel
                    // (the shadow is dropped; Roblox text can't render a Figma drop shadow natively).
                    const IsText = Object.Class === "TextLabel" || Object.Class === "TextButton";
                    if (Object.Class !== "ImageLabel" && !IsText && Settings.UploadEffects) {
                        // Export as image
                        Object.Class = "ImageLabel"; // or ImageButton?!
                        Object.ImageColor3 = {R: 1, G: 1, B: 1};
                        Object._hasExport = true
                        //Object.BackgroundTransparency = 0; // Images can't have backgrounds from what I can tell (in figma)

                        ExportImage(Node, Object, null, null)
                    }
                    break;
                }
        })
    },
    ["strokes"]: (Value, Object, Node) => {
        // Figma can stack several strokes on one node, but they share the same weight/position and
        // so overlap completely — the top-most visible one is what's actually seen. Roblox renders a
        // single outline (UIStroke), so use that top stroke instead of dropping all of them (which
        // also spammed a "max 1 stroke" warning per node).
        const visibleStrokes = Value.filter(s => s.visible !== false);
        if (visibleStrokes.length === 0 || (Object._ExportAsImage && !Object._ExportWithoutStroke)) {
            return;
        } else if (Node.strokeWeight == figma.mixed) {
            AppendUnsupportedAction("Strokes can only be applied to ALL SIDES!", Node)
            return;
        }

        const Stroke = visibleStrokes[visibleStrokes.length - 1]

        // Roblox miter joins on glyph outlines produce heavy spikes that Figma's text
        // rendering doesn't show — bevel matches the Figma look much better (verified
        // against the design). Frames keep their authored join; rounded corners force ROUND.
        const IsTextStroke = Object.Class === "TextLabel" || Object.Class === "TextButton";
        let JoinName = Object._HasCorners ? "ROUND" : Node.strokeJoin;
        if (IsTextStroke && JoinName === "MITER") JoinName = "BEVEL";
        let JoinIndex = Conversions.LineJoinModes.indexOf(JoinName);
        if (JoinIndex < 0) JoinIndex = Conversions.LineJoinModes.indexOf("BEVEL"); // figma.mixed / unknown

        var StrokeObject = {
            Class: "UIStroke",
            Name: "UIStroke",
            ApplyStrokeMode: Conversions.ApplyStrokeMode.indexOf(Object.Class === "TextLabel" ? "Contextual" : "Border"),
            BorderStrokePosition: Conversions.BorderStrokePosition.indexOf(Node.strokeAlign),
            // Color: {
            //     R: Stroke.color.r,
            //     G: Stroke.color.g,
            //     B: Stroke.color.b
            // },
            Color: {
                R: 1,
                G: 0,
                B: 1
            },
            LineJoinMode: JoinIndex,
            Thickness: Node.strokeWeight,
            Transparency: Stroke.opacity,
            _Transparency: Object._Transparency,

            Children: [],
        }

        var [Colour, Transparency] = ConvertFill(Stroke, StrokeObject);

        StrokeObject.Color = Colour;
        StrokeObject.Transparency *= Transparency;

        if (Object._IsLine) {
            Object.BackgroundColor3 = Colour;
            Object.BackgroundTransparency = Transparency;
            Object.Size.YO = Node.strokeWeight;
        } else {
            //Object._HasStroke = true;
            Object.Children.push(StrokeObject);
        }

        const Alignment = Node.strokeAlign; // INSIDE, OUTSIDE, CENTER
        const Weight = Node.strokeWeight * (Alignment === "INSIDE" ? 0 : Alignment === "CENTER" ? 0.5 : 1);

        if (Weight > 0) {
            if (Object.EffectRadius) {
                Object.EffectRadius.X += Weight;
                Object.EffectRadius.Y += Weight;
            } else Object.EffectRadius = {X: Weight, Y: Weight}
        }
    },
    ["characters"]: (Value, Object, Node) => {
        var Segments = Node.getStyledTextSegments(["fills", "fontSize", "fontWeight", "textDecoration", "textCase"]);
        var Text = "";

        if (Segments.length > 1) {
            const TextCase = Node.textCase

            Segments.forEach(Segment => {
                if (Segment.characters.replace(/[ \t\n]+/) == "") {
                    Text += Segment.characters
                    return;
                }

                var NewText = ""

                if (Segment.fills && Segment.fills.length !== 0) {
                    // TODO: Implement use of new funtion ConvertFill(Fill, Object?)
                    // ^ no, only SOLID colours can be supported with richtext
                    const Colour = {R: 1, G: 1, B: 1, A: 1}; // get the latest (a combination of all would be good)

                    if (Segment.fills[0].type !== "SOLID") console.warn(`Unsupported rich text base fill type "${Fill.type}" on text Node`, Node, "text segment:", Segment)

                    /*const MainFillColour = Segment.fills[0].color

                    console.log(MainFillColour);

                    Colour.R = MainFillColour.r
                    Colour.G = MainFillColour.g
                    Colour.B = MainFillColour.b

                    {
                        Segment.fills.forEach(Fill => {
                            if (Fill.type !== "SOLID") return console.warn(`Unsupported rich text fill type "${Fill.type}" on text Node`, Node, "text segment:", Segment);

                            console.log(Fill);

                            Colour.R *= Fill.color.r
                            Colour.G *= Fill.color.g
                            Colour.B *= Fill.color.b
                        })
                    }*/

                    Segment.fills.forEach(Fill => {
                        if (Fill.type !== "SOLID") return console.warn(`Unsupported rich text fill type "${Fill.type}" on text Node`, Node, "text segment:", Segment);

                        Colour.R *= Fill.color.r
                        Colour.G *= Fill.color.g
                        Colour.B *= Fill.color.b
                        Colour.A *= Fill.opacity
                    });

                    NewText += ` color="rgb(${Round(Colour.R * 255, 1) + "," + Round(Colour.G * 255, 1) + "," + Round(Colour.B * 255, 1)})"`

                    if (Colour.A !== 1) NewText += ` transparency="${Round(1 - Colour.A, 4)}"`
                };

                if (Object.TextSize == undefined || Segment.fontSize !== Object.TextSize) {
                    NewText += ` size="${Round(Segment.fontSize * Flags.TextSizeAdjustment, 1)}"`;
                };

                if (Object.FontFace && Segment.fontWeight !== Object.FontFace.Weight) {
                    NewText += ` weight="${Segment.fontWeight}"`;
                };

                var Characters = Segment.characters;

                if (TextCase) {
                    switch (TextCase) {
                        case "UPPER":
                            Characters = Characters.toUpperCase();
                            break;
                        case "LOWER":
                            Characters = Characters.toLowerCase();
                            break;
                        case "TITLE":
                            Characters = Characters.replace(/\w\S*/g, function(Text) {
                                return Text.charAt(0).toUpperCase() + Text.substr(1).toLowerCase();
                            })

                            break;
                        case "ORIGINAL":
                        default:
                            break;
                    }
                }

                // We only want to add font tags if we have new data to add
                if (NewText.replace(/\s+/g).length > 0) Text += `<font${NewText}>${Characters}</font>`
                else Text += Characters;
            })

            Object.RichText = true;
            Object.Text = Text //StringToUTF8(Text);
        } //else Object.Text = StringToUTF8(Object.Text);

        //Object.Text = StringToUTF8(Value);
    },
    ["textDecoration"]: (Value, Object) => {
        if (Value === "UNDERLINE") Object.Text = `<u>${Object.Text}</u>`;
        else if (Value === "STRIKETHROUGH") Object.Text = `<s>${Object.Text}</s>`;
    },
    ["paddingLeft"]: (Value, Object, Node) => {
        if (Value === 0 || Node.layoutMode === "NONE" || !Flags.ApplyPadding) return;

        Object.Position.XO += Value;
        Object.Size.XO -= Value;
    },
    ["paddingRight"]: (Value, Object, Node) => {
        if (Value === 0 || Node.layoutMode === "NONE" || !Flags.ApplyPadding) return;

        Object.Size.XO -= Value;
    },
    ["paddingTop"]: (Value, Object, Node) => {
        if (Value === 0 || Node.layoutMode === "NONE" || !Flags.ApplyPadding) return;

        Object.Position.YO += Value;
        Object.Size.YO -= Value;
    },
    ["paddingBottom"]: (Value, Object, Node) => {
        if (Value === 0 || Node.layoutMode === "NONE" || !Flags.ApplyPadding) return;

        Object.Size.YO -= Value;
    },
    ["layoutMode"]: (Value, Object, Node) => {
        /*
            TODO: Support reverse ZIndex
        */

        if (Value === "NONE" || !Flags.ConvertAutoLayoutsToScrollFrames) return;

        const FillDirection = Conversions.FillDirection.indexOf(Value);
        const IsHorizontal = FillDirection === 0;

        // Get Alignment, Padding and Size Offset

        const HorizontalAlignment = IsHorizontal ? Node.primaryAxisAlignItems : Node.counterAxisAlignItems || 0;
        const VerticalAlignment = !IsHorizontal ? Node.primaryAxisAlignItems : Node.counterAxisAlignItems || 0;

        const HorizontalCellPadding = IsHorizontal ? (Node.itemSpacing || Node.gridColumnGap) : (Node.counterAxisSpacing || Node.gridRowGap) || 0;
        const VerticalCellPadding = !IsHorizontal ? (Node.itemSpacing || Node.gridRowGap) : (Node.counterAxisSpacing || Node.gridColumnGap) || 0;

        const HorizontalCellSize = Node.children[0] ? Node.children[0].width : 100;
        const VerticalCellSize = Node.children[0] ? Node.children[0].height : 100;

        //console.print(`Vertical Cell Padding has ${IsHorizontal ? "Horizontal, " : "Vertical, "} padding (X,Y in px): ${HorizontalCellPadding}, ${VerticalCellPadding} Dominant Axis Padding: ${IsHorizontal ? HorizontalCellPadding : VerticalCellPadding}`)

        if (Value !== "GRID" && Node.layoutWrap !== "WRAP") {
            // List Layout

            Object.Children.push({
                Class: "UIListLayout",
                Name: "UIListLayout",
                Padding: {S: 0, O: IsHorizontal ? HorizontalCellPadding : VerticalCellPadding},
                FillDirection: FillDirection,
                SortOrder: 2,
                Wraps: false, // both can be true in roblox, but not in Figma to my knowledge (only vertical wrap)

                HorizontalAlignment: Conversions.HorizontalAlignment.indexOf(HorizontalAlignment),
                VerticalAlignment: Conversions.VerticalAlignment.indexOf(VerticalAlignment),
            })

            if (!Object.Name.match("scrl")) {
                Object.Name += "scrl"
            }

            return;
        }

        // Cell Layout

        const CellPadding = {
            XS: 0,
            XO: HorizontalCellPadding,
            YS: 0,
            YO: VerticalCellPadding || Node.gridRowGap,
        }

        const CellSize = {
            XS: 0,
            XO: HorizontalCellSize,
            YS: 0,
            YO: VerticalCellSize,
        }

        // if (Flags.ConvertOffsetToScale) {
        //     // now that I think about it doesn't really serve much use in a grid, but good for Rows?
        //     const SX = Object.Size.XO;
        //     const SY = Object.Size.YO;

        //     CellPadding.XS = CellPadding.XO / SX;
        //     CellPadding.YS = CellPadding.YO / SY;
        //     CellSize.XS = CellSize.XO / SX;
        //     CellSize.YS = CellSize.YO / SY;

        //     CellPadding.XO = 0;
        //     CellPadding.YO = 0;
        //     CellSize.XO = 0;
        //     CellSize.YO = 0;
        // }

        // TODO: Finish support for UIListLayout (padding not working)

        Object.Children.push({
            Class: "UIGridLayout",
            Name: "UIGridLayout",
            CellPadding: CellPadding,
            CellSize: CellSize,
            FillDirection: FillDirection,
            SortOrder: 0,

            HorizontalAlignment: Conversions.HorizontalAlignment.indexOf(HorizontalAlignment),
            VerticalAlignment: Conversions.VerticalAlignment.indexOf(VerticalAlignment),
        })
    }
}

// function CalculateAngle(P0, P1, P2) { // https://stackoverflow.com/a/39673693
//     var Numerator = P1.x * (P0.x - P2.x) + P0.y * (P2.x - P1.x) + P2.y * (P1.x - P0.x);
//     var Denominator = (P1.x - P0.x) * (P0.x - P2.x) + (P1.y - P0.y) * (P0.y - P2.y);

//     console.log("Number, Denom:", Numerator, Denominator)

//     // Calculate angle in radians and convert it to degrees
//     var AngleDeg = (Math.atan(Numerator / Denominator) * 180) / Math.PI;

//     return AngleDeg < 0 ? AngleDeg + 180 : AngleDeg;
// }

// function CalculateAngle(P0, P1, P2) { // https://stackoverflow.com/a/17763495 // https://phrogz.net/angle-between-three-points
//     var a = Math.sqrt(Math.pow(P1.x - P0.x, 2) + Math.pow(P1.Y - P0.Y, 2));
//     var b = Math.sqrt(Math.pow(P1.X - P2.X, 2) + Math.pow(P1.Y - P2.Y, 2));
//     var c = Math.sqrt(Math.pow(P2.X - P0.X, 2) + Math.pow(P2.Y - P0.Y, 2));

//     return Math.acos((b * b + a * a - c * c) / (2 * b * a));
// }

const NodeTypes = { // Is this really needed? I could probably make it less repetative
    ["GROUP"]: (Node) => {
        let Properties = {
            Class: "Frame",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 0,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        return Properties
    },
    ["FRAME"]: (Node) => {
        let Properties = {
            Class: "Frame",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 1,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            ClipsDescendants: Node.clipsContent,
            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        return Properties
    },
    ["COMPONENT"]: (Node) => {
        let Properties = {
            Class: "Frame",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 1,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        return Properties
    },
    ["INSTANCE"]: (Node) => {
        let Properties = {
            Class: "Frame",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 0,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        return Properties
    },
    ["LINE"]: (Node) => { // TODO: Better support
        let Properties = {
            Class: "Frame",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: Node.opacity,
            _Transparency: Node.opacity,
            _IsLine: true,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        return Properties
    },
    ["RECTANGLE"]: (Node) => {
        let Properties = {
            Class: "Frame",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: Node.opacity,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        return Properties;
    },
    ["ELLIPSE"]: (Node) => {
        // Note: Only supports circles (ellipses would have to be images)

        let Size = Math.min(Node.width, Node.height); // Will get the smallest of the two (no need to check if they are the same)

        return {
            Class: "Frame",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: Node.opacity,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x + (Node.width - Size) / 2,
                YS: 0,
                YO: Node.y + (Node.height - Size) / 2
            },
            Size: {
                XS: 0,
                XO: Size,
                YS: 0,
                YO: Size
            },

            _HasCorners: true,
            Children: [
                {
                    Class: "UICorner",
                    Name: "UICorner",
                    CornerRadius: {
                        S: 1,
                        O: 0,
                    }
                },
                {
                    Class: "UIAspectRatioConstraint",
                    AspectRatio: 1,
                    AspectType: 0,
                    DominantAxis: 0
                }
            ],
            Node: Node,
        }
    },
    ["TEXT"]: (Node) => {
        // fontName is figma.mixed when the node stacks several fonts/styles; fall back to a plain
        // Regular weight for the node-level FontFace (per-segment weights are still emitted as
        // RichText <font weight=…> tags by the "characters" handler).
        const StyleName = Node.fontName !== figma.mixed ? Node.fontName.style : "Regular";
        const FontStyle = Conversions.FontStyle[StyleName];
        const FamilyName = Node.fontName !== figma.mixed ? Node.fontName.family : "Inter";

        // Resolve the font family to a Roblox source, in priority order:
        //   1. a user-defined Fonts-panel mapping (family -> asset id) — lets the user force any
        //      Creator-Store font that isn't in the built-in tables (e.g. Jockey One);
        //   2. a built-in Marketplace font id (Conversions.MarketplaceFonts);
        //   3. a Roblox built-in family file (rbxasset://fonts/families/<File>.json).
        const CustomFonts = Settings.CustomFonts || {};
        const CustomKey = CustomFonts[FamilyName] !== undefined
            ? FamilyName
            : Object.keys(CustomFonts).find(k => k.toLowerCase() === FamilyName.toLowerCase());
        // Accept a bare id or a full rbxassetid:// URL from the user — keep only the digits.
        const CustomId = CustomKey ? String(CustomFonts[CustomKey]).replace(/\D/g, "") : "";

        const MarketId = CustomId || Conversions.MarketplaceFonts[FamilyName];
        let FontFamilyUrl;
        if (MarketId) {
            FontFamilyUrl = `<url>rbxassetid://${MarketId}</url>`;
        } else {
            const norm = FamilyName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const KnownFile = Conversions.RobloxLocalFonts[norm];
            const file = KnownFile || FamilyName.replace(/[^a-zA-Z0-9]/g, "");
            FontFamilyUrl = `<url>rbxasset://fonts/families/${file}.json</url>`;

            // Neither a mapped Marketplace font nor a recognised Roblox built-in family: the
            // rbxasset path is a best guess, and if Roblox doesn't ship this family it silently
            // falls back to the default. Flag it so the user can upload the font and map it in
            // MarketplaceFonts (by asset id) to guarantee the exact typeface.
            // No node is passed on purpose: this is a font-wide issue, not a per-node one, so the
            // design-issues dialog collapses it to a single line per font (with an ×N count) instead
            // of repeating it for every text node using that font.
            if (!KnownFile) {
                AppendUnsupportedAction(`Font "${FamilyName}" isn't available in Roblox (not a Creator-Store mapping nor a built-in family) — text will fall back to the default typeface. Map its asset id in the Fonts panel, or use a built-in font.`)
            }
        }

        let Properties = {
            Class: "TextLabel",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 0.0,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            Text: Node.characters,
            TextSize: Node.fontSize !== figma.mixed ? Node.fontSize : 24,
            // Figma's textAlignHorizontal can be JUSTIFIED (no Roblox equivalent) and indexOf can
            // return -1; clamp to 0 (Left/Top) so we never emit an invalid enum token.
            TextXAlignment: Math.max(0, Conversions.TextXAlignments.indexOf(Node.textAlignHorizontal)),
            TextYAlignment: Math.max(0, Conversions.TextYAlignments.indexOf(Node.textAlignVertical)),
            // Wrap only when the text is genuinely multi-line (explicit newlines, or a Figma
            // fixed-width auto-height box). Single-line labels stay on one line and shrink to fit.
            TextWrapped: /[\n\r]/.test(Node.characters || "") || Node.textAutoResize === "HEIGHT",
            // Never cut text — it scales down to fit the box instead (see UITextSizeConstraint below).
            // The old mapping also produced the wrong enum (Figma "ENDING" -> SplitWord).
            TextTruncate: 0,

            FontFace: {
                Family: FontFamilyUrl,
                Weight: FontStyle ? FontStyle.Weight: 400,
                Style: FontStyle ? FontStyle.Style: "Normal"
            },

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        if (Node.textCase) {
            switch (Node.textCase) {
                case "UPPER":
                    Properties.Text = Properties.Text.toUpperCase();
                    break;
                case "LOWER":
                    Properties.Text = Properties.Text.toLowerCase();
                    break;
                case "TITLE":
                    Properties.Text = Properties.Text.replace(/\w\S*/g, function(Text) {
                        return Text.charAt(0).toUpperCase() + Text.substr(1).toLowerCase();
                    })

                    break;
                case "ORIGINAL":
                    break;
            }
        }

        // Fit-to-box text: Roblox's fonts (especially the fallback when the design font isn't
        // available) are usually wider than Figma's, so fixed-size text overflows and gets clipped
        // or truncated. TextScaled makes the text shrink to fit its box, and the UITextSizeConstraint
        // caps it at the Figma font size so it never grows larger than designed. Net result: text
        // renders at its intended size when it fits, and shrinks just enough to stay fully visible
        // when the substitute font is wider — instead of being cut off.
        const fontSize = Math.max(1, Math.round(Node.fontSize !== figma.mixed ? Node.fontSize : 24));
        Properties.TextScaled = true;

        if (!Properties.TextWrapped && Node.fontSize !== figma.mixed) {
            // Single-line labels: shrink the box to exactly one text line and let TextScaled
            // fill it. The box converts to Scale like every other element, so the rendered
            // text size tracks the screen size at ANY resolution — a UITextSizeConstraint cap
            // in fixed Figma px is only correct at the design's own resolution (it let short
            // labels render larger than designed and starved text on bigger screens).
            // TextSizeAdjustment compensates Roblox vs Figma font-metric differences.
            const LineHeight = Node.fontSize * Flags.TextSizeAdjustment;
            const Delta = Properties.Size.YO - LineHeight;
            if (Delta > 0) {
                const Align = Node.textAlignVertical;
                Properties.Position.YO += Align === "BOTTOM" ? Delta : Align === "TOP" ? 0 : Delta / 2;
                Properties.Size.YO = LineHeight;
            }
        } else {
            // Wrapped / multi-line text keeps the fixed-px cap so it can't outgrow the design.
            Properties.Children.push({
                Class: "UITextSizeConstraint",
                Name: "UITextSizeConstraint",
                MaxTextSize: fontSize,
                MinTextSize: 1,
            });
        }

        return Properties;
    },
    ["VECTOR"]: (Node, Settings) => {
        // Calculate how many rectangles fit into the area

        if (Flags.ExportVectorsAsImage) {
            let Properties = {
                Class: "ImageLabel",
                Name: Node.name,
                Active: true,
                Visible: Node.visible,
                BackgroundTransparency: 0.0,
                ImageTransparency: Node.opacity,
                ImageColor3: {R: 1, G: 1, B: 1},
                _Transparency: Node.opacity,
                BorderSizePixel: 0,

                Rotation: -Node.rotation,
                ZIndex: 1,

                AnchorPoint: {
                    X: 0,
                    Y: 0,
                },
                Position: {
                    XS: 0,
                    XO: Node.x,
                    YS: 0,
                    YO: Node.y
                },
                Size: {
                    XS: 0,
                    XO: Node.width,
                    YS: 0,
                    YO: Node.height
                },

                Children: [],
                Node: Node,
            }

            ExportImage(Node, Properties);
            return Properties;
        } else if (!Flags.ExportVectors) {
            return;
        }

        console.warn("Exporting Vectors as non-images is not supported")
        return;
        /*const VectorNetwork = Node.vectorNetwork;
        const Vertices = VectorNetwork.vertices;

        var Checked = {};

        console.log("Exporting Vector")

        for (var i = 0; i < Vertices.length; i++) {
            for (var i2 = 0; i2 < Vertices.length; i2++) {
                if (i == i2) continue;

                for (var i3 = 0; i3 < Vertices.length; i3++) {
                    if (i == i3 || i2 == i3) continue;

                    var Angle = CalculateAngle(Vertices[i], Vertices[i2], Vertices[i3]);

                    console.log(`verts ${i}, ${i2}, ${i3} angle: ${Angle}`)

                    if (Angle < 90) {
                        console.warn("Cannot convert acute angle to quad", Angle, i, i2, i3);
                    } else if (Angle == 90) {
                        console.log("triangle?", Angle, i, i2, i3);
                    }
                }
            }
        }

        return {
            Class: "N/A",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 0.0,
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }*/
    },
    /*["BOOLEAN_OPERATION"]: (Node, Settings) => { // Basically emulating a group
        if (Node.booleanOperation !== "UNION") {
            // TODO: Upload & Export as Image
            figma.notify("Only \"UNION\" Boolean operations can somehwat be converted") // ", exporting as image.."
            return;
        }

        // figma.notify("Booleans may not look the same in Roblox", {
        //     timeout: 2000,
        //     button: {
        //         text: "Goto Boolean",
        //         action: () => {
        //             figma.currentPage.selection = [Node];
        //         }
        //     }
        // })

        const Properties = {
            Class: "ImageLabel",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 0.0,
            ImageTransparency: Node.opacity,
            ImageColor3: {R: 1, G: 1, B: 1},
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        ExportImage(Node, Properties);
        return Properties
    },*/
    ["OTHER"]: (Node) => {
        console.warn("Unknwon type:", Node.type)

        const Properties = {
            Class: "ImageLabel",
            Name: Node.name,
            Active: true,
            Visible: Node.visible,
            BackgroundTransparency: 0.0,
            ImageTransparency: Node.opacity,
            ImageColor3: {R: 1, G: 1, B: 1},
            _Transparency: Node.opacity,
            BorderSizePixel: 0,

            Rotation: -Node.rotation,
            ZIndex: 1,

            AnchorPoint: {
                X: 0,
                Y: 0,
            },
            Position: {
                XS: 0,
                XO: Node.x,
                YS: 0,
                YO: Node.y
            },
            Size: {
                XS: 0,
                XO: Node.width,
                YS: 0,
                YO: Node.height
            },

            Children: [],
            Node: Node,
        }

        ExportImage(Node, Properties);
        return Properties;
    }
}

function Round(Number, To) {
    return Math.round(Number * To) / To
}

function LoopTable(TObject) {
    let Xml = "";

    for (const [Key, Value] of Object.entries(TObject)) {
        if (Value === figma.mixed) Xml += `<${Key}>0</${Key}>`; // ignore symbols, default to 0
        else if (Key === "XO" || Key === "YO") Xml += `<${Key}>${Round(Value, 1)}</${Key}>`; // UDim(2) Offset is an int
        else if (Key === "XS" || Key === "YS" || Key === "X" || Key === "Y") Xml += `<${Key}>${Round(Value, 10000000)}</${Key}>`; // UDim(2) Scale & Vector2 is an float
        else if (typeof(Value) === "number") Xml += `<${Key}>${Round(Value, 1000)}</${Key}>`;
        else Xml += `<${Key}>${Value}</${Key}>`;
    }

    return Xml;
}

function Clamp01(Value) {
    if (typeof(Value) !== "number" || isNaN(Value)) return 0;
    return Math.max(0, Math.min(1, Value));
}

function NormaliseColorSequence(Stops) {
    const CleanStops = Stops
        .filter(Stop => Stop && Stop.Colour)
        .map(Stop => ({
            TimePosition: Clamp01(Stop.TimePosition),
            Colour: {
                R: Clamp01(Stop.Colour.R),
                G: Clamp01(Stop.Colour.G),
                B: Clamp01(Stop.Colour.B),
            }
        }))
        .sort((A, B) => A.TimePosition - B.TimePosition);

    if (!CleanStops.length) return [];

    if (CleanStops[0].TimePosition !== 0) {
        CleanStops.unshift({
            TimePosition: 0,
            Colour: CleanStops[0].Colour
        });
    }

    const LastStop = CleanStops[CleanStops.length - 1];
    if (LastStop.TimePosition !== 1) {
        CleanStops.push({
            TimePosition: 1,
            Colour: LastStop.Colour
        });
    }

    return CleanStops;
}

function EncodeStr(String) {
    const T = {
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
    }

    return String.replace(/[<>"]/g, (c) => {
        return T[c];
    })
}

// Slightly modified from https://www.basedash.com/blog/javascript-string-to-bytes#:~:text=UTF%2D8%20TO%20BYTES%20MANUALLY
function StringToUTF8(String) {
    var NewString = "";

    for (let i = 0; i < String.length; i++) {
        let CodePoint = String.codePointAt(i);

        if (!CodePoint) continue
        else if (CodePoint == 8232) NewString += "\n";
        else if (CodePoint < 0x80) {
            if (CodePoint == 10) NewString += "\n";
            else NewString += String.charAt(i);
        } else if (CodePoint < 0x800) {
            NewString += `&#${0xc0 | (CodePoint >> 6)};&#${0x80 | (CodePoint & 0x3f)};`;
        } else if (CodePoint < 0x10000) {
            NewString += `&#${0xe0 | (CodePoint >> 12)};&#${0x80 | ((CodePoint >> 6) & 0x3f)};&#${0x80 | (CodePoint & 0x3f)};`;
        } else {
            NewString += `&#${0xe0 | (CodePoint >> 18)};&#${0x80| ((CodePoint >> 12) & 0x3f)};&#${0x80 | ((CodePoint >> 6) & 0x3f)};&#${0x80 | (CodePoint & 0x3f)};`;
        }
    }

    return NewString
}

const XMLTypes = {
    ["token"]: (Name, Value) => {
        return `<token name="${Name}">${Value}</token>`
    },
    ["content"]: (Name, Value) => {
        //if (Value.match(/:\/\//g)) return `<Content name="${Name}"><url>${Value}</url></Content>`;

        return `<Content name="${Name}"><url>${Value}</url></Content>`
    },
    ["cdata"]: (Name, Value) => {
        if (Value.match(/\n/g)) return `<string name="${Name}"><![CDATA[${Value.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]></string>`;
        return XMLTypes.string(Name, Value);
    },

    ["string"]: (Name, Value) => {
        return `<string name="${Name}">${StringToUTF8(EncodeStr(Value))}</string>`
    },
    ["number"]: (Name, Value, IsInteger, RoundTo) => {
        if (RoundTo) Value = Round(Value, RoundTo);

        if (IsInteger || (IsInteger === undefined && Number.isInteger(Value))) return `<int name="${Name}">${Value}</int>`;

        return `<float name="${Name}">${Value}</float>`;
    },
    ["boolean"]: (Name, Value) => {
        return `<bool name="${Name}">${Value}</bool>`
    },
    ["object"]: (Name, Value) => {
        if (Value.X !== undefined && Value.Y !== undefined && Value.Z !== undefined) {
            return `<Vector3 name="${Name}">${LoopTable(Value)}</Vector3>`
        } else if (Value.X !== undefined && Value.Y !== undefined) {
            return `<Vector2 name="${Name}">${LoopTable(Value)}</Vector2>`
        } else if (Value.XS !== undefined && Value.YS !== undefined) {
            return `<UDim2 name="${Name}">${LoopTable(Value)}</UDim2>`
        } else if (Value.S !== undefined) {
            return `<UDim name="${Name}">${LoopTable(Value)}</UDim>`
        } else if (Value.R !== undefined && Value.G !== undefined && Value.B !== undefined) {
            return `<Color3 name="${Name}">${LoopTable(Value)}</Color3>`
        } else if (Value[0] && Value[0].Colour) {
            var Sequence = ""

            NormaliseColorSequence(Value).forEach(Stop => {
                Sequence += `${Stop.TimePosition} ${Stop.Colour.R} ${Stop.Colour.G} ${Stop.Colour.B} 0 `;
            });

            return `<ColorSequence name="${Name}">${Sequence}</ColorSequence>`
        } else if (Value.Family) {
            return `<Font name="${Name}">${LoopTable(Value)}</Font>`
        } else if (Value.X1 !== undefined && Value.Y1 !== undefined) {
            return `<Rect2D name="${Name}"><min><X>${Round(Value.X0, 1)}</X><Y>${Round(Value.Y0, 1)}</Y></min><max><X>${Round(Value.X1, 1)}</X><Y>${Round(Value.Y1, 1)}</Y></max></Rect2D>`
        } else {
            console.error("[Figma to Roblox] Failed to sanitise table for property:" + Name, Value);
            return "";
        }
    }
}

function GetNodeProperties(Node, Settings, ParentObject) {
    //if (!NodeTypes[Node.type]) NotifyError(`Unknown node type "${Node.type}", please create a suggestion on the discord server`)
    const Properties = (NodeTypes[NodeTypes[Node.type] ? Node.type : "OTHER"])(Node, Settings);

    if (!Properties) return;
    if (Properties._Transparency === 0) Properties.Visible = false;
    if (ParentObject) {
        if (ParentObject._Transparency) { // Multiply Transparency with Parent Transparency/Pass through
            Properties._Transparency = ParentObject._Transparency * Properties._Transparency
        };

        if (!Settings.UploadImages && Properties.Class === "TextLabel" && ParentObject.Class.match("Button")) {
            if (!Flags.AlwaysExportImages) {
                Properties.Interactable = false;
            } else {
                //Properties.Text = "";
                //Properties.TextTransparency = 1;
            }
        }
    }

    if (Properties.Name.length > 99) {
        Properties.Name = Properties.Name.substr(0, 100);
    }

    // Does this node carry a "flatten into one image" tag? Matches the tagger's own tokens
    // (IMG / IMGBTN) as whole words — the same detection the Selection tree uses — so the
    // tree preview and the export always agree. (The old loose /img|image/ substring test
    // silently flattened layers like "Reimagined" and disagreed with what the tree showed.)
    // TEXT layers are auto-named after their content, so only the explicit short IMG tag
    // counts there (a label reading "Image" must stay text).
    const HasImageTag = Node.type === "TEXT"
        ? /\bimg\b/i.test(Node.name)
        : (/\b(img|image)\b/i.test(Node.name) || /\bimgbtn\b/i.test(Node.name));

    // Flatten intent (IMG / IMGBTN tags) must be known BEFORE the property handlers run:
    // the fills handler may export this node's image first, and it needs _FlattenImage
    // to keep children (text, icons) BAKED into the PNG and skip exporting them as
    // separate instances. IMGBTN flattens exactly like IMG — it just ends up a button.
    if (!/\|frame/i.test(Node.name) && !/\btxt\b/i.test(Node.name) && HasImageTag) {
        Properties._FlattenImage = true;
    }

    // Loop Node properties
    Object.getOwnPropertyNames(Object.getPrototypeOf(Node)).forEach((i) => {
        if (PropertyTypes[i]) {
            try {
                PropertyTypes[i](Node[i], Properties, Node, ParentObject);
            } catch (e) {
                NotifyImportantMessage(`Unhandled error while converting property "${i}" for Node "${Node.name}", error: "${e}"\nPlease report this in #bug-reports OR #plugin-help in the discord server (https://discord.gg/DWCGss4vry)`)
            }
        }
    });

    Properties._OriginalPosition = Properties.Position;
    Properties._OriginalSize = Properties.Size;

    if (Properties.Rotation) {
        Properties.Rotation = Math.round(Properties.Rotation * 1000) / 1000;
        if (Properties.Rotation !== 0 /*&& Properties.Size.XO !== 0 && Properties.Size.YO !== 0*/) {
            const BoundingBox = Node.absoluteBoundingBox;

            // absoluteBoundingBox is in absolute canvas space, so subtract the parent's
            // absolute origin to keep the rotated element positioned RELATIVE to its parent.
            // Without this, rotated (deeply-nested) elements get flung to canvas coords.
            const ParentBB = Node.parent && Node.parent.absoluteBoundingBox;
            const BaseX = ParentBB ? ParentBB.x : 0;
            const BaseY = ParentBB ? ParentBB.y : 0;

            if (Properties.Size.XO !== 0) {
                var CX = (BoundingBox.x - BaseX) + BoundingBox.width / 2;
                Properties.Position.XO = CX - Properties.Size.XO / 2;

            }

            if (Properties.Size.YO !== 0) {
                var CY = (BoundingBox.y - BaseY) + BoundingBox.height / 2;
                Properties.Position.YO = CY - Properties.Size.YO / 2;
            }

            // Position is now relative to the parent; stop main.js re-subtracting it.
            Properties._PositionIsRelative = true;
        }
    }

    // Force-export a node as a single image when its name carries the IMG tag.
    // TEXT layers are auto-named after their content in Figma, so matching the loose
    // word "image" there wrongly rasterises real text (e.g. a label "Upload Image").
    // For TEXT, only the explicit short tag "img" counts; other nodes keep matching either.
    // Force-export a node as a plain Frame when its name carries the |FRAME tag.
    // This wins over the IMG image-export below, so a node the plugin would otherwise
    // rasterise (image-named rects, groups, etc.) stays a native Roblox Frame.
    const ForceFrame = /\|frame/i.test(Node.name);
    if (ForceFrame) {
        Properties.Name = Properties.Name.replace(/\|frame/i, "").trim();
        Properties.Class = "Frame";
        // Drop Image*/Text*/Font* props a Frame never uses, so forcing a vector or
        // text node into a Frame doesn't leave orphaned data in the .rbxmx.
        for (const key of Object.keys(Properties)) {
            if (/^(Image|Text|Font|Scale|Slice|Resample|Tile|RichText|LineHeight|MaxVisibleGraphemes)/.test(key)) {
                delete Properties[key];
            }
        }
        Properties._hasExport = false;
        if (Properties.BackgroundTransparency === undefined) Properties.BackgroundTransparency = 0;
    }

    // TXT tag: keep this node a native TextLabel no matter what — blocks the IMG/rasterise
    // path below (e.g. a text layer whose CONTENT contains the word "image").
    const ForceText = /\btxt\b/i.test(Node.name);
    if (ForceText) {
        Properties.Name = Properties.Name.replace(/\s*\btxt\b/ig, "").trim() || Properties.Name;
    }

    const WantsImageExport = !ForceFrame && !ForceText && HasImageTag;
    if (WantsImageExport) {
        Properties.Name = Properties.Name.replace(/\bimg\b/i, "").replace(/\bimgbtn\b/i, "BTN").trim();
        Properties.Class = "ImageLabel";
        Properties.ImageColor3 = {R: 1, G: 1, B: 1};
        //Properties.ImageTransparency = Properties.BackgroundTransparency;
        Properties.BackgroundTransparency = 0;
        Properties._hasExport = true;
        Properties._FlattenImage = true;
        // The fills handler already rasterised this node (image fill + _FlattenImage set
        // in the pre-block) — don't export a second time, which would queue a duplicate
        // upload and overwrite Properties.Image with a fresh placeholder.
        if (!Properties.Image) ExportImage(Node, Properties);
    }

    return Properties;
}

function OnStart() {
    ImagesRemaining = 0;
    ImageUploadsReady = 0;
    AbortImageUpload = false;
    UploadQueue = [];
    UploadStats = { total: 0, finished: 0, failed: 0 };
}

module.exports = {
    GetNodeProperties,
    XMLTypes,
    Settings,
    WorkerBase,
    UpdateImage,
    GetImageFromOperation,
    IsDone,
    OnStart
}
