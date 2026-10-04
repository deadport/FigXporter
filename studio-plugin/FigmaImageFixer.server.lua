--!nonstrict
-- Figma to Roblox — Studio bridge + Image Fixer
--
-- WHAT THIS DOES:
--   * "Pull from Figma": fetches the .rbxmx that the Figma plugin pushed to the
--     Cloudflare Worker bridge (/bridge/:code), rebuilds it as real instances under
--     StarterGui (or the current selection), then runs the image fix automatically.
--   * "Fix Images": resolves uploaded Decal ids to their Texture ids (and corrects
--     0-255 ImageColor3 values) so imported images render. Run it on its own after a
--     manual .rbxmx import.
--
-- WHY THE XML PARSER:
--   Roblox gives plugins no API to deserialize an .rbxmx STRING into instances
--   (game:GetObjects only takes asset urls). HttpService can fetch the string, so the
--   bridge has to parse the exporter's XML and build the instances itself. The parser
--   below only needs to understand the handful of property element forms this specific
--   exporter emits.
--
-- WHY DECAL -> TEXTURE:
--   The Open Cloud Assets API can only create Decal assets (a wrapper pointing at the
--   real Texture, which has a DIFFERENT id). ImageLabel.Image does not resolve a Decal
--   id, so images show blank. InsertService:LoadAsset (Studio-only) exposes the inner
--   Texture id; that resolution can only happen here.

local HttpService = game:GetService("HttpService")
local InsertService = game:GetService("InsertService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local StarterGui = game:GetService("StarterGui")

--------------------------------------------------------------------------------
-- Toolbar + dock widget
--------------------------------------------------------------------------------

local toolbar = plugin:CreateToolbar("FigXporter")

-- Single toolbar button — toggles the dock widget.
local mainButton = toolbar:CreateButton(
	"FigXporter",
	"Open the FigXporter panel",
	"rbxassetid://127759244827527"
)

local widget = plugin:CreateDockWidgetPluginGui(
	"FigmaToRoblox_Bridge",
	DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Float, false, false, 260, 300, 230, 280)
)
widget.Title = "FigXporter"

local frame = Instance.new("Frame")
frame.Size = UDim2.fromScale(1, 1)
frame.BackgroundColor3 = Color3.fromRGB(10, 10, 15)
frame.BorderSizePixel = 0
frame.Parent = widget

local frameCorner = Instance.new("UICorner")
frameCorner.CornerRadius = UDim.new(0, 8)
frameCorner.Parent = frame

local frameStroke = Instance.new("UIStroke")
frameStroke.Color = Color3.fromRGB(40, 40, 52)
frameStroke.Thickness = 1
frameStroke.Parent = frame

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 6)
layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
layout.VerticalAlignment = Enum.VerticalAlignment.Top
-- Order children by LayoutOrder, NOT by Name (default would sort TextBox/TextButton/TextLabel alphabetically).
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = frame

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 12)
padding.PaddingLeft = UDim.new(0, 12)
padding.PaddingRight = UDim.new(0, 12)
padding.Parent = frame

-- Worker URL field (persisted)
local workerLabel = Instance.new("TextLabel")
workerLabel.Size = UDim2.new(1, 0, 0, 16)
workerLabel.BackgroundTransparency = 1
workerLabel.Text = "Worker URL"
workerLabel.TextColor3 = Color3.fromRGB(160, 160, 171)
workerLabel.TextXAlignment = Enum.TextXAlignment.Left
workerLabel.Font = Enum.Font.GothamMedium
workerLabel.TextSize = 14
workerLabel.LayoutOrder = 1
workerLabel.Parent = frame

local workerBox = Instance.new("TextBox")
workerBox.Size = UDim2.new(1, 0, 0, 26)
workerBox.PlaceholderText = "https://<name>.workers.dev"
workerBox.Text = plugin:GetSetting("FTR_WorkerUrl") or ""
workerBox.TextColor3 = Color3.fromRGB(232, 232, 236)
workerBox.PlaceholderColor3 = Color3.fromRGB(107, 107, 118)
workerBox.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
workerBox.BorderSizePixel = 0
workerBox.ClearTextOnFocus = false
workerBox.Font = Enum.Font.Gotham
workerBox.TextSize = 14
workerBox.TextXAlignment = Enum.TextXAlignment.Left
workerBox.ClipsDescendants = true
workerBox.LayoutOrder = 2
workerBox.Parent = frame

local workerBoxCorner = Instance.new("UICorner")
workerBoxCorner.CornerRadius = UDim.new(0, 6)
workerBoxCorner.Parent = workerBox

local workerBoxStroke = Instance.new("UIStroke")
workerBoxStroke.Color = Color3.fromRGB(40, 40, 52)
workerBoxStroke.Thickness = 1
workerBoxStroke.Parent = workerBox

workerBox.FocusLost:Connect(function()
	plugin:SetSetting("FTR_WorkerUrl", workerBox.Text)
end)

-- Session Code field (persisted)
local codeLabel = Instance.new("TextLabel")
codeLabel.Size = UDim2.new(1, 0, 0, 16)
codeLabel.BackgroundTransparency = 1
codeLabel.Text = "Session Code"
codeLabel.TextColor3 = Color3.fromRGB(160, 160, 171)
codeLabel.TextXAlignment = Enum.TextXAlignment.Left
codeLabel.Font = Enum.Font.GothamMedium
codeLabel.TextSize = 14
codeLabel.LayoutOrder = 3
codeLabel.Parent = frame

local codeBox = Instance.new("TextBox")
codeBox.Size = UDim2.new(1, 0, 0, 26)
codeBox.PlaceholderText = "e.g. mygame"
codeBox.Text = plugin:GetSetting("FTR_BridgeCode") or ""
codeBox.TextColor3 = Color3.fromRGB(232, 232, 236)
codeBox.PlaceholderColor3 = Color3.fromRGB(107, 107, 118)
codeBox.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
codeBox.BorderSizePixel = 0
codeBox.ClearTextOnFocus = false
codeBox.Font = Enum.Font.Gotham
codeBox.TextSize = 16
codeBox.TextXAlignment = Enum.TextXAlignment.Left
codeBox.ClipsDescendants = true
codeBox.LayoutOrder = 4
codeBox.Parent = frame

local codeBoxCorner = Instance.new("UICorner")
codeBoxCorner.CornerRadius = UDim.new(0, 6)
codeBoxCorner.Parent = codeBox

local codeBoxStroke = Instance.new("UIStroke")
codeBoxStroke.Color = Color3.fromRGB(40, 40, 52)
codeBoxStroke.Thickness = 1
codeBoxStroke.Parent = codeBox

codeBox.FocusLost:Connect(function()
	plugin:SetSetting("FTR_BridgeCode", codeBox.Text)
end)

-- Divider between the input fields and the action buttons
local divider = Instance.new("Frame")
divider.Size = UDim2.new(1, 0, 0, 1)
divider.BackgroundColor3 = Color3.fromRGB(40, 40, 52)
divider.BorderSizePixel = 0
divider.LayoutOrder = 5
divider.Parent = frame

-- Toggle: shift pulled top-level frames so the group's top-left sits at (0,0).
-- Figma top-level page frames keep their absolute canvas offset (often off-screen);
-- this brings them back on-screen while preserving their relative layout.
local recenterEnabled = (plugin:GetSetting("FTR_Recenter") ~= false)

local recenterButton = Instance.new("TextButton")
recenterButton.Size = UDim2.new(1, 0, 0, 22)
recenterButton.TextColor3 = Color3.fromRGB(160, 160, 171)
recenterButton.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
recenterButton.BorderSizePixel = 0
recenterButton.Font = Enum.Font.Gotham
recenterButton.TextSize = 14
recenterButton.LayoutOrder = 6
recenterButton.Parent = frame

local recenterCorner = Instance.new("UICorner")
recenterCorner.CornerRadius = UDim.new(0, 6)
recenterCorner.Parent = recenterButton

local recenterStroke = Instance.new("UIStroke")
recenterStroke.Color = Color3.fromRGB(40, 40, 52)
recenterStroke.Thickness = 1
recenterStroke.Parent = recenterButton

local function refreshRecenterText()
	recenterButton.Text = "Recenter roots: " .. (recenterEnabled and "On" or "Off")
end
refreshRecenterText()

recenterButton.MouseButton1Click:Connect(function()
	recenterEnabled = not recenterEnabled
	plugin:SetSetting("FTR_Recenter", recenterEnabled)
	refreshRecenterText()
end)

recenterButton.MouseEnter:Connect(function()
	recenterButton.BackgroundColor3 = Color3.fromRGB(34, 34, 46)
	recenterButton.TextColor3 = Color3.fromRGB(232, 232, 236)
end)
recenterButton.MouseLeave:Connect(function()
	recenterButton.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
	recenterButton.TextColor3 = Color3.fromRGB(160, 160, 171)
end)

local pullDockButton = Instance.new("TextButton")
pullDockButton.Size = UDim2.new(1, 0, 0, 28)
pullDockButton.Text = "Pull from Figma"
pullDockButton.TextColor3 = Color3.fromRGB(10, 10, 15)
pullDockButton.BackgroundColor3 = Color3.fromRGB(245, 158, 11)
pullDockButton.BorderSizePixel = 0
pullDockButton.Font = Enum.Font.GothamBold
pullDockButton.TextSize = 16
pullDockButton.LayoutOrder = 7
pullDockButton.Parent = frame

local pullDockCorner = Instance.new("UICorner")
pullDockCorner.CornerRadius = UDim.new(0, 6)
pullDockCorner.Parent = pullDockButton

pullDockButton.MouseEnter:Connect(function()
	pullDockButton.BackgroundColor3 = Color3.fromRGB(251, 176, 52)
end)
pullDockButton.MouseLeave:Connect(function()
	pullDockButton.BackgroundColor3 = Color3.fromRGB(245, 158, 11)
end)

-- Fix Images button (secondary style, matches recenterButton)
local fixDockButton = Instance.new("TextButton")
fixDockButton.Size = UDim2.new(1, 0, 0, 22)
fixDockButton.Text = "Fix Images"
fixDockButton.TextColor3 = Color3.fromRGB(160, 160, 171)
fixDockButton.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
fixDockButton.BorderSizePixel = 0
fixDockButton.Font = Enum.Font.Gotham
fixDockButton.TextSize = 14
fixDockButton.LayoutOrder = 8
fixDockButton.Parent = frame

local fixDockCorner = Instance.new("UICorner")
fixDockCorner.CornerRadius = UDim.new(0, 6)
fixDockCorner.Parent = fixDockButton

local fixDockStroke = Instance.new("UIStroke")
fixDockStroke.Color = Color3.fromRGB(40, 40, 52)
fixDockStroke.Thickness = 1
fixDockStroke.Parent = fixDockButton

fixDockButton.MouseEnter:Connect(function()
	fixDockButton.BackgroundColor3 = Color3.fromRGB(34, 34, 46)
	fixDockButton.TextColor3 = Color3.fromRGB(232, 232, 236)
end)
fixDockButton.MouseLeave:Connect(function()
	fixDockButton.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
	fixDockButton.TextColor3 = Color3.fromRGB(160, 160, 171)
end)

--------------------------------------------------------------------------------
-- Progress UI (status text + bar) — shown during Pull / Fix
--------------------------------------------------------------------------------

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, 0, 0, 14)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = ""
statusLabel.TextColor3 = Color3.fromRGB(160, 160, 171)
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.TextTruncate = Enum.TextTruncate.AtEnd
statusLabel.Font = Enum.Font.Gotham
statusLabel.TextSize = 12
statusLabel.LayoutOrder = 9
statusLabel.Visible = false
statusLabel.Parent = frame

local progressBar = Instance.new("Frame")
progressBar.Size = UDim2.new(1, 0, 0, 5)
progressBar.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
progressBar.BorderSizePixel = 0
progressBar.LayoutOrder = 10
progressBar.Visible = false
progressBar.Parent = frame

local progressBarCorner = Instance.new("UICorner")
progressBarCorner.CornerRadius = UDim.new(1, 0)
progressBarCorner.Parent = progressBar

local progressFill = Instance.new("Frame")
progressFill.Size = UDim2.fromScale(0, 1)
progressFill.BackgroundColor3 = Color3.fromRGB(245, 158, 11)
progressFill.BorderSizePixel = 0
progressFill.Parent = progressBar

local progressFillCorner = Instance.new("UICorner")
progressFillCorner.CornerRadius = UDim.new(1, 0)
progressFillCorner.Parent = progressFill

-- Update the status line + bar. `fraction` in [0,1] or nil for indeterminate (full bar).
-- We yield a frame so Studio actually repaints between the (blocking) image resolves.
local function setStatus(text, fraction, colour)
	statusLabel.Visible = true
	progressBar.Visible = true
	statusLabel.Text = text
	progressFill.BackgroundColor3 = colour or Color3.fromRGB(245, 158, 11)
	progressFill.Size = UDim2.fromScale(fraction == nil and 1 or math.clamp(fraction, 0, 1), 1)
	task.wait()
end

local function hideStatus(finalText, colour)
	if finalText then
		statusLabel.Text = finalText
		statusLabel.TextColor3 = colour or Color3.fromRGB(160, 160, 171)
		progressFill.Size = UDim2.fromScale(1, 1)
		progressFill.BackgroundColor3 = colour or Color3.fromRGB(52, 211, 153)
		task.delay(4, function()
			statusLabel.Visible = false
			progressBar.Visible = false
			statusLabel.TextColor3 = Color3.fromRGB(160, 160, 171)
		end)
	else
		statusLabel.Visible = false
		progressBar.Visible = false
	end
end

--------------------------------------------------------------------------------
-- XML parser (generic -> tree of { tag, attrs, children })
--------------------------------------------------------------------------------

local function decodeEntities(s)
	if not s or s == "" then return s end
	s = s:gsub("&#(%d+);", function(n) return utf8.char(tonumber(n)) end)
	s = s:gsub("&lt;", "<"):gsub("&gt;", ">"):gsub("&quot;", "\""):gsub("&apos;", "'")
	s = s:gsub("&amp;", "&")
	return s
end

-- Returns a list of top-level nodes. Each node: { tag, attrs = {}, children = {}, text }
-- Text-only content is stored on node.text; element children are in node.children.
local function parseXML(xml)
	local pos = 1
	local len = #xml

	local function parseNodes(stopTag)
		local nodes = {}

		while pos <= len do
			local lt = xml:find("<", pos, true)
			if not lt then break end

			-- text between elements
			if lt > pos then
				local text = xml:sub(pos, lt - 1)
				if text:match("%S") then
					nodes._text = (nodes._text or "") .. decodeEntities(text)
				end
			end
			pos = lt

			-- comments
			if xml:sub(pos, pos + 3) == "<!--" then
				local fin = xml:find("-->", pos, true)
				pos = (fin and fin + 3) or (len + 1)
			-- CDATA
			elseif xml:sub(pos, pos + 8) == "<![CDATA[" then
				local fin = xml:find("]]>", pos, true)
				local data = xml:sub(pos + 9, (fin or len) - 1)
				nodes._text = (nodes._text or "") .. data
				pos = (fin and fin + 3) or (len + 1)
			-- closing tag
			elseif xml:sub(pos, pos + 1) == "</" then
				local fin = xml:find(">", pos, true)
				local name = xml:sub(pos + 2, (fin or len) - 1):match("^%s*(.-)%s*$")
				pos = (fin and fin + 1) or (len + 1)
				if stopTag and name == stopTag then
					return nodes
				end
				-- mismatched close; ignore and continue
			-- declaration / processing instruction
			elseif xml:sub(pos, pos + 1) == "<?" then
				local fin = xml:find("?>", pos, true)
				pos = (fin and fin + 2) or (len + 1)
			-- opening tag
			else
				local fin = xml:find(">", pos, true)
				if not fin then break end
				local raw = xml:sub(pos + 1, fin - 1)
				local selfClosing = raw:sub(-1) == "/"
				if selfClosing then raw = raw:sub(1, -2) end

				local tag = raw:match("^([%w_:%-]+)")
				local node = { tag = tag, attrs = {}, children = {} }
				for k, v in raw:gmatch("([%w_:%-]+)%s*=%s*\"([^\"]*)\"") do
					node.attrs[k] = decodeEntities(v)
				end

				pos = fin + 1

				if not selfClosing then
					local inner = parseNodes(tag)
					node.text = inner._text
					inner._text = nil
					node.children = inner
				end

				table.insert(nodes, node)
			end
		end

		return nodes
	end

	return parseNodes(nil)
end

--------------------------------------------------------------------------------
-- Property element -> Luau value
--------------------------------------------------------------------------------

local function childTagText(node, tag)
	for _, c in ipairs(node.children) do
		if c.tag == tag then return c.text end
	end
	return nil
end

local function num(s) return tonumber(s) or 0 end

-- Pull all whitespace-separated numbers out of a node's text (for sequences).
local function numbers(text)
	local out = {}
	for n in tostring(text or ""):gmatch("[-%d%.eE+]+") do
		out[#out + 1] = tonumber(n)
	end
	return out
end

local function clamp01(value)
	value = tonumber(value) or 0
	if value < 0 then return 0 end
	if value > 1 then return 1 end
	return value
end

local function normaliseColorKeypoints(keypoints)
	if #keypoints == 0 then return keypoints end

	table.sort(keypoints, function(a, b)
		return a.Time < b.Time
	end)

	if keypoints[1].Time ~= 0 then
		table.insert(keypoints, 1, ColorSequenceKeypoint.new(0, keypoints[1].Value))
	end

	local last = keypoints[#keypoints]
	if last.Time ~= 1 then
		keypoints[#keypoints + 1] = ColorSequenceKeypoint.new(1, last.Value)
	end

	return keypoints
end

local function normaliseNumberKeypoints(keypoints)
	if #keypoints == 0 then return keypoints end

	table.sort(keypoints, function(a, b)
		return a.Time < b.Time
	end)

	if keypoints[1].Time ~= 0 then
		table.insert(keypoints, 1, NumberSequenceKeypoint.new(0, keypoints[1].Value))
	end

	local last = keypoints[#keypoints]
	if last.Time ~= 1 then
		keypoints[#keypoints + 1] = NumberSequenceKeypoint.new(1, last.Value)
	end

	return keypoints
end

local function readValue(node)
	local tag = node.tag

	if tag == "string" or tag == "ProtectedString" or tag == "BinaryString" then
		return node.text or ""
	elseif tag == "int" or tag == "int64" then
		return math.floor(num(node.text))
	elseif tag == "float" or tag == "double" then
		return num(node.text)
	elseif tag == "token" then
		return math.floor(num(node.text)) -- enum properties accept their integer value
	elseif tag == "bool" then
		return (node.text == "true")
	elseif tag == "Content" then
		return childTagText(node, "url") or ""
	elseif tag == "Vector2" then
		return Vector2.new(num(childTagText(node, "X")), num(childTagText(node, "Y")))
	elseif tag == "Vector3" then
		return Vector3.new(num(childTagText(node, "X")), num(childTagText(node, "Y")), num(childTagText(node, "Z")))
	elseif tag == "UDim2" then
		return UDim2.new(
			num(childTagText(node, "XS")), num(childTagText(node, "XO")),
			num(childTagText(node, "YS")), num(childTagText(node, "YO"))
		)
	elseif tag == "UDim" then
		return UDim.new(num(childTagText(node, "S")), num(childTagText(node, "O")))
	elseif tag == "Color3" then
		return Color3.new(num(childTagText(node, "R")), num(childTagText(node, "G")), num(childTagText(node, "B")))
	elseif tag == "Rect2D" then
		local mn, mx
		for _, c in ipairs(node.children) do
			if c.tag == "min" then mn = c elseif c.tag == "max" then mx = c end
		end
		if mn and mx then
			return Rect.new(
				num(childTagText(mn, "X")), num(childTagText(mn, "Y")),
				num(childTagText(mx, "X")), num(childTagText(mx, "Y"))
			)
		end
	elseif tag == "NumberSequence" then
		local n = numbers(node.text)
		local kp = {}
		local i = 1
		while i + 1 <= #n do
			kp[#kp + 1] = NumberSequenceKeypoint.new(clamp01(n[i]), clamp01(n[i + 1]))
			i = i + 3 -- time, value, envelope
		end
		if #kp >= 1 then return NumberSequence.new(normaliseNumberKeypoints(kp)) end
	elseif tag == "ColorSequence" then
		local n = numbers(node.text)
		local kp = {}
		local i = 1
		while i + 3 <= #n do
			kp[#kp + 1] = ColorSequenceKeypoint.new(
				clamp01(n[i]),
				Color3.new(clamp01(n[i + 1]), clamp01(n[i + 2]), clamp01(n[i + 3]))
			)
			i = i + 5 -- time, r, g, b, envelope
		end
		if #kp >= 1 then return ColorSequence.new(normaliseColorKeypoints(kp)) end
	elseif tag == "Font" then
		-- The exporter serialises <Family><url>rbxasset://…</url></Family>, so the family lives in
		-- a nested <url> element, not as Family's direct text. Reading it as text (the old code)
		-- always failed, so EVERY imported text silently fell back to LegacyArial.
		local familyNode
		for _, c in ipairs(node.children) do
			if c.tag == "Family" then familyNode = c break end
		end
		local family = familyNode and (childTagText(familyNode, "url") or familyNode.text) or nil

		if family and family:match("rbxasset") then
			-- Weight is written as a number (e.g. 700); map it to the closest Enum.FontWeight so
			-- variable-font weights (e.g. 450) still land on the nearest supported step instead of
			-- silently reverting to Regular.
			local weightNum = tonumber(childTagText(node, "Weight")) or 400
			local weightEnum = Enum.FontWeight.Regular
			local bestDelta = math.huge
			for _, w in ipairs(Enum.FontWeight:GetEnumItems()) do
				local delta = math.abs(w.Value - weightNum)
				if delta < bestDelta then bestDelta = delta weightEnum = w end
			end
			local styleEnum = (childTagText(node, "Style") == "Italic")
				and Enum.FontStyle.Italic or Enum.FontStyle.Normal

			local ok, font = pcall(function() return Font.new(family, weightEnum, styleEnum) end)
			if ok and font then return font end
		end
	end

	return nil -- unknown / unsupported property type; skip it
end

--------------------------------------------------------------------------------
-- Build instances from the parsed tree
--------------------------------------------------------------------------------

-- Some property names from the rbxmx don't map 1:1 to assignable Lua properties.
local SKIP_PROPS = {
	-- (none currently; placeholder for future quirks)
}

local function buildItem(itemNode)
	local class = itemNode.attrs.class
	if not class then return nil end

	local ok, instance = pcall(Instance.new, class)
	if not ok or not instance then
		warn("[Figma to Roblox] Unknown class '" .. tostring(class) .. "', skipping")
		return nil
	end

	for _, child in ipairs(itemNode.children) do
		if child.tag == "Properties" then
			for _, prop in ipairs(child.children) do
				local name = prop.attrs.name
				if name and not SKIP_PROPS[name] then
					local value = readValue(prop)
					if value ~= nil then
						pcall(function() instance[name] = value end)
					end
				end
			end
		elseif child.tag == "Item" then
			local sub = buildItem(child)
			if sub then sub.Parent = instance end
		end
	end

	return instance
end

--------------------------------------------------------------------------------
-- Image fix (Decal -> Texture, ImageColor3 0-255 -> 0-1)
--------------------------------------------------------------------------------

local function extractId(content)
	if typeof(content) == "Instance" then return nil end
	local str = tostring(content)
	return tonumber(str:match("%d+"))
end

local resolveCache = {}

local function resolveTexture(decalId)
	if resolveCache[decalId] ~= nil then return resolveCache[decalId] end

	local ok, model = pcall(function() return InsertService:LoadAsset(decalId) end)
	if not ok or not model then
		resolveCache[decalId] = false
		return false
	end

	local texture = false
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("Decal") and d.Texture and d.Texture ~= "" then
			texture = extractId(d.Texture)
			break
		end
	end
	model:Destroy()

	resolveCache[decalId] = texture or false
	return resolveCache[decalId]
end

local function imagePropFor(instance)
	if instance:IsA("ImageLabel") or instance:IsA("ImageButton") then
		return "Image"
	elseif instance:IsA("Decal") or instance:IsA("Texture") then
		return "Texture"
	end
	return nil
end

local function processInstance(instance, counters)
	local prop = imagePropFor(instance)
	if prop then
		local id = extractId(instance[prop])
		if id then
			local texture = resolveTexture(id)
			if texture then
				instance[prop] = "rbxassetid://" .. texture
				counters.converted += 1
			else
				counters.skipped += 1
			end
		end
	end

	if instance:IsA("ImageLabel") or instance:IsA("ImageButton") then
		local c = instance.ImageColor3
		if c.R > 1 or c.G > 1 or c.B > 1 then
			instance.ImageColor3 = Color3.new(
				math.clamp(c.R / 255, 0, 1),
				math.clamp(c.G / 255, 0, 1),
				math.clamp(c.B / 255, 0, 1)
			)
			counters.colourFixed += 1
		end
	end
end

-- The exporter ships a "FTR_StrokeScaler" LocalScript with any UI that uses UIStroke:
-- Thickness is the one GUI property with no Scale component, so it must be rescaled to
-- the UI's real size. LocalScripts only run in play mode, so at import we apply the same
-- logic here (and keep it live while Studio is open) — otherwise the edit-mode / device
-- emulator preview shows design-px outlines that look too thick or too thin.
local function applyStrokeScaling(root)
	local scaler, heightValue
	for _, d in ipairs(root:GetDescendants()) do
		if d:IsA("LocalScript") and d.Name == "FTR_StrokeScaler" then
			scaler = d
		elseif d:IsA("NumberValue") and d.Name == "FTR_DesignHeight" then
			heightValue = d
		end
	end
	if not scaler then return end

	-- Prefer the NumberValue: reading scaler.Source needs the Script Injection permission
	-- and silently fails without it. The Source regex stays as a fallback for old exports.
	local designHeight = heightValue and heightValue.Value or nil
	if not designHeight then
		local ok, src = pcall(function() return scaler.Source end)
		if ok then designHeight = tonumber(src:match("DESIGN_HEIGHT%s*=%s*([%d%.]+)")) end
	end
	if not designHeight or designHeight <= 0 then return end

	local guiRoot = scaler.Parent
	if not (guiRoot and guiRoot:IsA("GuiObject")) then return end

	local function apply()
		local factor = guiRoot.AbsoluteSize.Y / designHeight
		if factor <= 0 then return end
		for _, s in ipairs(guiRoot:GetDescendants()) do
			if s:IsA("UIStroke") then
				-- Same attribute the runtime script uses, so both stay idempotent.
				local design = s:GetAttribute("FTR_DesignThickness")
				if not design then
					design = s.Thickness
					s:SetAttribute("FTR_DesignThickness", design)
				end
				s.Thickness = design * factor
			end
		end
	end

	guiRoot:GetPropertyChangedSignal("AbsoluteSize"):Connect(apply)
	apply()
end

-- Shift a group of root GuiObjects so the top-left of their combined bounding box
-- sits at (0, 0). Relative layout between roots is preserved; only the shared
-- absolute offset (the Figma canvas position) is removed so nothing lands off-screen.
local function recenterRoots(roots)
	local minX, minY = math.huge, math.huge
	for _, r in ipairs(roots) do
		if r:IsA("GuiObject") then
			minX = math.min(minX, r.Position.X.Offset)
			minY = math.min(minY, r.Position.Y.Offset)
		end
	end
	if minX == math.huge then return end

	for _, r in ipairs(roots) do
		if r:IsA("GuiObject") then
			local p = r.Position
			r.Position = UDim2.new(p.X.Scale, p.X.Offset - minX, p.Y.Scale, p.Y.Offset - minY)
		end
	end
end

-- Runs the fix over a set of root instances (their descendants included).
-- onProgress(done, total) is called after each image instance is resolved so the UI can update.
local function fixRoots(roots, onProgress)
	local counters = { converted = 0, colourFixed = 0, skipped = 0 }

	-- Flatten everything so we can measure how many image instances there are (for the bar).
	local all = {}
	for _, root in ipairs(roots) do
		all[#all + 1] = root
		for _, d in ipairs(root:GetDescendants()) do all[#all + 1] = d end
	end

	local total = 0
	for _, inst in ipairs(all) do
		local prop = imagePropFor(inst)
		if prop and extractId(inst[prop]) then total += 1 end
	end

	local done = 0
	for _, inst in ipairs(all) do
		local prop = imagePropFor(inst)
		local hasImage = prop and extractId(inst[prop]) ~= nil
		processInstance(inst, counters)
		if hasImage then
			done += 1
			if onProgress then onProgress(done, total) end
		end
	end
	return counters
end

--------------------------------------------------------------------------------
-- Actions
--------------------------------------------------------------------------------

local function fixSelectionOrStarterGui()
	local roots = Selection:Get()
	if #roots == 0 then roots = { StarterGui } end

	setStatus("Fixing images…", nil)
	local recording = ChangeHistoryService:TryBeginRecording("FigmaToRoblox_FixImages")
	local counters = fixRoots(roots, function(done, total)
		setStatus(string.format("Loading images %d/%d…", done, total), total > 0 and (done / total) or 1)
	end)

	-- Also rescale UIStroke thickness — lets "Fix Images" double as a manual
	-- re-apply after changing the device emulator resolution.
	for _, r in ipairs(roots) do
		if r == StarterGui then
			for _, sg in ipairs(StarterGui:GetChildren()) do
				for _, c in ipairs(sg:GetChildren()) do pcall(applyStrokeScaling, c) end
			end
		else
			pcall(applyStrokeScaling, r)
		end
	end

	if recording then
		ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
	end

	hideStatus(string.format("✓ Fixed %d image(s)", counters.converted))

	print(string.format(
		"[Figma to Roblox] Fixed images: %d Decal->Texture, %d colour(s), %d skipped.",
		counters.converted, counters.colourFixed, counters.skipped
	))
end

local function pullFromFigma()
	local base = workerBox.Text:gsub("%s+", ""):gsub("/+$", "")
	if base == "" then
		warn("[Figma to Roblox] Set your Worker URL first (deploy your own Cloudflare Worker).")
		return
	end
	if not base:match("^https?://") then base = "https://" .. base end

	local code = codeBox.Text:gsub("%s+", "")
	if code == "" then
		warn("[Figma to Roblox] Enter a Session Code first (must match the Figma plugin).")
		return
	end

	setStatus("Fetching from Figma…", nil)

	local ok, body = pcall(function()
		return HttpService:GetAsync(base .. "/bridge/" .. HttpService:UrlEncode(code))
	end)

	if not ok then
		hideStatus()
		local msg = tostring(body)
		if msg:match("404") then
			warn("[Figma to Roblox] Nothing waiting for code '" .. code .. "'. Export from Figma first (with Send to Studio enabled).")
		elseif msg:match("Http requests are not enabled") or msg:match("HttpEnabled") then
			warn("[Figma to Roblox] Enable HTTP: Game Settings -> Security -> Allow HTTP Requests.")
		else
			warn("[Figma to Roblox] Pull failed: " .. msg)
		end
		return
	end

	setStatus("Building instances…", nil)
	local tree = parseXML(body)

	-- Find the <roblox> root, then its top-level <Item> children.
	local robloxNode
	for _, n in ipairs(tree) do
		if n.tag == "roblox" then robloxNode = n break end
	end
	if not robloxNode then
		hideStatus()
		warn("[Figma to Roblox] Pulled data was not a valid Roblox export.")
		return
	end

	local parent = Selection:Get()[1] or StarterGui

	local recording = ChangeHistoryService:TryBeginRecording("FigmaToRoblox_Pull")
	local created = {}
	for _, n in ipairs(robloxNode.children) do
		if n.tag == "Item" then
			local instance = buildItem(n)
			if instance then
				instance.Parent = parent
				created[#created + 1] = instance
			end
		end
	end

	-- Bring off-screen top-level frames back into view (preserves relative layout).
	if recenterEnabled then
		recenterRoots(created)
	end

	-- Resolve images on what we just built (the slow part — report progress per image).
	local counters = fixRoots(created, function(done, total)
		setStatus(string.format("Loading images %d/%d…", done, total), total > 0 and (done / total) or 1)
	end)

	-- Scale UIStroke thickness to the current viewport (edit-mode stand-in for FTR_StrokeScaler).
	for _, r in ipairs(created) do
		pcall(applyStrokeScaling, r)
	end

	if recording then
		ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
	end

	if #created > 0 then
		Selection:Set(created)
	end

	hideStatus(string.format("✓ Pulled %d root(s) · %d images", #created, counters.converted))

	print(string.format(
		"[Figma to Roblox] Pulled %d root(s) into %s. Images: %d Decal->Texture, %d colour(s), %d skipped.",
		#created, parent:GetFullName(), counters.converted, counters.colourFixed, counters.skipped
	))
end

--------------------------------------------------------------------------------
-- Wire up
--------------------------------------------------------------------------------

local function safe(fn)
	return function()
		local ok, err = pcall(fn)
		if not ok then warn("[Figma to Roblox] " .. tostring(err)) end
	end
end

mainButton.Click:Connect(function()
	mainButton:SetActive(false)
	widget.Enabled = not widget.Enabled
end)

pullDockButton.MouseButton1Click:Connect(safe(pullFromFigma))
fixDockButton.MouseButton1Click:Connect(safe(fixSelectionOrStarterGui))
