/*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@bbbbbbbb@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@FFFFFFFFFFFFFFFFFFFFFF@@iiii@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@tttt@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@RRRRRRRRRRRRRRRRR@@@@@@@@@@@@@@@@@@@b::::::b@@@@@@@@@@@@lllllll@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@F::::::::::::::::::::F@i::::i@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ttt:::t@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@R::::::::::::::::R@@@@@@@@@@@@@@@@@@b::::::b@@@@@@@@@@@@l:::::l@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@F::::::::::::::::::::F@@iiii@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@t:::::t@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@R::::::RRRRRR:::::R@@@@@@@@@@@@@@@@@b::::::b@@@@@@@@@@@@l:::::l@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@FF::::::FFFFFFFFF::::F@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@t:::::t@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@RR:::::R@@@@@R:::::R@@@@@@@@@@@@@@@@@b:::::b@@@@@@@@@@@@l:::::l@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@F:::::F@@@@@@@FFFFFFiiiiiii@@@@ggggggggg@@@ggggg@@@mmmmmmm@@@@mmmmmmm@@@@@aaaaaaaaaaaaa@@@@@@@@ttttttt:::::ttttttt@@@@@@@ooooooooooo@@@@@@@@@@R::::R@@@@@R:::::R@@@ooooooooooo@@@b:::::bbbbbbbbb@@@@@l::::l@@@@ooooooooooo@xxxxxxx@@@@@@xxxxxxx@@@@@
    @@@@@@@F:::::F@@@@@@@@@@@@@i:::::i@@@g:::::::::ggg::::g@mm:::::::m@@m:::::::mm@@@a::::::::::::a@@@@@@@t:::::::::::::::::t@@@@@oo:::::::::::oo@@@@@@@@R::::R@@@@@R:::::R@oo:::::::::::oo@b::::::::::::::bb@@@l::::l@@oo:::::::::::oox:::::x@@@@x:::::x@@@@@@
    @@@@@@@F::::::FFFFFFFFFF@@@@i::::i@@g:::::::::::::::::gm::::::::::mm::::::::::m@@aaaaaaaaa:::::a@@@@@@t:::::::::::::::::t@@@@o:::::::::::::::o@@@@@@@R::::RRRRRR:::::R@o:::::::::::::::ob::::::::::::::::b@@l::::l@o:::::::::::::::ox:::::x@@x:::::x@@@@@@@
    @@@@@@@F:::::::::::::::F@@@@i::::i@g::::::ggggg::::::ggm::::::::::::::::::::::m@@@@@@@@@@@a::::a@@@@@@tttttt:::::::tttttt@@@@o:::::ooooo:::::o@@@@@@@R:::::::::::::RR@@o:::::ooooo:::::ob:::::bbbbb:::::::b@l::::l@o:::::ooooo:::::o@x:::::xx:::::x@@@@@@@@
    @@@@@@@F:::::::::::::::F@@@@i::::i@g:::::g@@@@@g:::::g@m:::::mmm::::::mmm:::::m@@@@aaaaaaa:::::a@@@@@@@@@@@@t:::::t@@@@@@@@@@o::::o@@@@@o::::o@@@@@@@R::::RRRRRR:::::R@o::::o@@@@@o::::ob:::::b@@@@b::::::b@l::::l@o::::o@@@@@o::::o@@x::::::::::x@@@@@@@@@
    @@@@@@@F::::::FFFFFFFFFF@@@@i::::i@g:::::g@@@@@g:::::g@m::::m@@@m::::m@@@m::::m@@aa::::::::::::a@@@@@@@@@@@@t:::::t@@@@@@@@@@o::::o@@@@@o::::o@@@@@@@R::::R@@@@@R:::::Ro::::o@@@@@o::::ob:::::b@@@@@b:::::b@l::::l@o::::o@@@@@o::::o@@@x::::::::x@@@@@@@@@@
    @@@@@@@F:::::F@@@@@@@@@@@@@@i::::i@g:::::g@@@@@g:::::g@m::::m@@@m::::m@@@m::::m@a::::aaaa::::::a@@@@@@@@@@@@t:::::t@@@@@@@@@@o::::o@@@@@o::::o@@@@@@@R::::R@@@@@R:::::Ro::::o@@@@@o::::ob:::::b@@@@@b:::::b@l::::l@o::::o@@@@@o::::o@@@x::::::::x@@@@@@@@@@
    @@@@@@@F:::::F@@@@@@@@@@@@@@i::::i@g::::::g@@@@g:::::g@m::::m@@@m::::m@@@m::::ma::::a@@@@a:::::a@@@@@@@@@@@@t:::::t@@@@tttttto::::o@@@@@o::::o@@@@@@@R::::R@@@@@R:::::Ro::::o@@@@@o::::ob:::::b@@@@@b:::::b@l::::l@o::::o@@@@@o::::o@@x::::::::::x@@@@@@@@@
    @@@@@FF:::::::FF@@@@@@@@@@@i::::::ig:::::::ggggg:::::g@m::::m@@@m::::m@@@m::::ma::::a@@@@a:::::a@@@@@@@@@@@@t::::::tttt:::::to:::::ooooo:::::o@@@@@RR:::::R@@@@@R:::::Ro:::::ooooo:::::ob:::::bbbbbb::::::bl::::::lo:::::ooooo:::::o@x:::::xx:::::x@@@@@@@@
    @@@@@F::::::::FF@@@@@@@@@@@i::::::i@g::::::::::::::::g@m::::m@@@m::::m@@@m::::ma:::::aaaa::::::a@@@@@@@@@@@@tt::::::::::::::to:::::::::::::::o@@@@@R::::::R@@@@@R:::::Ro:::::::::::::::ob::::::::::::::::b@l::::::lo:::::::::::::::ox:::::x@@x:::::x@@@@@@@
    @@@@@F::::::::FF@@@@@@@@@@@i::::::i@@gg::::::::::::::g@m::::m@@@m::::m@@@m::::m@a::::::::::aa:::a@@@@@@@@@@@@@tt:::::::::::tt@oo:::::::::::oo@@@@@@R::::::R@@@@@R:::::R@oo:::::::::::oo@b:::::::::::::::b@@l::::::l@oo:::::::::::oox:::::x@@@@x:::::x@@@@@@
    @@@@@FFFFFFFFFFF@@@@@@@@@@@iiiiiiii@@@@gggggggg::::::g@mmmmmm@@@mmmmmm@@@mmmmmm@@aaaaaaaaaa@@aaaa@@@@@@@@@@@@@@@ttttttttttt@@@@@ooooooooooo@@@@@@@@RRRRRRRR@@@@@RRRRRRR@@@ooooooooooo@@@bbbbbbbbbbbbbbbb@@@llllllll@@@ooooooooooo@xxxxxxx@@@@@@xxxxxxx@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@g:::::g@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@gggggg@@@@@@g:::::g@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@g:::::gg@@@gg:::::g@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@g::::::ggg:::::::g@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@gg:::::::::::::g@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ggg::::::ggg@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@gggggg@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    Version 2.0.0
    By NoTwistedHere

    This plugin is free to use, report any bugs to me on Discord (NoTwistedHere)

    TODO:
        Implement section support
        Better ui (DONE?)
        Update that damn README
        Remove the old/unneeded todos
        [Clip] Masks (i.e. VECTOR masks - liklely requires being converted to an img)
        Add a help page in the plugin, containing tips & guidance
        Look into automatically converting layout mode into scrolling frames?
        Add a way to disable/enable uploading effects on frames
*/

const Conversions = require('./Conversions.js');
const { Flags, NotifyError, Notify, PushMessageQueue, Debounce } = require('./Utilities.js');
const { GetNodeProperties, XMLTypes, Settings, WorkerBase, UpdateImage, GetImageFromOperation, IsDone, OnStart } = require('./Converters.js');
const HighlightNodes = require("./Flags/HighlightNodes.js");

var RunDebounce = false;

// Bridge: same Worker as the image uploader, /bridge/:code endpoint. Lets the export
// land in Studio (via the "Pull from Figma" Studio plugin) with no manual .rbxmx import.
function BridgeApi() {
    const b = WorkerBase();
    return b ? b + "/bridge" : "";
}

async function SendToStudio(FileContent) {
    if (!Settings.SendToStudio) return;

    if (!WorkerBase()) {
        return NotifyError("Set your Worker URL in the plugin settings before sending to Studio");
    }

    const Code = (Settings.BridgeCode || "").trim();
    if (!Code) {
        return NotifyError("Send to Studio is enabled but no Session Code is set");
    }

    try {
        const Response = await fetch(`${BridgeApi()}/${encodeURIComponent(Code)}`, {
            method: "POST",
            headers: { "Content-Type": "application/xml" },
            body: FileContent,
        });

        if (Response.ok) {
            Notify(`Sent to Studio (code "${Code}"). Click "Pull from Figma" in Studio.`, { timeout: 8000 });
        } else {
            NotifyError(`Failed to send to Studio (HTTP ${Response.status})`);
        }
    } catch (e) {
        NotifyError("Failed to send to Studio: " + e.message);
    }
}

// Keeps a 0-1 Transparency value valid even if upstream math produces NaN or an out-of-range number
function ClampTransparency(Value) {
    if (typeof(Value) !== "number" || isNaN(Value)) return 0;
    if (Value < 0) return 0;
    if (Value > 1) return 1;
    return Value;
}

function NormaliseNumberSequence(Stops) {
    const CleanStops = Stops
        .filter(Stop => Stop && Stop.Transparency !== undefined)
        .map(Stop => ({
            TimePosition: ClampTransparency(Stop.TimePosition),
            Transparency: ClampTransparency(Stop.Transparency),
        }))
        .sort((A, B) => A.TimePosition - B.TimePosition);

    if (!CleanStops.length) return [];

    if (CleanStops[0].TimePosition !== 0) {
        CleanStops.unshift({
            TimePosition: 0,
            Transparency: CleanStops[0].Transparency,
        });
    }

    const LastStop = CleanStops[CleanStops.length - 1];
    if (LastStop.TimePosition !== 1) {
        CleanStops.push({
            TimePosition: 1,
            Transparency: LastStop.Transparency,
        });
    }

    return CleanStops;
}

// Grow a flattened image's box to the exported PNG's true bounds. Figma pads exports to
// everything the node renders (drop shadows, outside strokes, blur), so the ImageLabel
// must cover that same rectangle or the PNG gets squeezed/stretched into the un-padded
// box. Applied per side, in Figma px, BEFORE the offset→scale conversion so the padding
// scales with resolution like everything else.
function ApplyRenderPad(Properties, Pad) {
    if (Properties._PadApplied) return;
    Properties.Position.XO -= Pad.L;
    Properties.Position.YO -= Pad.T;
    Properties.Size.XO += Pad.L + Pad.R;
    Properties.Size.YO += Pad.T + Pad.B;
    Properties._PadApplied = true;
    Properties._AppliedPad = Pad;
}

function ConvertObject(Properties, ParentObject) {
    var XML = ""

    for (var [Key, Value] of Object.entries(Properties)) {
        if (Value == null || Value == undefined) continue;

        switch (Key) {
            case "Node":
            case "Children":
            case "Class":
            case "_IsButton":
            case "_HasGradient":
            case "_HasCorners":
            case "_HasStroke":
            case "EffectRadius": // internal padding bookkeeping, not a Roblox property
                break;
            case "ScaleType":
            case "DominantAxis":
            case "AspectType":
            case "TextTruncate":
            case "TextXAlignment":
            case "TextYAlignment":
            case "HorizontalAlignment":
            case "VerticalAlignment":
            case "SortOrder":
            case "FillDirection":
            case "LineJoinModes":
            case "ScrollingDirection":
            case "MarketplaceFonts":
            case "AutomaticCanvasSize":
                XML += XMLTypes.token(Key, Value)
                break;
            case "Text":
                XML += XMLTypes.cdata(Key, Value)
                break;
            case "Image":
                XML += XMLTypes.content(Key, Value)
                break;
            case "BackgroundTransparency":
            case "Transparency": //can be either a number OR NumberSequence
            case "TextStrokeTransparency":
            case "TextTransparency":
            case "ImageTransparency":
                // Should always be parented to a group as only groups and sections allow children
                if (typeof(Value) == "number") {
                    const CombinedOpacity = (Properties._Transparency || 1) * Value;
                    const FinalTransparency = ClampTransparency(1 - CombinedOpacity);
                    XML += XMLTypes.number(Key, FinalTransparency, false, 10000);
                    break;
                } else if (Value[0] && Value[0].Transparency !== undefined) {
                    var Sequence = ""

                    NormaliseNumberSequence(Value).forEach(Stop => {
                        Sequence += `${Stop.TimePosition} ${Stop.Transparency} 0 `;
                    });
                    XML += `<NumberSequence name="${Key}">${Sequence}</NumberSequence>`
                    break;
                }
            case "TextSize":
            case "MaxTextSize":
                XML += XMLTypes.number(Key, Value * Flags.TextSizeAdjustment, false, 20);
                break;
            case "Rotation":
                if (ParentObject && ParentObject.Rotation) {
                    Value = Value - ParentObject.Rotation
                }

                XML += XMLTypes.number(Key, Value, false, 1000);
                break;
            default:
                if (Key.substring(0, 1) == "_") break;

                if (XMLTypes[typeof(Value)]) XML += XMLTypes[typeof(Value)](Key, Value);
                break;
        }
    }

    return XML
}

// UIStroke.Thickness is the one Roblox UI property with no Scale component — it stays in
// fixed px while the rest of the export scales with the screen, so text outlines / borders
// only look right at the design resolution (thicker on smaller screens, thinner on bigger).
// This LocalScript ships inside the export root and rescales every UIStroke proportionally
// to the root's real on-screen size, live. The original (design) thickness is kept in an
// attribute so re-applying is idempotent — the Studio plugin runs the same logic at import
// time so the edit-mode preview matches (LocalScripts only run in play mode).
function StrokeScalerScript(DesignHeight) {
    const Source = `-- Generated by Figma to Roblox
-- Keeps UIStroke.Thickness proportional to the UI size (Thickness has no Scale component).
local DESIGN_HEIGHT = ${Math.round(DesignHeight * 100) / 100}
local Root = script.Parent

local function Apply()
	local Factor = Root.AbsoluteSize.Y / DESIGN_HEIGHT
	if Factor <= 0 then return end
	for _, Stroke in ipairs(Root:GetDescendants()) do
		if Stroke:IsA("UIStroke") then
			local Design = Stroke:GetAttribute("FTR_DesignThickness")
			if not Design then
				Design = Stroke.Thickness
				Stroke:SetAttribute("FTR_DesignThickness", Design)
			end
			Stroke.Thickness = Design * Factor
		end
	end
end

Root:GetPropertyChangedSignal("AbsoluteSize"):Connect(Apply)
Apply()
`;
    // The NumberValue duplicates DESIGN_HEIGHT for the Studio plugin: reading a script's
    // Source from a plugin needs the Script Injection permission (fails silently without
    // it), while a NumberValue's Value is always readable.
    return `<Item class="LocalScript" referent="RBX0">\n<Properties>\n<string name="Name">FTR_StrokeScaler</string><ProtectedString name="Source"><![CDATA[${Source}]]></ProtectedString>\n</Properties></Item>\n`
        + `<Item class="NumberValue" referent="RBX0">\n<Properties>\n<string name="Name">FTR_DesignHeight</string><double name="Value">${Math.round(DesignHeight * 100) / 100}</double>\n</Properties></Item>\n`;
}

function LoopChildren(Children, ParentObject) {
    var New2 = "";

    Children.forEach(Child => {
        var XMLProperties = ConvertObject(Child, ParentObject);

        New2 += `<Item class="${Child.Class}" referent="RBX0">\n${Child.Children ? LoopChildren(Child.Children) : ""}<Properties>\n${XMLProperties}\n</Properties></Item>\n`
    });

    return New2
}

function LoopNodes(Nodes, ParentObject) {
    let FileContent = "";
    let LocalLayoutOrder = 0;

    const SortedNodes = []

    //if (ParentObject) {
        for (var i = 0; i < Nodes.length; i++) {
            const Node = Nodes[i];

            if (Node && Node.name) {
                if (Node.name.toLowerCase() === Flags.GroupBackgroundFrameName) {
                    SortedNodes[i] = SortedNodes[0];
                    SortedNodes[0] = Node;
                } else SortedNodes[i] = Node;
            }
        }
    //}

    // Loop Nodes
    for (var i = 0; i < SortedNodes.length; i++) {
        const Node = SortedNodes[i];
        if (Flags.IgnoreInvisible && !Node.visible) continue;

        const Properties = GetNodeProperties(Node, Settings, ParentObject); // Can't name it Object because of below v

        //console.log("Props:", Properties, "Parent:", ParentObject)
        //console.log("Node:", Node);
        if (!Properties) continue;
        Properties._OriginalNode = Node;
        if (Settings.ApplyLayoutOrder) {
            Properties.LayoutOrder = LocalLayoutOrder;
            LocalLayoutOrder += 1;
        }

        let IgnoreChildren;

        if (Node.type === "BOOLEAN_OPERATION") { // No ~Temp added as a NodeType & create as if a group
            figma.notify("Boolean Operations may give undesired results", {timeout: 1800})
            IgnoreChildren = true
            // Booleans are treated as groups
            // FileContent += `<Item class="${Properties.Class}" referent="RBX0">\n<Properties>\n`
            // FileContent += ConvertObject(Properties, ParentObject) + "\n</Properties>\n" + LoopNodes(Node.children, Properties);
            // FileContent += "</Item>\n";
        }

        // Calculate Aspect Ratio and Scale.
        // Smart AspectRatio: a SINGLE UIAspectRatioConstraint on the ROOT of the export keeps the
        // whole UI proportional — every descendant is pure Scale and scales uniformly under it, so
        // per-element constraints are redundant and can even break the layout (a child that keeps
        // its own ratio decouples from a parent that flexes). Empirically verified in Studio: aspect
        // on the root alone renders perfectly on any screen shape; aspect on every element does not.
        // So the global flag only applies to root elements (!ParentObject). Explicit per-node locks
        // (_ApplyAspectRatio, set in Figma) still work anywhere; text never gets one from the global
        // flag since it auto-fits via TextScaled + UITextSizeConstraint.
        const IsRoot = !ParentObject;
        const IsTextClass = Properties.Class === "TextLabel" || Properties.Class === "TextButton" || Properties.Class === "TextBox";
        if (Properties._ApplyAspectRatio || (Flags.ApplyAspectRatio && IsRoot && !IsTextClass)) {
            if (Properties.Class === "ScrollingFrame") console.warn("Cannot Apply UIAspectRatioConstraint to a ScrollingFrame that scrolls")
            else {
                var AspectRatio = Math.round((Properties.Size.XO / Properties.Size.YO) * 100000) / 100000;

                if (Node.width != 0 && Node.height != 0 && AspectRatio) {
                    Properties.Children.push({
                        Class: "UIAspectRatioConstraint",
                        AspectRatio: AspectRatio,
                        AspectType: 0,
                        DominantAxis: Properties.Size.XO > Properties.Size.YO ? 0 : 1
                    });
                }
            }
        }

        const lowercaseName = Properties.Name.toLowerCase();
        const removeNameAbriv = lowercaseName.match("btn") || lowercaseName.match("scrl");

        if (lowercaseName.match(/\|anchor/)) {
            Properties._ApplyAnchorPoint = true;
            Properties.Name = Properties.Name.replace(/\|anchor/i, "");
        }

        if (ParentObject && (lowercaseName == Flags.GroupBackgroundFrameName /*|| (
            Node.type === "RECTANGLE" && Properties.BackgroundTransparency == 0
            && Properties.Position.XO == ParentObject.Position.XO
            && Properties.Position.YO == ParentObject.Position.YO
            && Properties.Size.XO == ParentObject.Size.XO
            && Properties.Size.YO == ParentObject.Size.YO)
        */)) { // Convert parent object into the new background
            Object.entries(Properties).forEach(([key, value]) => {
                if (key.match("^_")) ParentObject[key] = value;
            });
            //ParentObject._HasGradient = Properties._HasGradient;
            //ParentObject._HasCorners = Properties._HasCorners;

            ParentObject.BackgroundColor3 = Properties.BackgroundColor3;
            ParentObject.BackgroundTransparency = Properties.BackgroundTransparency;
            ParentObject.BorderSizePixel = Properties.BorderSizePixel;
            ParentObject.Image = Properties.Image;
            //ParentObject.Rotation = Properties.Rotation; // this now looks like a bad idea

            if (Properties.Class !== "Frame") ParentObject.Class = Properties.Class;
            Properties._ReplacedBy = ParentObject;

            // The background's exported PNG can overhang its box (shadow / outside stroke).
            // Apply that padding to the parent NOW — "background" is sorted first, so all
            // siblings converted after this see the padded geometry and stay aligned.
            // (Background covers the parent exactly, so the child's per-side pad is exact.)
            if (Properties.Image !== undefined) {
                if (Properties._RenderPad) ApplyRenderPad(ParentObject, Properties._RenderPad);
                else if (Properties.EffectRadius && !ParentObject.EffectRadius) ParentObject.EffectRadius = Properties.EffectRadius;
            }

            if (Properties.Children) {
                FileContent += LoopChildren(Properties.Children, Properties);
            }

            continue;
        } else if (removeNameAbriv && removeNameAbriv[0] === "btn" || lowercaseName.match("button")) {
            if (removeNameAbriv) Properties.Name = Properties.Name.replace(/btn/i, "");

            if (ParentObject && ParentObject._IsButton) { // update parent button
                console.log("parent is button, we is", Properties.Class, Properties._HasGradient, Properties._hasExport, ParentObject._HasGradient, ParentObject._hasExport);
                if (Properties.Class === "TextLabel") {
                    // if the parent object meets certain criteria (listed below) then we should keep the TextLabel within the button and remove the TextButton's text
                    // No (Background/Text) Gradient
                    // Must be TextButton

                    if ((!Properties._hasExport || Properties._HasGradient !== true) && ParentObject._HasGradient !== true) {
                        ParentObject.Class = "TextButton"

                        // if the text button (background) has a stroke, it cadnnot be Contextual otherwise it will apply to the text
                        ParentObject.Children.forEach(Child => {
                            if (Child.Class === "UIStroke") {
                                Child.ApplyStrokeMode = Conversions.indexOf("Border");
                            }
                        })

                        Object.entries(Properties).forEach(([key, value]) => {
                            if (key.match("^Text")) ParentObject[key] = value
                        })

                        ParentObject.FontFace = Properties.FontFace

                        // if (Properties.Children) {
                        //     FileContent += LoopChildren(Properties.Children, ParentObject)
                        // }

                        //ParentObject.Text = Properties.Text

                        //continue;
                    } else {
                        console.log("TextLabel doesn't meet criteria to update parent TextButton")
                    }
                } else if (Properties.Class === "ImageLabel" || Properties.Class === "ImageButton") {
                    if ((Properties._hasExport || Properties._HasGradient !== true) && ParentObject._HasGradient !== true) {
                        ParentObject.Class = "ImageButton"

                        if (Properties.EffectRadius) {
                            ParentObject.EffectRadius = ParentObject.EffectRadius ? {
                                X: Math.max(ParentObject.EffectRadius.X, Properties.EffectRadius.X),
                                Y: Math.max(ParentObject.EffectRadius.Y, Properties.EffectRadius.Y),
                            } : Properties.EffectRadius;
                        }

                        Object.entries(Properties).forEach(([key, value]) => {
                            if (key.match("^Image")) ParentObject[key] = value
                        })

                        // The merged image PNG can overhang the child's box; grow the button
                        // by the same per-side padding so the PNG isn't squeezed into it.
                        if (Properties._RenderPad) ApplyRenderPad(ParentObject, Properties._RenderPad);
                        continue;
                    } else {
                        console.log("ImageLabel doesn't meet criteria to update parent ImageButton")
                    }
                }
            } else if (Properties.Class === "Frame" || Properties.Class === "ImageLabel" || Properties.Class === "TextLabel") {
                Properties._IsButton = true;

                if (Properties.Class === "ImageLabel") Properties.Class = "ImageButton"
                else /*if (Properties.Class === "TextLabel")*/ {
                    // Remove text from non-TextLabels (Frames, Groups, Components, Instances)
                    if (Properties.Class !== "TextLabel") {
                        Properties.Text = "";
                        Properties.TextSize = 0;
                        Properties.TextTransparency = 1;
                    };

                    Properties.Class = "TextButton";
                }
            } else console.warn(`[Figma to Roblox] FAILED to convert element "${Properties.Name}" into a button as class "${Properties.Class}" is none of the following: Frame, ImageLabel, TextLabel`)
        } else if (removeNameAbriv && removeNameAbriv[0] === "scrl" || lowercaseName.match("scroll")) {  // Convert to Scrolling Frame
            if (removeNameAbriv) Properties.Name = Properties.Name.replace(/scrl/i, "");

            if (Node.type !== "FRAME" && Node.type !== "GROUP" && Node.Type !== "COMPONENT" && Node.Type !== "INSTANCE") {
                console.warn("[Figma to Roblox] Cannot convert a non-Group/Frame to a ScrollingFrame");
            } else {
                Properties.Class = "ScrollingFrame"
                Properties.CanvasSize = {
                    XS: 0,
                    XO: 0,
                    YS: 0,
                    YO: 0,
                }

                var ListDirection = "XY"

                Properties.Children.forEach((Child) => {
                    if (Child.Class == "UIListLayout") {
                        ListDirection = Child.FillDirection === "HORIZONTAL" ? "X" : "Y"
                    }
                })

                Properties.AutomaticCanvasSize = Conversions.AutomaticCanvasSize.indexOf(ListDirection) // Should prefrebly be either or
                Properties.ScrollingEnabled = true
                Properties.Interactable = true
                Properties.Selectable = true
                Properties.ScrollingDirection =  Conversions.ScrollingDirection.indexOf(ListDirection)  // Should prefrebly be either or
                Properties.VerticalScrollBarInset = 0 //Conversions.ScrollBarInset.indexOf("SCROLLBAR")
                Properties.HorizontalScrollBarInset = 0 //Conversions.ScrollBarInset.indexOf("SCROLLBAR")
            }
        }

        // Misc
        var New = "";

        //if (!Properties._hasExport) { // if true then unwanted Children should already be removed
            if (Properties.Children) {
                New += LoopChildren(Properties.Children, ParentObject);
            }
            // Loop all Node Children
            if (!IgnoreChildren && (Properties._hasExport || !Properties.Image) && !Properties._FlattenImage && Node.children) New += LoopNodes(Node.children, Properties);
        //}

        const ConvertAnchorPoint = function(SizeX, SizeY) {
            var AX = (Properties.Position.XO + Properties.Size.XO / 2) / SizeX;
            var AY = (Properties.Position.YO + Properties.Size.YO / 2) / SizeY;

            if (!isNaN(AX) && !isNaN(AY)) {
                if (Flags.SnapAnchorPoint) {
                    const Snap = Flags.SnapAnchorPoint == true ? 0.5 : Flags.SnapAnchorPoint;

                    AX = Math.round(AX / Snap) * Snap;
                    AY = Math.round(AY / Snap) * Snap;
                }

                Properties.AnchorPoint = {
                    X: AX,
                    Y: AY
                }

                Properties.Position.YO += Properties.Size.YO * AY;
                Properties.Position.XO += Properties.Size.XO * AX;
            }
        }

        // Flattened images: grow the box to the exported PNG's true bounds (ApplyRenderPad).
        // Native (non-image) elements now keep their exact Figma box — UIStroke draws its
        // outline outside the element like Figma does, so inflating stroked/shadowed frames
        // (the old EffectRadius behaviour) only distorted sizes. Runs BEFORE the anchor and
        // offset→scale conversions so the padding is resolution-independent.
        if (Properties._RenderPad) ApplyRenderPad(Properties, Properties._RenderPad);
        else if (Properties.EffectRadius && (Properties._ExportAsImage || Properties._hasExport || Properties.Image !== undefined)) {
            // Fallback for image exports without exact render bounds (rotated nodes,
            // cached/no-upload paths): symmetric padding, still in Figma-px space.
            ApplyRenderPad(Properties, {
                L: Properties.EffectRadius.X, R: Properties.EffectRadius.X,
                T: Properties.EffectRadius.Y, B: Properties.EffectRadius.Y,
            });
        }

        if (ParentObject) {
            if (ParentObject._OriginalPosition && !Properties._PositionIsRelative && ParentObject.Node.type !== "FRAME" && ParentObject.Node.type !== "INSTANCE" && ParentObject.Node.type !== "COMPONENT") {
                // Get Position relative to Parent
                // (_OriginalPosition aliases the parent's Position, so a padded parent's
                // shifted origin automatically re-bases these children onto the padded box.)
                Properties.Position.XO = Properties.Position.XO - ParentObject._OriginalPosition.XO;
                Properties.Position.YO = Properties.Position.YO - ParentObject._OriginalPosition.YO;
            } else if (ParentObject._AppliedPad) {
                // Frame-relative children (and rotated children, already parent-relative):
                // the parent's visual origin moved up-left by the image padding, so shift
                // them the other way to keep them visually in place inside the padded box.
                Properties.Position.XO += ParentObject._AppliedPad.L;
                Properties.Position.YO += ParentObject._AppliedPad.T;
            }

            // Parent size in pixels, used as the divisor for the anchor-point and
            // offset->scale maths below. When the parent fills its own parent via scale
            // (e.g. Size = {1,0},{1,0}) its offset size is 0, which would divide-by-zero
            // and fling deeply-nested children far off-screen. Fall back to the parent's
            // real Figma pixel size in that case.
            const PSX = ParentObject.Size.XO || (ParentObject.Node && ParentObject.Node.width) || 1;
            const PSY = ParentObject.Size.YO || (ParentObject.Node && ParentObject.Node.height) || 1;
            // Convert Anchor Point
            if (Flags.ApplyAnchorPoint || Properties._ApplyAnchorPoint) ConvertAnchorPoint(PSX, PSY);

            // Convert Offset (Pixels) to Scale
            if (Flags.ConvertOffsetToScale) {
                Properties.Position.XS = Properties.Position.XO / PSX;
                Properties.Position.YS = Properties.Position.YO / PSY;
                Properties.Size.XS = Properties.Size.XO / PSX;
                Properties.Size.YS = Properties.Size.YO / PSY;

                if (Flags.ScrollFrame_ScaleDominantAxis && ParentObject.Class === "ScrollingFrame") {
                    if (Properties.Size.XS < Properties.Size.YS) { // X is smaller than Y
                        Properties.Size.XS = 0; // remove X scale, keep offset
                        Properties.Size.YO = 0; //remove Y offset, keep scale
                    } else { // Y is smaller or equal to X
                        Properties.Size.YS = 0; // remove Y scale, keep offset
                        Properties.Size.XO = 0; // remove X offset, keep scale
                    }
                } else {
                    // Properties.Position.XO = 0;
                    // Properties.Position.YO = 0;
                    Properties.Size.XO = 0;
                    Properties.Size.YO = 0;
                }

                // if (Flags.OffsetFromScale) {
                //     console.warn("Offset from Scale is a work in progress, expect issues")
                //     // WIP
                //     // Split into 3, Round to nearest
                //     var PXS = Properties.Position.XS;

                //     const AX = Properties.AnchorPoint ? Properties.AnchorPoint.X : 0;
                //     const AY = Properties.AnchorPoint ? Properties.AnchorPoint.Y : 0;

                //     if (PXS <= 0.45) PXS = 0;
                //     else if (PXS <= 0.55) PXS = 0.5;
                //     else if (PXS <= 1) {
                //         PXS = 1;
                //         //Properties.Position.XO = Properties.Position.XO - PSX;
                //     };

                //     Properties.Position.XS = PXS;

                //     // Repeat for Y
                //     var PYS = Properties.Position.YS;

                //     if (PYS <= 0.45) PYS = 0;
                //     else if (PYS <= 0.55) PYS = 0.5;
                //     else if (PYS <= 1) {
                //         PYS = 1;
                //         //Properties.Position.YO = Properties.Position.YO - PSY;
                //     };

                //     Properties.Position.YS = PYS;
                //     Properties.Position.XO -= ((PSX - Properties.Size.X * AX) * PXS);
                //     Properties.Position.YO -= ((PSY - Properties.Size.Y * AY) * PYS);
                // } else {
                     Properties.Position.XO = 0;
                     Properties.Position.YO = 0;
                // }
            }
        } else if (!Flags.UseSelectionPositionRelativeToScene) {
            // Set Position of upmost Element (most likely a Group) to (0,0)
            Properties.Position.XO = 0; //-= Node.x;
            Properties.Position.YO = 0; //-= Node.y;
        } else if (Node.parent && Node.parent.type !== "PAGE") {
            // Convert user-selected frame to scale
            if (Flags.ApplyAnchorPoint || Properties._ApplyAnchorPoint) ConvertAnchorPoint(Node.parent.width, Node.parent.height);

            if (Flags.ConvertOffsetToScale) {
                const PSX = Node.parent.width
                const PSY = Node.parent.height

                //console.log(Properties.Position, "X:", PSX, "Y:", PSY)
                Properties.Position.XS = Properties.Position.XO / PSX
                Properties.Position.YS = Properties.Position.YO / PSY
                Properties.Size.XS = Properties.Size.XO / PSX;
                Properties.Size.YS = Properties.Size.YO / PSY;

                Properties.Position.XO = 0;
                Properties.Position.YO = 0;
                Properties.Size.XO = 0;
                Properties.Size.YO = 0;
            }
        } else if (Flags.ConvertOffsetToScale) {
            // Root of the export sits directly on the Figma PAGE, so there is no parent
            // to scale against. Without this branch the top-level frame stays in raw pixel
            // Offset (e.g. {0,1813},{0,1106}) and never fits the screen — every scaled
            // descendant then scales relative to that fixed size, so the whole UI is locked
            // to one resolution. Make the root fill its ScreenGui via Scale; the
            // UIAspectRatioConstraint added above keeps the proportions correct on any screen.
            Properties.Position.XS = 0;
            Properties.Position.YS = 0;
            Properties.Position.XO = 0;
            Properties.Position.YO = 0;
            Properties.Size.XS = 1;
            Properties.Size.YS = 1;
            Properties.Size.XO = 0;
            Properties.Size.YO = 0;
        }

        // (Effect/stroke padding is now applied BEFORE the offset→scale conversion above —
        // see ApplyRenderPad. The old post-conversion EffectRadius block added raw px
        // offsets on top of scale, which didn't scale with resolution and was symmetric
        // even for asymmetric shadows.)

        // Ship the stroke scaler with any export whose tree contains a UIStroke, so
        // outline thickness tracks the UI size at every resolution (see StrokeScalerScript).
        if (IsRoot && Node.height && New.match(/class="UIStroke"/)) {
            New += StrokeScalerScript(Node.height);
        }

        // Convert to XML
        FileContent += `<Item class="${Properties.Class}" referent="RBX0">\n<Properties>\n`
        FileContent += ConvertObject(Properties, ParentObject) + "\n</Properties>\n" + New;
        FileContent += "</Item>\n";
        New = null;
    }

    return FileContent
}

function CreatePreset(Preset) {
    const CenterOfScreen = figma.viewport.center;
    var SizeX;
    var SizeY;

    switch (Preset) {
        case "Full HD":
            SizeX = 1920;
            SizeY = 1080;
            break;
        case "2K":
            SizeX = 2048;
            SizeY = 1440;
            break;
        case "1440p":
            SizeX = 2560;
            SizeY = 1440;
            break;
        case "4K":
            SizeX = 3840;
            SizeY = 2160;
            break;
        default:
            return NotifyError("Preset doesn't exist");
    }

    const Frame = figma.createFrame();
    Frame.x = CenterOfScreen.x - SizeX / 2;
    Frame.y = CenterOfScreen.y - SizeY / 2;
    Frame.resize(SizeX, SizeY);
    Frame.lockAspectRatio();
    Frame.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
    Frame.name = `${Preset} (${SizeX}x${SizeY})`
    Frame.setRelaunchData({
        "export": "Export with FigmaToRoblox"
    });
}

async function RunPlugin() { // this is technecally a codegen plugin?
    if (RunDebounce) return;
    if (figma.currentPage.selection.length == 0) return NotifyError("No Nodes selected");

    RunDebounce = true
    console.log("[FTR] Starting");
    Notify("Figma to roblox is exporting, support can be found at https://discord.gg/DWCGss4vry", { timeout: 12000 });
    OnStart();

    // Start Converting Nodes
    let FileContent = '<!--\n\tGenerated by Figma to Roblox\n\tReport any bugs/issues to notwistedhere on discord/github\n-->\n\n<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4"><Meta name="ExplicitAutoJoints">true</Meta>\n';
    let Nodes;
    try {
        Nodes = LoopNodes(figma.currentPage.selection);

        // wait for all images to be uploaded
        await new Promise((resolve, reject) => {
            function Timeout() {
                if (IsDone()) return resolve();
                else setTimeout(Timeout, 1200);
            }

            Timeout();
        })
    } catch (e) {
        NotifyError("Figma to Roblox experienced an unexpected error, please make a bug report in discord https://discord.gg/DWCGss4vry; " + e.message);
    }

    PushMessageQueue()

    if (Nodes) {
        try {
            // [^}]+ — UploadIds can be sha256 hashes, asset ids or Figma Node.ids ("196:58",
            // "I196:58;42:7"). The old charset missed "_" and ";", leaving literal
            // "{FTR_...}" strings in the rbxmx (images then rendered as nothing).
            const ImageOperations = Nodes.replaceAll(/{FTR_([^}]+)}/g, (Match, Id) => {
                var ExportedImage = GetImageFromOperation(Id);
                console.log(ExportedImage);

                if (!ExportedImage || !ExportedImage.Properties.Image || /^{FTR_/.test(ExportedImage.Properties.Image)) {
                    console.warn(`[FTR] No uploaded image found for placeholder "${Match}", using transparent placeholder`);
                    return "rbxasset://textures/StudioSharedUI/TransparentWhiteImagePlaceholder.png";
                }

                return ExportedImage.Properties.Image;
            });

            FileContent += ImageOperations + "</roblox>";

            if (Settings.SendToStudio) {
                await SendToStudio(FileContent);
            } else {
                figma.ui.postMessage({
                    type: "Download",
                    data: FileContent
                });
            }

            Notify("Successfully exported");
        } catch (e) {
            NotifyError("Figma to Roblox experienced an unexpected error, please make a bug report in discord https://discord.gg/DWCGss4vry; " + e.message);
        }
    }
    console.log("[FTR] Done");

    setTimeout(() => {
        RunDebounce = false
    }, 2500)
}

figma.skipInvisibleInstanceChildren = true;
figma.on("close", () => {
    HighlightNodes.stop();
});

// ─── Selection Tree + Tagger helpers ────────────────────────────────────────

const TAG_DEFS = {
    image:       { token: " IMG",     regex: /\b(img|image)\b/i,   stripRe: /\s*\b(img|image)\b/ig },
    button:      { token: " BTN",     regex: /\b(btn|button)\b/i,  stripRe: /\s*\b(btn|button)\b/ig },
    imagebutton: { token: " IMGBTN",  regex: /\bimgbtn\b/i,        stripRe: /\s*\bimgbtn\b/ig },
    frame:       { token: "|FRAME",   regex: /\|frame/i,           stripRe: /\|frame/ig },
    scroll:      { token: " SCRL",    regex: /\b(scrl|scroll)\b/i, stripRe: /\s*\b(scrl|scroll)\b/ig },
    anchor:      { token: "|ANCHOR",  regex: /\|anchor/i,          stripRe: /\|anchor/ig },
    text:        { token: " TXT",     regex: /\btxt\b/i,           stripRe: /\s*\btxt\b/ig },
};

// Tags that pick the Roblox class — only one may apply to a node at a time.
// (anchor is a modifier and background has its own handling, so they're excluded.)
const CLASS_TAGS = ["image", "button", "imagebutton", "frame", "scroll", "text"];

function DetectTags(name) {
    return {
        image:       TAG_DEFS.image.regex.test(name),
        button:      TAG_DEFS.button.regex.test(name),
        imagebutton: TAG_DEFS.imagebutton.regex.test(name),
        frame:       TAG_DEFS.frame.regex.test(name),
        scroll:      TAG_DEFS.scroll.regex.test(name),
        anchor:     TAG_DEFS.anchor.regex.test(name),
        text:       TAG_DEFS.text.regex.test(name),
        background: name.toLowerCase() === "background",
    };
}

function ToggleTag(node, tag) {
    if (tag === "background") {
        if (node.name.toLowerCase() === "background") {
            // Revert to a generic name based on node type
            const typeCapMap = { RECTANGLE: "Rectangle", FRAME: "Frame", GROUP: "Group", COMPONENT: "Component", INSTANCE: "Instance", ELLIPSE: "Ellipse" };
            node.name = typeCapMap[node.type] || node.type.charAt(0).toUpperCase() + node.type.slice(1).toLowerCase();
        } else {
            node.name = "Background";
        }
        return;
    }
    const def = TAG_DEFS[tag];
    if (!def) return;
    if (def.regex.test(node.name)) {
        // Remove the tag
        node.name = node.name.replace(def.stripRe, "").replace(/  +/g, " ").trim();
    } else {
        // Class tags (image/button/imagebutton/frame/scroll) are mutually exclusive:
        // strip any other class tag before applying this one so they never stack.
        if (CLASS_TAGS.includes(tag)) {
            for (const other of CLASS_TAGS) {
                if (other !== tag) node.name = node.name.replace(TAG_DEFS[other].stripRe, "");
            }
            node.name = node.name.replace(/  +/g, " ").trim();
        }
        // Append the canonical token
        node.name = node.name + def.token;
    }
}

function ClassifyNode(node) {
    const tags = DetectTags(node.name);
    // Text layers are auto-named by their content, so the word "image" must NOT turn them
    // into images — only the explicit short "img" tag does (matches the exporter behaviour).
    const imageTagged = node.type === "TEXT" ? /\bimg\b/i.test(node.name) : tags.image;
    if (tags.frame) return "Frame";               // force-export as a plain Frame
    if (tags.text) return "TextLabel";            // force-export as a native TextLabel (never rasterised)
    if (tags.imagebutton) return "ImageButton";   // force-export as an ImageButton
    if (tags.button) return node.type === "TEXT" ? "TextButton" : "ImageButton";
    if (tags.scroll || (node.layoutMode && node.layoutMode !== "NONE")) return "ScrollingFrame";
    if (imageTagged) return "ImageLabel";
    if (node.type === "TEXT") return "TextLabel";
    if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "STAR" || node.type === "LINE" || node.type === "POLYGON") return "ImageLabel";
    if (node.name && node.name.toLowerCase() === "background") return "Background";
    if (node.type === "RECTANGLE" || node.type === "ELLIPSE") return "Frame";
    if (node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET" || node.type === "SECTION") return "Frame";
    return node.type;
}

function BuildSelectionTree(roots) {
    // `roots` lets the UI keep the tree/preview anchored to the originally-selected nodes even
    // while we temporarily change figma.currentPage.selection to highlight tag-target picks.
    const rootNodes = (roots && roots.length) ? roots : Array.from(figma.currentPage.selection);
    LastTreeRootIds = rootNodes.map(n => n.id);
    let total = 0;
    let truncated = false;
    const MAX_NODES = 400;
    const MAX_DEPTH = 12;

    function walkNode(node, depth) {
        try {
            if (total >= MAX_NODES) { truncated = true; return null; }
            total++;
            const childCount = node.children ? node.children.length : 0;
            const result = {
                id: node.id,
                name: node.name,
                type: node.type,
                exportAs: ClassifyNode(node),
                tags: DetectTags(node.name),
                childCount,
                children: [],
            };
            if (node.children && depth < MAX_DEPTH) {
                for (const child of node.children) {
                    if (total >= MAX_NODES) { result.truncated = true; truncated = true; break; }
                    const childResult = walkNode(child, depth + 1);
                    if (childResult) result.children.push(childResult);
                }
            } else if (node.children && depth >= MAX_DEPTH && node.children.length > 0) {
                result.truncated = true;
            }
            return result;
        } catch (e) {
            console.warn("[FTR] BuildSelectionTree node error:", e);
            return null;
        }
    }

    const nodes = [];
    for (const node of rootNodes) {
        const r = walkNode(node, 0);
        if (r) nodes.push(r);
    }

    // Build ancestors for the first selection root (walk up parent chain)
    let ancestors = [];
    const firstRoot = rootNodes[0];
    if (firstRoot) {
        let p = firstRoot.parent;
        const chain = [];
        while (p && p.type !== "PAGE" && p.type !== "DOCUMENT") {
            chain.push({ id: p.id, name: p.name });
            p = p.parent;
        }
        ancestors = chain.reverse(); // outermost first
    }

    return { nodes, total, truncated, ancestors };
}

const SendSelectionTree = Debounce(() => {
    try {
        figma.ui.postMessage({ type: "SelectionTree", tree: BuildSelectionTree() });
    } catch (e) {
        console.warn("[FTR] SendSelectionTree error:", e);
    }
}, 120);

async function BuildSelectionPreview(opts) {
    // opts: { quality?: number, scale?: number, ids?: string[] }
    //  - quality  : legacy multiplier / "this is a refit" flag (>1)
    //  - scale    : absolute export scale (px-per-node-px) requested by the zoom logic
    //  - ids      : viewport-culled subset — only re-export these roots (others keep their res)
    if (typeof opts === "number") opts = { quality: opts };   // back-compat
    opts = opts || {};
    const quality = (typeof opts.quality === "number" && opts.quality > 0) ? opts.quality : 1;
    const absScale = (typeof opts.scale === "number" && opts.scale > 0) ? opts.scale : null;
    const onlyIds = (Array.isArray(opts.ids) && opts.ids.length) ? new Set(opts.ids) : null;
    const isRefit = quality > 1 || absScale != null;
    // Anchor to explicit roots when provided (keeps the preview stable while we hijack the Figma
    // selection to highlight tag picks); otherwise follow the live selection.
    const roots = (opts.roots && opts.roots.length) ? opts.roots : figma.currentPage.selection;
    if (!roots || roots.length === 0) {
        figma.ui.postMessage({ type: "SelectionPreview", items: [], bbox: null, quality });
        return;
    }

    const MAX_PREVIEW = 20;
    const truncated = roots.length > MAX_PREVIEW;
    const selected = truncated ? Array.from(roots).slice(0, MAX_PREVIEW) : Array.from(roots);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const root of selected) {
        const abb = root.absoluteBoundingBox;
        if (!abb) continue;
        if (abb.x < minX) minX = abb.x;
        if (abb.y < minY) minY = abb.y;
        if (abb.x + abb.width  > maxX) maxX = abb.x + abb.width;
        if (abb.y + abb.height > maxY) maxY = abb.y + abb.height;
    }

    const bbox = (minX === Infinity) ? null : { x: minX, y: minY, w: maxX - minX, h: maxY - minY };

    const items = [];
    for (const root of selected) {
        const abb = root.absoluteBoundingBox;
        if (!abb) continue;
        // Viewport culling: on a targeted re-export only the visible roots are re-rendered.
        if (onlyIds && !onlyIds.has(root.id)) continue;
        try {
            const longest = Math.max(abb.width, abb.height);
            let previewScale;
            if (absScale != null) {
                // Zoom-driven re-export: use the exact requested scale (px on screen per node px).
                previewScale = absScale;
            } else {
                // Base render: ~1500px longest side; small nodes up to 4x so they aren't mushy.
                previewScale = longest > 0 ? Math.min(4, 1500 / longest) : 2;
                previewScale *= quality;
            }
            // Hard-cap the raster's longest side. The culled zoom path exports only visible roots,
            // so it can afford a larger cap (crisper) than the whole-selection base render.
            const cap = (absScale != null) ? 6144 : 3072;
            if (longest > 0) previewScale = Math.min(previewScale, cap / longest);
            if (!(previewScale > 0)) previewScale = 1;
            const bytes = await root.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: previewScale } });
            items.push({
                id: root.id,
                name: root.name,
                x: abb.x,
                y: abb.y,
                w: abb.width,
                h: abb.height,
                scale: previewScale,
                bytes,
            });
        } catch (e) {
            console.warn("[FTR] BuildSelectionPreview export error for node", root.id, e);
        }
    }

    // Build overlays: walk each selected root's subtree, collect nodes with absoluteBoundingBox
    const overlays = [];
    const WALK_CAP = 4000;          // bound total nodes visited
    const SPECIAL_CAP = 300;        // Buttons/Images/Scroll/Text — the "front" highlight boxes
    const BACK_CAP = 150;           // Frames/Backgrounds — the hatched "back" indicators
    let specialCount = 0, backCount = 0, walkedCount = 0;
    // Special types → front overlay (bordered, hover labels). Frame/Background → back overlay
    // (hatched fill + centred label, drawn BEHIND the child elements).
    const SPECIAL_TYPES = new Set(["TextLabel","TextButton","ImageLabel","ImageButton","ScrollingFrame"]);
    const BACK_TYPES = new Set(["Frame","Background"]);
    function walkOverlay(node) {
        try {
            if (walkedCount >= WALK_CAP) return;
            walkedCount++;
            const abb = node.absoluteBoundingBox;
            if (abb) {
                const t = ClassifyNode(node);
                if (SPECIAL_TYPES.has(t) && specialCount < SPECIAL_CAP) {
                    overlays.push({ id: node.id, name: node.name, x: abb.x, y: abb.y, w: abb.width, h: abb.height, type: t });
                    specialCount++;
                } else if (BACK_TYPES.has(t) && backCount < BACK_CAP) {
                    overlays.push({ id: node.id, name: node.name, x: abb.x, y: abb.y, w: abb.width, h: abb.height, type: t, back: true });
                    backCount++;
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    if (walkedCount >= WALK_CAP) break;
                    walkOverlay(child);
                }
            }
        } catch (e) {
            // skip problematic nodes
        }
    }
    // Overlays never change with zoom, and the UI's refit path ignores them — so skip the whole
    // subtree walk on any re-export. That's the expensive part and skipping it keeps zoom smooth.
    if (!isRefit) {
        for (const root of selected) {
            walkOverlay(root);
        }
    }

    // Mark refits with quality>1 so the UI applies them in place (keeping zoom/pan) instead of
    // doing a full render that resets the view.
    const outQuality = isRefit ? Math.max(2, quality) : 1;
    figma.ui.postMessage({ type: "SelectionPreview", items, bbox, truncated, overlays, quality: outQuality });
}

const SendSelectionPreview = Debounce(() => { BuildSelectionPreview(); }, 250);

// When the plugin sets the selection itself (to highlight tag picks from the tree), we don't want
// that to rebuild the tree/preview — otherwise the tree would collapse onto the picked children.
// Remember the ids we set; if the next selectionchange matches them exactly, it's our own change.
let ProgrammaticSelectionIds = null;
// Roots of the tree currently shown in the UI — lets a canvas click on a layer INSIDE
// that tree keep the view anchored (highlight + scroll to the row) instead of
// rebuilding the tree rooted at the clicked layer (which jumped the panel to the top).
let LastTreeRootIds = null;
function sameIdSet(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    const s = new Set(a);
    return b.every(id => s.has(id));
}
async function resolveNodes(ids) {
    const out = [];
    for (const id of (ids || [])) {
        const n = await figma.getNodeByIdAsync(id);
        if (n) out.push(n);
    }
    return out;
}

// Plugin-local undo/redo. We deliberately do NOT use figma.triggerUndo/Redo — that drives Figma's
// global history and yanks the selection/camera around. Instead we record just the node-name
// changes the plugin makes (tags & renames) and replay them, touching nothing else.
let PluginUndoStack = [];  // each entry: [{ id, before, after }, ...]
let PluginRedoStack = [];
const UNDO_LIMIT = 200;

function RecordChangeSet(changeMap) {
    const entries = [...changeMap.values()].filter(e => e.before !== e.after);
    if (entries.length === 0) return;
    PluginUndoStack.push(entries);
    if (PluginUndoStack.length > UNDO_LIMIT) PluginUndoStack.shift();
    PluginRedoStack = [];   // a fresh change invalidates the redo branch
}

async function UndoRedo(which, rootIds) {
    const src = which === "redo" ? PluginRedoStack : PluginUndoStack;
    const dst = which === "redo" ? PluginUndoStack : PluginRedoStack;
    const cs = src.pop();
    if (!cs) { Notify(which === "redo" ? "Nothing to redo" : "Nothing to undo"); return; }
    for (const e of cs) {
        const n = await figma.getNodeByIdAsync(e.id);
        if (n) n.name = (which === "redo") ? e.after : e.before;
    }
    dst.push(cs);
    // Refresh the plugin views from the UI's anchored roots (no Figma selection/camera change).
    const roots = (rootIds && rootIds.length) ? await resolveNodes(rootIds) : null;
    figma.ui.postMessage({ type: "SelectionTree", tree: BuildSelectionTree(roots) });
    BuildSelectionPreview(roots ? { roots } : undefined);
}

figma.on("selectionchange", () => {
    const Selection = figma.currentPage.selection;
    const curIds = Selection.map(n => n.id);
    if (ProgrammaticSelectionIds && sameIdSet(curIds, ProgrammaticSelectionIds)) {
        // Our own highlight change — leave the tree/preview anchored where they are.
        ProgrammaticSelectionIds = null;
        return;
    }
    ProgrammaticSelectionIds = null;

    // Canvas pick INSIDE the tree currently shown: keep the tree anchored on its roots,
    // just re-render with the picked layers marked so the UI can scroll to them.
    // (Also leaves the preview untouched — no zoom/view reset.)
    if (LastTreeRootIds && LastTreeRootIds.length && Selection.length > 0 && !sameIdSet(curIds, LastTreeRootIds)) {
        const RootSet = new Set(LastTreeRootIds);
        const AllInside = Selection.every((node) => {
            let p = node;
            while (p && p.type !== "PAGE" && p.type !== "DOCUMENT") {
                if (RootSet.has(p.id)) return true;
                p = p.parent;
            }
            return false;
        });

        if (AllInside) {
            resolveNodes(LastTreeRootIds).then((roots) => {
                if (!roots.length) return SendSelectionTree();
                figma.ui.postMessage({
                    type: "SelectionTree",
                    tree: BuildSelectionTree(roots),
                    canvasSelectedIds: curIds,
                });
            });
            return;
        }
    }

    SendSelectionTree();
    // Show a loading state immediately — the preview export can take a moment on
    // large/complex selections, and the debounced build runs afterwards.
    if (figma.currentPage.selection.length > 0) {
        figma.ui.postMessage({ type: "PreviewLoading" });
    }
    SendSelectionPreview();
});

// ────────────────────────────────────────────────────────────────────────────

figma.ui.onmessage = async msg => {
    switch (msg.type) {
        case "run":
            RunPlugin();
            break;
        case "AbortUpload":
            UpdateImage(undefined, true);
            break;
        case "Notify":
            if (msg.error) NotifyError(msg.message, msg.error ? { timeout: msg.timeout, error: true } : undefined);
            else Notify(msg.message);
            break;
        case "SetAsync":
            if (msg.value === null || msg.value === undefined) return;
            if (Settings[msg.key] !== undefined) Settings[msg.key] = msg.value;
            // vv DEBUGGING vv
            else if (Flags[msg.key] !== undefined) Flags[msg.key] = msg.value;

            if (msg.key == HighlightNodes.name) {
                if (msg.value === true) HighlightNodes.start()
                else HighlightNodes.stop();
            }

            if (!msg.no_save) figma.clientStorage.setAsync(msg.key, msg.value);
            break;
        case "CreatePreset":
            CreatePreset(msg.preset);
            break;
        case "RequestSelection":
            figma.ui.postMessage({ type: "SelectionTree", tree: BuildSelectionTree() });
            break;
        case "IsolateNode": {
            // Explicit "isolate" (right-click menu / badge): select AND zoom to the node.
            const n = await figma.getNodeByIdAsync(msg.id);
            if (n) {
                figma.currentPage.selection = [n];
                figma.viewport.scrollAndZoomIntoView([n]);
            }
            break;
        }
        case "SelectNodes": {
            // Highlight the tree/preview picks in the Figma canvas WITHOUT zooming and without
            // rebuilding the tree (so the tree stays anchored on the original roots).
            const nodes = await resolveNodes(msg.ids);
            ProgrammaticSelectionIds = nodes.map(n => n.id);
            try { figma.currentPage.selection = nodes; } catch (e) { ProgrammaticSelectionIds = null; }
            break;
        }
        case "ApplyTag": {
            const changes = new Map(); // id -> {id, before, after}; keeps original `before` across repeats
            const track = (node, mutate) => {
                const before = changes.has(node.id) ? changes.get(node.id).before : node.name;
                mutate();
                changes.set(node.id, { id: node.id, before, after: node.name });
            };
            for (const id of (msg.ids || [])) {
                const n = await figma.getNodeByIdAsync(id);
                if (!n) continue;
                track(n, () => ToggleTag(n, msg.tag));
                // Parent tagging is opt-in only (the UI checkbox defaults off) — a child's tag must
                // not silently change its parent's tag.
                if (msg.alsoParent && n.parent && ["GROUP","FRAME","COMPONENT","INSTANCE","COMPONENT_SET"].includes(n.parent.type)) {
                    const p = n.parent;
                    track(p, () => ToggleTag(p, msg.tag));
                }
            }
            RecordChangeSet(changes);
            // Rebuild the tree/preview from the UI's anchored roots, not the live selection.
            const roots = (msg.rootIds && msg.rootIds.length) ? await resolveNodes(msg.rootIds) : null;
            figma.ui.postMessage({ type: "SelectionTree", tree: BuildSelectionTree(roots) });
            BuildSelectionPreview(roots ? { roots } : undefined);
            break;
        }
        case "Undo":
            await UndoRedo("undo", msg.rootIds);
            break;
        case "Redo":
            await UndoRedo("redo", msg.rootIds);
            break;
        case "RequestPreview": {
            const roots = (msg.rootIds && msg.rootIds.length) ? await resolveNodes(msg.rootIds) : undefined;
            BuildSelectionPreview({ quality: msg.quality, scale: msg.scale, ids: msg.ids, roots });
            break;
        }
        case "resize":
            if (msg.width && msg.height) {
                const w = Math.max(720, Math.min(3000, Math.round(msg.width)));
                const h = Math.max(480, Math.min(2000, Math.round(msg.height)));
                figma.ui.resize(w, h);
                figma.clientStorage.setAsync("__uiSize", { width: w, height: h });
            }
            break;
        case "RenameNode":
        case "RenameNodes": {
            const ids = msg.ids || (msg.id ? [msg.id] : []);
            if (typeof msg.name === "string" && msg.name.trim() !== "") {
                const changes = new Map();
                for (const id of ids) {
                    const n = await figma.getNodeByIdAsync(id);
                    if (n) { changes.set(id, { id, before: n.name, after: msg.name }); n.name = msg.name; }
                }
                RecordChangeSet(changes);
            }
            const roots = (msg.rootIds && msg.rootIds.length) ? await resolveNodes(msg.rootIds) : null;
            figma.ui.postMessage({ type: "SelectionTree", tree: BuildSelectionTree(roots) });
            BuildSelectionPreview(roots ? { roots } : undefined);
            break;
        }
    }
}

figma.showUI(__html__, {
    width: 960,
    height: 620,
    themeColors: true
});

// Restore the user's last chosen window size (set via the resize handle).
figma.clientStorage.getAsync("__uiSize").then(sz => {
    if (sz && sz.width && sz.height) figma.ui.resize(sz.width, sz.height);
}).catch(() => {});

new Promise((resolve, reject) => {
    figma.clientStorage.keysAsync().then(Keys => {
        var Done = 0;
        var StoredSettings = Flags;

        for (const [key, value] of Object.entries(Settings)) {
            StoredSettings[key] = value;
        }

        for (var i = 0; i < Keys.length; i++) {
            const Key = Keys[i];

            figma.clientStorage.getAsync(Key).then(Value => {
                Done += 1;

                if (Value !== undefined && Value !== null && Value !== "") {
                    switch (Key) {
                        // Migrate old settings
                        case "UploadToGroup": // [TEMPORARY(?) - Migrated on 28/06/2025]
                            Flags.UploaderType = Value ? "group" : "user";
                            StoredSettings.UploaderType =  Flags.UploaderType;
                            StoredSettings[Key] = undefined;
                        // Delete unwanted settings (including old)
                        case "ForceUploadImages":
                        case "ReuploadStuckImages":
                            figma.clientStorage.deleteAsync(Key);
                            break;
                        default:
                            StoredSettings[Key] = Value;
                            if (Settings[Key] !== undefined) Settings[Key] = Value;
                            // vv DEBUGGING vv
                            else if (Flags[Key] !== undefined) Flags[Key] = Value;
                            else console.warn(`[Figma to Roblox] Unknown Settings/Flag "${Key}", value: ${Value}`)
                            break;
                    }
                }

                if (Done == Keys.length) {
                    Done = null;
                    resolve(StoredSettings);
                }
            })
        }
    })
}).then((StoredSettings) => {
    if (Flags.ShowHighlights) {
        HighlightNodes.start();
    } else {
        figma.currentPage.findAll(node => {
            if (node.name === "FigmaToRoblox_TEMP") {
                node.remove();
            }
        });
    }

    figma.ui.postMessage({
        type: "LoadSettings",
        settings: StoredSettings
    });

    // Send initial selection tree and preview
    SendSelectionTree();
    SendSelectionPreview();
});

switch (figma.command) {
    case "export":
        RunPlugin();
        break;
    case "":
        break;
    default:
        console.warn(`[Figma To Roblox] Unknown command "${figma.command}"`)
}
