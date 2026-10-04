--------------------------------------------------------------------
-- Smart Inspector v1.2
-- Compact, contextual property inspector. Dark, flat, dense.
-- Numeric editing: scrubbers (drag label) + steppers; sliders only
-- for properties with a clear finite range.
-- Save as Local Plugin (or drop into %LOCALAPPDATA%\Roblox\Plugins).
--------------------------------------------------------------------

if not plugin then return end -- only run as a plugin, never as a game script

local Selection = game:GetService("Selection")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local UserInputService = game:GetService("UserInputService")

--------------------------------------------------------------------
-- Theme (flat, sharp, dense)
--------------------------------------------------------------------
local C = {
	Bg        = Color3.fromRGB(30, 30, 32),
	Section   = Color3.fromRGB(37, 37, 40),
	Header    = Color3.fromRGB(46, 46, 50),
	InputBg   = Color3.fromRGB(22, 22, 24),
	Text      = Color3.fromRGB(220, 220, 224),
	SubText   = Color3.fromRGB(150, 150, 158),
	Accent    = Color3.fromRGB(60, 140, 230),
	AccentDim = Color3.fromRGB(45, 90, 140),
	SliderBar = Color3.fromRGB(55, 55, 62),
	ToggleOff = Color3.fromRGB(70, 70, 78),
	Button    = Color3.fromRGB(52, 52, 58),
	Hover     = Color3.fromRGB(64, 64, 72),
	DropBg    = Color3.fromRGB(26, 26, 28),
	ScrubHover = Color3.fromRGB(50, 50, 56),
}
local FONT = Enum.Font.Code       -- monospace: numbers align, feels like a dev tool
local FONT_BOLD = Enum.Font.GothamMedium

local ROW_H   = 18   -- standard row height
local BOX_W   = 52   -- numeric input width
local BTN_W   = 14   -- +/- stepper button width
local LABEL_W = 82   -- left label column width
local SUB_W   = 52   -- sub-label width in composite editors (X Scl, etc.)
local PX_PER_STEP = 4 -- horizontal pixels per scrub step

--------------------------------------------------------------------
-- Widget + toolbar
--------------------------------------------------------------------
local toolbar = plugin:CreateToolbar("Smart Inspector")
local toggleButton = toolbar:CreateButton("Smart Inspector", "Toggle the Smart Inspector panel", "rbxassetid://4458901886")
toggleButton.ClickableWhenViewportHidden = true

local widget = plugin:CreateDockWidgetPluginGui("SmartInspectorWidget",
	DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, true, false, 300, 500, 260, 300))
widget.Title = "Smart Inspector"

toggleButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)
widget:GetPropertyChangedSignal("Enabled"):Connect(function()
	toggleButton:SetActive(widget.Enabled)
end)
toggleButton:SetActive(widget.Enabled)

--------------------------------------------------------------------
-- Small UI factory
--------------------------------------------------------------------
local function mk(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props) do o[k] = v end
	if o:IsA("GuiObject") then
		o.BorderSizePixel = 0
	end
	o.Parent = parent
	return o
end

local root = mk("Frame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = C.Bg,
}, widget)

local headerFrame = mk("Frame", {
	Size = UDim2.new(1, 0, 0, 34),
	BackgroundColor3 = C.Header,
}, root)
local classLabel = mk("TextLabel", {
	Size = UDim2.new(1, -12, 0, 16), Position = UDim2.new(0, 6, 0, 2),
	BackgroundTransparency = 1, Font = FONT_BOLD, TextSize = 13,
	TextColor3 = C.Text, TextXAlignment = Enum.TextXAlignment.Left, Text = "",
	TextTruncate = Enum.TextTruncate.AtEnd,
}, headerFrame)
local nameLabel = mk("TextLabel", {
	Size = UDim2.new(1, -12, 0, 13), Position = UDim2.new(0, 6, 0, 18),
	BackgroundTransparency = 1, Font = FONT, TextSize = 11,
	TextColor3 = C.SubText, TextXAlignment = Enum.TextXAlignment.Left, Text = "",
	TextTruncate = Enum.TextTruncate.AtEnd,
}, headerFrame)

local scroller = mk("ScrollingFrame", {
	Size = UDim2.new(1, 0, 1, -34), Position = UDim2.new(0, 0, 0, 34),
	BackgroundTransparency = 1, ScrollBarThickness = 4,
	CanvasSize = UDim2.new(0, 0, 0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollingDirection = Enum.ScrollingDirection.Y,
}, root)
mk("UIListLayout", { Padding = UDim.new(0, 2), SortOrder = Enum.SortOrder.LayoutOrder }, scroller)
mk("UIPadding", { PaddingLeft = UDim.new(0, 2), PaddingRight = UDim.new(0, 6), PaddingTop = UDim.new(0, 2), PaddingBottom = UDim.new(0, 6) }, scroller)

local messageLabel = mk("TextLabel", {
	Size = UDim2.new(1, 0, 0, 48), BackgroundTransparency = 1,
	Font = FONT, TextSize = 12, TextColor3 = C.SubText,
	TextWrapped = true, Text = "", Visible = false,
}, scroller)

--------------------------------------------------------------------
-- Safe property access + undo helpers
--------------------------------------------------------------------
local function safeGet(instance, property)
	local ok, value = pcall(function() return instance[property] end)
	return ok, value
end

local function safeSet(instance, property, value)
	local ok = pcall(function() instance[property] = value end)
	return ok
end

local function setWaypoint(label)
	pcall(function() ChangeHistoryService:SetWaypoint(label) end)
end

-- one full undoable edit: waypoint before + after
local function recordEdit(label, fn)
	setWaypoint("SmartInspector before " .. label)
	fn()
	setWaypoint("SmartInspector " .. label)
end

--------------------------------------------------------------------
-- State
--------------------------------------------------------------------
local current = nil          -- currently inspected instance
local connections = {}       -- connections to disconnect on rebuild
local sectionOrder = 0
local rowOrder = 0

local function track(conn) table.insert(connections, conn) end

local function clearPanel()
	for _, c in ipairs(connections) do c:Disconnect() end
	table.clear(connections)
	for _, child in ipairs(scroller:GetChildren()) do
		if child:IsA("GuiObject") and child ~= messageLabel then
			child:Destroy()
		end
	end
	sectionOrder = 0
	rowOrder = 0
end

--------------------------------------------------------------------
-- Formatting / parsing / stepping
--------------------------------------------------------------------
local function fmt(n)
	if n == nil then return "0" end
	local r = math.floor(n + 0.5)
	if math.abs(n - r) < 1e-4 then return tostring(r) end
	local s = string.format("%.3f", n)
	s = s:gsub("0+$", ""):gsub("%.$", "")
	return s
end

-- opts.min / opts.max are HARD clamps (only present when the property needs them)
local function applyLimits(n, opts)
	if opts.min then n = math.max(n, opts.min) end
	if opts.max then n = math.min(n, opts.max) end
	if opts.int then n = math.floor(n + 0.5) end
	return n
end

local function parseNumber(text, opts)
	local n = tonumber(text)
	if not n then return nil end
	return applyLimits(n, opts or {})
end

local function round(n, step)
	if step and step > 0 then n = math.floor(n / step + 0.5) * step end
	return tonumber(string.format("%.4f", n))
end

-- Shift = fine, Ctrl = coarse. Falls back to normal step if UIS is unavailable.
local function currentStep(opts)
	local step = opts.step or 1
	local ok, mult = pcall(function()
		if UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) or UserInputService:IsKeyDown(Enum.KeyCode.RightShift) then
			return "fine"
		elseif UserInputService:IsKeyDown(Enum.KeyCode.LeftControl) or UserInputService:IsKeyDown(Enum.KeyCode.RightControl) then
			return "coarse"
		end
		return "normal"
	end)
	if not ok then return step end
	if mult == "fine" then return opts.fineStep or step * 0.1 end
	if mult == "coarse" then return opts.coarseStep or step * 10 end
	return step
end

-- true if MB1 is (still) held; assume held if UIS can't tell us
local function mouseStillDown()
	local ok, pressed = pcall(function()
		return UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton1)
	end)
	if not ok then return true end
	return pressed
end

--------------------------------------------------------------------
-- Core controls
--------------------------------------------------------------------
local function createSection(title)
	sectionOrder += 1
	local sec = mk("Frame", {
		Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundColor3 = C.Section, LayoutOrder = sectionOrder,
	}, scroller)
	mk("UIPadding", { PaddingLeft = UDim.new(0, 4), PaddingRight = UDim.new(0, 4), PaddingTop = UDim.new(0, 0), PaddingBottom = UDim.new(0, 4) }, sec)
	mk("UIListLayout", { Padding = UDim.new(0, 2), SortOrder = Enum.SortOrder.LayoutOrder }, sec)
	local head = mk("Frame", {
		Size = UDim2.new(1, 8, 0, 16), Position = UDim2.new(0, -4, 0, 0),
		BackgroundColor3 = C.Header, LayoutOrder = 0,
	}, sec)
	mk("TextLabel", {
		Size = UDim2.new(1, -8, 1, 0), Position = UDim2.new(0, 4, 0, 0),
		BackgroundTransparency = 1, Font = FONT_BOLD, TextSize = 11,
		TextColor3 = C.SubText, TextXAlignment = Enum.TextXAlignment.Left,
		Text = string.upper(title),
	}, head)
	return sec
end

local function newRow(section, height)
	rowOrder += 1
	return mk("Frame", {
		Size = UDim2.new(1, 0, 0, height or ROW_H),
		BackgroundTransparency = 1, LayoutOrder = rowOrder,
		ClipsDescendants = true,
	}, section)
end

-- scrub-capable labels are TextButtons so they get input + hover for free
local function rowLabel(row, text, widthPx, scrubbable)
	local class = scrubbable and "TextButton" or "TextLabel"
	local l = mk(class, {
		Size = UDim2.new(0, widthPx or LABEL_W, 1, 0), BackgroundTransparency = 1,
		Font = FONT, TextSize = 11, TextColor3 = C.SubText,
		TextXAlignment = Enum.TextXAlignment.Left, Text = text,
		TextTruncate = Enum.TextTruncate.AtEnd,
	}, row)
	if scrubbable then
		l.AutoButtonColor = false
		l.Text = text
	end
	return l
end

local function styleBox(box)
	box.BackgroundColor3 = C.InputBg
	box.Font = FONT
	box.TextSize = 11
	box.TextColor3 = C.Text
	box.ClearTextOnFocus = false
	box.ClipsDescendants = true
	box.TextXAlignment = Enum.TextXAlignment.Center
end

-- bare numeric TextBox; typed values respect hard limits only
local function numBox(parent, size, position, getValue, setValue, opts)
	opts = opts or {}
	local box = mk("TextBox", {
		Size = size, Position = position,
		Text = fmt(getValue()),
	}, parent)
	styleBox(box)
	track(box.FocusLost:Connect(function()
		local n = parseNumber(box.Text, opts)
		if n ~= nil then
			recordEdit(opts.label or "edit", function() setValue(n) end)
		end
		box.Text = fmt(getValue())
	end))
	return box
end

--------------------------------------------------------------------
-- Scrub drag: attach to a label surface. Drag right = increase.
-- From-start delta math (no per-frame accumulation), one waypoint
-- pair per drag, click-without-drag focuses the text box.
--------------------------------------------------------------------
local function attachScrub(surface, getValue, setValue, opts, refresh, focusBox)
	surface.Active = true
	local dragging = false
	local moved = false
	local startX, startValue = 0, 0
	local baseColor = surface.TextColor3

	local function setVisual(state)
		if state == "hover" then
			surface.TextColor3 = C.Text
			surface.BackgroundTransparency = 0.5
			surface.BackgroundColor3 = C.ScrubHover
		elseif state == "drag" then
			surface.TextColor3 = C.Accent
			surface.BackgroundTransparency = 0.5
			surface.BackgroundColor3 = C.ScrubHover
		else
			surface.TextColor3 = baseColor
			surface.BackgroundTransparency = 1
		end
	end

	local function endDrag()
		if not dragging then return end
		dragging = false
		setVisual("idle")
		if moved then
			setWaypoint("SmartInspector " .. (opts.label or "scrub")) -- one undo point per drag
		elseif focusBox then
			focusBox:CaptureFocus() -- plain click = jump to typing
		end
	end

	track(surface.MouseEnter:Connect(function()
		if not dragging then setVisual("hover") end
	end))
	track(surface.MouseLeave:Connect(function()
		if not dragging then setVisual("idle") end
	end))
	track(surface.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 then
			dragging = true
			moved = false
			startX = input.Position.X
			startValue = getValue() or 0
			setWaypoint("SmartInspector before " .. (opts.label or "scrub"))
			setVisual("drag")
		end
	end))
	track(root.InputChanged:Connect(function(input)
		if not dragging or input.UserInputType ~= Enum.UserInputType.MouseMovement then return end
		if not mouseStillDown() then endDrag() return end -- released outside the panel
		local delta = input.Position.X - startX
		if not moved and math.abs(delta) < 3 then return end -- dead zone: click vs drag
		moved = true
		local step = currentStep(opts)
		local steps = math.floor(delta / PX_PER_STEP + 0.5)
		local v = round(startValue + steps * step, step)
		v = applyLimits(v, opts)
		setValue(v) -- live, no waypoint spam
		if refresh then refresh() end
	end))
	track(root.InputEnded:Connect(function(input)
		if dragging and input.UserInputType == Enum.UserInputType.MouseButton1 then
			endDrag()
		end
	end))
end

--------------------------------------------------------------------
-- Scrubber unit: [-] [ input ] [+] right-aligned in the row.
-- The passed label surface becomes the drag area.
--------------------------------------------------------------------
local function scrubInput(row, labelSurface, getValue, setValue, opts)
	local box
	local function refresh()
		if box then box.Text = fmt(getValue()) end
	end

	local function stepBtn(text, dir, xOffset)
		local b = mk("TextButton", {
			Size = UDim2.new(0, BTN_W, 0, ROW_H - 2), Position = UDim2.new(1, xOffset, 0, 1),
			BackgroundColor3 = C.Button, Font = FONT, TextSize = 11,
			TextColor3 = C.SubText, Text = text,
		}, row)
		track(b.MouseEnter:Connect(function() b.BackgroundColor3 = C.Hover b.TextColor3 = C.Text end))
		track(b.MouseLeave:Connect(function() b.BackgroundColor3 = C.Button b.TextColor3 = C.SubText end))
		track(b.MouseButton1Click:Connect(function()
			local step = currentStep(opts) * dir
			recordEdit(opts.label or "step", function()
				setValue(applyLimits(round((getValue() or 0) + step, math.abs(step)), opts))
			end)
			refresh()
		end))
		return b
	end

	stepBtn("-", -1, -(BOX_W + BTN_W * 2 + 4))
	box = numBox(row, UDim2.new(0, BOX_W, 0, ROW_H - 2), UDim2.new(1, -(BOX_W + BTN_W + 2), 0, 1),
		getValue, function(n) setValue(n) refresh() end, opts)
	stepBtn("+", 1, -BTN_W)

	attachScrub(labelSurface, getValue, setValue, opts, refresh, box)
	return refresh
end

local function createNumberScrubber(section, label, getValue, setValue, opts)
	opts = opts or {}
	opts.label = opts.label or label
	local row = newRow(section)
	local l = rowLabel(row, label, LABEL_W, true)
	return scrubInput(row, l, getValue, setValue, opts)
end

--------------------------------------------------------------------
-- Slider unit: for finite ranges only. Label is also scrub-draggable.
-- opts: sliderMin, sliderMax, step, min, max, int, label
--------------------------------------------------------------------
local function sliderInput(row, labelSurface, startX, getValue, setValue, opts)
	local smin, smax, step = opts.sliderMin, opts.sliderMax, opts.step

	local bar = mk("Frame", {
		Size = UDim2.new(1, -(startX + BOX_W + 6), 0, 4),
		Position = UDim2.new(0, startX, 0.5, -2),
		BackgroundColor3 = C.SliderBar,
	}, row)
	local fill = mk("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = C.Accent }, bar)
	-- larger invisible hit area so a 4px bar is still grabbable
	local hit = mk("TextButton", {
		Size = UDim2.new(1, 0, 0, ROW_H), Position = UDim2.new(0, 0, 0.5, -ROW_H / 2),
		BackgroundTransparency = 1, Text = "",
	}, bar)

	local box
	local function refresh()
		local v = getValue() or smin
		local alpha = math.clamp((v - smin) / (smax - smin), 0, 1)
		fill.Size = UDim2.new(alpha, 0, 1, 0)
		if box then box.Text = fmt(v) end
	end

	box = numBox(row, UDim2.new(0, BOX_W, 0, ROW_H - 2), UDim2.new(1, -BOX_W, 0, 1),
		getValue, function(n) setValue(n) refresh() end, opts)

	local dragging = false
	local function applyFromX(x)
		local alpha = math.clamp((x - bar.AbsolutePosition.X) / math.max(bar.AbsoluteSize.X, 1), 0, 1)
		local v = applyLimits(round(smin + alpha * (smax - smin), step), opts)
		setValue(v) -- live, no waypoint spam
		refresh()
	end
	local function endDrag()
		if not dragging then return end
		dragging = false
		setWaypoint("SmartInspector " .. (opts.label or "slider")) -- single undo point
	end
	track(hit.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 then
			dragging = true
			setWaypoint("SmartInspector before " .. (opts.label or "slider"))
			applyFromX(input.Position.X)
		end
	end))
	track(root.InputChanged:Connect(function(input)
		if not dragging or input.UserInputType ~= Enum.UserInputType.MouseMovement then return end
		if not mouseStillDown() then endDrag() return end -- released outside the panel
		applyFromX(input.Position.X)
	end))
	track(root.InputEnded:Connect(function(input)
		if dragging and input.UserInputType == Enum.UserInputType.MouseButton1 then
			endDrag()
		end
	end))

	if labelSurface then
		attachScrub(labelSurface, getValue, setValue, opts, refresh, box)
	end
	refresh()
	return refresh
end

local function createSlider(section, label, getValue, setValue, opts)
	opts = opts or {}
	opts.label = opts.label or label
	local row = newRow(section)
	local l = rowLabel(row, label, LABEL_W, true)
	return sliderInput(row, l, LABEL_W, getValue, setValue, opts)
end

local function createTextInput(section, label, getValue, setValue)
	local row = newRow(section)
	rowLabel(row, label)
	local box = mk("TextBox", {
		Size = UDim2.new(1, -LABEL_W, 0, ROW_H - 2), Position = UDim2.new(0, LABEL_W, 0, 1),
		Text = tostring(getValue() or ""),
	}, row)
	styleBox(box)
	box.TextXAlignment = Enum.TextXAlignment.Left
	mk("UIPadding", { PaddingLeft = UDim.new(0, 4), PaddingRight = UDim.new(0, 4) }, box)
	track(box.FocusLost:Connect(function()
		recordEdit(label, function() setValue(box.Text) end)
		box.Text = tostring(getValue() or "")
	end))
	return box
end

local function createToggle(section, label, getValue, setValue)
	local row = newRow(section)
	rowLabel(row, label, 999).Size = UDim2.new(1, -44, 1, 0)
	local btn = mk("TextButton", {
		Size = UDim2.new(0, 36, 0, 14), Position = UDim2.new(1, -36, 0.5, -7),
		Font = FONT, TextSize = 10, Text = "",
	}, row)
	local function refresh()
		local on = getValue() and true or false
		btn.BackgroundColor3 = on and C.Accent or C.ToggleOff
		btn.TextColor3 = C.Text
		btn.Text = on and "ON" or "OFF"
	end
	track(btn.MouseButton1Click:Connect(function()
		recordEdit(label, function() setValue(not getValue()) end)
		refresh()
	end))
	refresh()
end

local function createButtonRow(section, buttons)
	local row = newRow(section, 16)
	local n = #buttons
	for i, def in ipairs(buttons) do
		local b = mk("TextButton", {
			Size = UDim2.new(1 / n, -2, 1, 0), Position = UDim2.new((i - 1) / n, 1, 0, 0),
			BackgroundColor3 = C.Button, Font = FONT, TextSize = 10,
			TextColor3 = C.Text, Text = def[1],
		}, row)
		track(b.MouseEnter:Connect(function() b.BackgroundColor3 = C.Hover end))
		track(b.MouseLeave:Connect(function() b.BackgroundColor3 = C.Button end))
		track(b.MouseButton1Click:Connect(function()
			recordEdit(def[1], def[2])
		end))
	end
end

--------------------------------------------------------------------
-- Composite editors: one sub-row per component.
-- fields = {{subLabel, get, set, opts}, ...}
-- opts.slider = true -> slider unit; otherwise scrubber unit.
--------------------------------------------------------------------
local function createCompositeEditor(section, label, fields)
	local head = newRow(section, 13)
	mk("TextLabel", {
		Size = UDim2.new(1, 0, 1, 0), BackgroundTransparency = 1,
		Font = FONT_BOLD, TextSize = 10, TextColor3 = C.Text,
		TextXAlignment = Enum.TextXAlignment.Left, Text = label,
		TextTruncate = Enum.TextTruncate.AtEnd,
	}, head)
	for _, f in ipairs(fields) do
		local opts = f[4]
		opts.label = label .. " " .. f[1]
		local row = newRow(section)
		local sub = rowLabel(row, f[1], SUB_W, true)
		sub.TextSize = 10
		if opts.slider then
			sliderInput(row, sub, SUB_W, f[2], f[3], opts)
		else
			scrubInput(row, sub, f[2], f[3], opts)
		end
	end
end

local function createUDim2Editor(section, label, getValue, setValue, opts)
	opts = opts or {}
	local function get() return getValue() or UDim2.new() end
	local sOpts = { step = 0.01 }
	local oOpts = { step = 1, int = true, min = opts.offsetMin, max = opts.offsetMax }
	createCompositeEditor(section, label, {
		{ "X Scl", function() return get().X.Scale end,  function(n) local v = get() setValue(UDim2.new(n, v.X.Offset, v.Y.Scale, v.Y.Offset)) end, table.clone(sOpts) },
		{ "X Off", function() return get().X.Offset end, function(n) local v = get() setValue(UDim2.new(v.X.Scale, n, v.Y.Scale, v.Y.Offset)) end, table.clone(oOpts) },
		{ "Y Scl", function() return get().Y.Scale end,  function(n) local v = get() setValue(UDim2.new(v.X.Scale, v.X.Offset, n, v.Y.Offset)) end, table.clone(sOpts) },
		{ "Y Off", function() return get().Y.Offset end, function(n) local v = get() setValue(UDim2.new(v.X.Scale, v.X.Offset, v.Y.Scale, n)) end, table.clone(oOpts) },
	})
end

local function createUDimEditor(section, label, getValue, setValue, opts)
	opts = opts or {}
	local function get() return getValue() or UDim.new() end
	createCompositeEditor(section, label, {
		{ "Scale",  function() return get().Scale end,  function(n) setValue(UDim.new(n, get().Offset)) end, { step = 0.01, min = opts.scaleMin, max = opts.scaleMax } },
		{ "Offset", function() return get().Offset end, function(n) setValue(UDim.new(get().Scale, n)) end, { step = 1, int = true, min = opts.offsetMin, max = opts.offsetMax } },
	})
end

-- Vector2 with a finite range (AnchorPoint, gradient offset) -> sliders
local function createVector2Editor(section, label, getValue, setValue, opts)
	opts = opts or {}
	local smin, smax = opts.sliderMin or 0, opts.sliderMax or 1
	local function get() return getValue() or Vector2.new() end
	local fOpts = { slider = true, sliderMin = smin, sliderMax = smax, step = 0.01, min = opts.min, max = opts.max }
	createCompositeEditor(section, label, {
		{ "X", function() return get().X end, function(n) setValue(Vector2.new(n, get().Y)) end, table.clone(fOpts) },
		{ "Y", function() return get().Y end, function(n) setValue(Vector2.new(get().X, n)) end, table.clone(fOpts) },
	})
	if opts.presets then
		createButtonRow(section, {
			{ "Top Left",  function() setValue(Vector2.new(0, 0)) end },
			{ "Center",    function() setValue(Vector2.new(0.5, 0.5)) end },
			{ "Btm Right", function() setValue(Vector2.new(1, 1)) end },
		})
	end
end

-- Vector3 (unbounded) -> scrubbers
local function createVector3Editor(section, label, getValue, setValue, opts)
	opts = opts or {}
	local function get() return getValue() or Vector3.new() end
	local fo = { step = opts.step or 1, min = opts.min, max = opts.max }
	createCompositeEditor(section, label, {
		{ "X", function() return get().X end, function(n) local v = get() setValue(Vector3.new(n, v.Y, v.Z)) end, table.clone(fo) },
		{ "Y", function() return get().Y end, function(n) local v = get() setValue(Vector3.new(v.X, n, v.Z)) end, table.clone(fo) },
		{ "Z", function() return get().Z end, function(n) local v = get() setValue(Vector3.new(v.X, v.Y, n)) end, table.clone(fo) },
	})
end

--------------------------------------------------------------------
-- Color editor: RGB sliders + hex + swatch + presets
--------------------------------------------------------------------
local COLOR_PRESETS = {
	{ "Wht", Color3.fromRGB(255, 255, 255) },
	{ "Blk", Color3.fromRGB(0, 0, 0) },
	{ "Red", Color3.fromRGB(255, 60, 60) },
	{ "Grn", Color3.fromRGB(60, 200, 90) },
	{ "Blu", Color3.fromRGB(60, 130, 255) },
	{ "Ylw", Color3.fromRGB(255, 210, 60) },
	{ "Gry", Color3.fromRGB(128, 128, 128) },
}

local function toHex(c)
	return string.format("%02X%02X%02X",
		math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5))
end

local function parseHex(s)
	s = s:gsub("#", ""):gsub("%s", "")
	if #s ~= 6 then return nil end
	local r, g, b = tonumber(s:sub(1, 2), 16), tonumber(s:sub(3, 4), 16), tonumber(s:sub(5, 6), 16)
	if r and g and b then return Color3.fromRGB(r, g, b) end
	return nil
end

local function createColor3Editor(section, label, getValue, setValue)
	local function get() return getValue() or Color3.new() end

	-- header row: label + swatch
	local head = newRow(section, 13)
	mk("TextLabel", {
		Size = UDim2.new(1, -30, 1, 0), BackgroundTransparency = 1,
		Font = FONT_BOLD, TextSize = 10, TextColor3 = C.Text,
		TextXAlignment = Enum.TextXAlignment.Left, Text = label,
		TextTruncate = Enum.TextTruncate.AtEnd,
	}, head)
	local swatch = mk("Frame", {
		Size = UDim2.new(0, 26, 0, 11), Position = UDim2.new(1, -26, 0, 1),
		BackgroundColor3 = get(),
	}, head)

	local hexBox
	local refreshers = {}
	local function refreshAll()
		swatch.BackgroundColor3 = get()
		if hexBox then hexBox.Text = toHex(get()) end
		for _, r in ipairs(refreshers) do r() end
	end

	local function channelGet(name)
		return function() return math.floor(get()[name] * 255 + 0.5) end
	end
	local function channelSet(name)
		return function(n)
			local c = get()
			local r, g, b = math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5)
			if name == "R" then r = n elseif name == "G" then g = n else b = n end
			setValue(Color3.fromRGB(math.clamp(r, 0, 255), math.clamp(g, 0, 255), math.clamp(b, 0, 255)))
			swatch.BackgroundColor3 = get()
			if hexBox then hexBox.Text = toHex(get()) end
		end
	end

	for _, name in ipairs({ "R", "G", "B" }) do
		local row = newRow(section)
		local sub = rowLabel(row, name, SUB_W, true)
		sub.TextSize = 10
		table.insert(refreshers, sliderInput(row, sub, SUB_W, channelGet(name), channelSet(name),
			{ sliderMin = 0, sliderMax = 255, step = 1, int = true, min = 0, max = 255, label = label .. " " .. name }))
	end

	-- hex row
	local hexRow = newRow(section)
	local sub = rowLabel(hexRow, "Hex", SUB_W)
	sub.TextSize = 10
	hexBox = mk("TextBox", {
		Size = UDim2.new(0, 70, 0, ROW_H - 2), Position = UDim2.new(0, SUB_W, 0, 1),
		Text = toHex(get()),
	}, hexRow)
	styleBox(hexBox)
	track(hexBox.FocusLost:Connect(function()
		local c = parseHex(hexBox.Text)
		if c then
			recordEdit(label .. " Hex", function() setValue(c) end)
		end
		refreshAll()
	end))

	-- preset swatch buttons
	local presetRow = newRow(section, 14)
	local n = #COLOR_PRESETS
	for i, def in ipairs(COLOR_PRESETS) do
		local b = mk("TextButton", {
			Size = UDim2.new(1 / n, -2, 1, 0), Position = UDim2.new((i - 1) / n, 1, 0, 0),
			BackgroundColor3 = def[2], Text = "",
		}, presetRow)
		mk("UIStroke", { Color = C.SliderBar, Thickness = 1 }, b)
		track(b.MouseButton1Click:Connect(function()
			recordEdit(label .. " preset", function() setValue(def[2]) end)
			refreshAll()
		end))
	end
end

--------------------------------------------------------------------
-- Enum dropdown: separated rows, hover highlight, selected marker
--------------------------------------------------------------------
local function createEnumDropdown(section, label, enumType, getValue, setValue)
	local row = newRow(section)
	row.AutomaticSize = Enum.AutomaticSize.Y
	row.ClipsDescendants = false
	rowLabel(row, label)
	local btn = mk("TextButton", {
		Size = UDim2.new(1, -LABEL_W, 0, ROW_H - 2), Position = UDim2.new(0, LABEL_W, 0, 1),
		BackgroundColor3 = C.InputBg, Font = FONT, TextSize = 11,
		TextColor3 = C.Text, Text = "",
		TextXAlignment = Enum.TextXAlignment.Left,
	}, row)
	mk("UIPadding", { PaddingLeft = UDim.new(0, 4) }, btn)
	local arrow = mk("TextLabel", {
		Size = UDim2.new(0, 12, 0, ROW_H - 2), Position = UDim2.new(1, -12, 0, 1),
		BackgroundTransparency = 1, Font = FONT, TextSize = 9,
		TextColor3 = C.SubText, Text = "v",
	}, row)

	local list = mk("Frame", {
		Size = UDim2.new(1, -LABEL_W, 0, 0), Position = UDim2.new(0, LABEL_W, 0, ROW_H),
		AutomaticSize = Enum.AutomaticSize.Y, BackgroundColor3 = C.DropBg, Visible = false,
	}, row)
	mk("UIStroke", { Color = C.Accent, Thickness = 1 }, list)
	mk("UIListLayout", { Padding = UDim.new(0, 1), SortOrder = Enum.SortOrder.LayoutOrder }, list)
	mk("UIPadding", { PaddingTop = UDim.new(0, 1), PaddingBottom = UDim.new(0, 1), PaddingLeft = UDim.new(0, 1), PaddingRight = UDim.new(0, 1) }, list)

	local optionButtons = {}
	local function refresh()
		local v = getValue()
		btn.Text = v and v.Name or "?"
		for name, opt in pairs(optionButtons) do
			local selected = v and v.Name == name
			opt.BackgroundColor3 = selected and C.AccentDim or C.Button
			opt.TextColor3 = selected and Color3.new(1, 1, 1) or C.Text
		end
	end
	track(btn.MouseButton1Click:Connect(function()
		list.Visible = not list.Visible
		arrow.Text = list.Visible and "^" or "v"
	end))
	local ok, items = pcall(function() return enumType:GetEnumItems() end)
	if ok then
		for order, item in ipairs(items) do
			local opt = mk("TextButton", {
				Size = UDim2.new(1, 0, 0, 17), BackgroundColor3 = C.Button,
				Font = FONT, TextSize = 11, TextColor3 = C.Text, Text = item.Name,
				TextXAlignment = Enum.TextXAlignment.Left, LayoutOrder = order,
				TextTruncate = Enum.TextTruncate.AtEnd,
			}, list)
			mk("UIPadding", { PaddingLeft = UDim.new(0, 6) }, opt)
			optionButtons[item.Name] = opt
			track(opt.MouseEnter:Connect(function()
				local v = getValue()
				if not (v and v.Name == item.Name) then opt.BackgroundColor3 = C.Hover end
			end))
			track(opt.MouseLeave:Connect(function() refresh() end))
			track(opt.MouseButton1Click:Connect(function()
				recordEdit(label, function() setValue(item) end)
				list.Visible = false
				arrow.Text = "v"
				refresh()
			end))
		end
	end
	refresh()
end

--------------------------------------------------------------------
-- Property shortcuts (bind a control straight to instance.property)
--------------------------------------------------------------------
local function getter(inst, prop)
	return function()
		local ok, v = safeGet(inst, prop)
		return ok and v or nil
	end
end
local function setter(inst, prop)
	return function(v) safeSet(inst, prop, v) end
end

local function propText(sec, inst, prop, label)     createTextInput(sec, label or prop, getter(inst, prop), setter(inst, prop)) end
local function propScrub(sec, inst, prop, label, opts) createNumberScrubber(sec, label or prop, getter(inst, prop), setter(inst, prop), opts) end
local function propSlider(sec, inst, prop, label, opts) createSlider(sec, label or prop, getter(inst, prop), setter(inst, prop), opts) end
local function propToggle(sec, inst, prop, label)   createToggle(sec, label or prop, getter(inst, prop), setter(inst, prop)) end
local function propColor(sec, inst, prop, label)    createColor3Editor(sec, label or prop, getter(inst, prop), setter(inst, prop)) end
local function propEnum(sec, inst, prop, enumType, label) createEnumDropdown(sec, label or prop, enumType, getter(inst, prop), setter(inst, prop)) end
local function propUDim(sec, inst, prop, label, opts)  createUDimEditor(sec, label or prop, getter(inst, prop), setter(inst, prop), opts) end
local function propUDim2(sec, inst, prop, label, opts) createUDim2Editor(sec, label or prop, getter(inst, prop), setter(inst, prop), opts) end
local function propV2(sec, inst, prop, label, opts) createVector2Editor(sec, label or prop, getter(inst, prop), setter(inst, prop), opts) end
local function propV3(sec, inst, prop, label, opts) createVector3Editor(sec, label or prop, getter(inst, prop), setter(inst, prop), opts) end

--------------------------------------------------------------------
-- Class builders
--------------------------------------------------------------------
local function buildIdentity(inst)
	local sec = createSection("Identity")
	propText(sec, inst, "Name")
end

local function buildGuiObject(inst)
	local layout = createSection("Layout")
	propUDim2(layout, inst, "Position")
	propUDim2(layout, inst, "Size")
	propV2(layout, inst, "AnchorPoint", "AnchorPoint", { sliderMin = 0, sliderMax = 1, presets = true })
	propSlider(layout, inst, "Rotation", nil, { sliderMin = -180, sliderMax = 180, step = 1 })
	propScrub(layout, inst, "ZIndex", nil, { step = 1, int = true })

	local app = createSection("Appearance")
	propColor(app, inst, "BackgroundColor3")
	propSlider(app, inst, "BackgroundTransparency", nil, { sliderMin = 0, sliderMax = 1, step = 0.01, min = 0, max = 1 })
	propScrub(app, inst, "BorderSizePixel", nil, { step = 1, int = true, min = 0 })
	propToggle(app, inst, "Visible")
	propToggle(app, inst, "Active")
	propToggle(app, inst, "ClipsDescendants")
end

local function buildText(inst)
	local sec = createSection("Text")
	propText(sec, inst, "Text")
	propScrub(sec, inst, "TextSize", nil, { step = 1, int = true, min = 1 })
	propColor(sec, inst, "TextColor3")
	propSlider(sec, inst, "TextTransparency", nil, { sliderMin = 0, sliderMax = 1, step = 0.01, min = 0, max = 1 })
	propToggle(sec, inst, "TextWrapped")
	propToggle(sec, inst, "TextScaled")
	propToggle(sec, inst, "RichText")
end

local function buildImage(inst)
	local sec = createSection("Image")
	propText(sec, inst, "Image")
	propColor(sec, inst, "ImageColor3")
	propSlider(sec, inst, "ImageTransparency", nil, { sliderMin = 0, sliderMax = 1, step = 0.01, min = 0, max = 1 })
	propEnum(sec, inst, "ScaleType", Enum.ScaleType)
end

local builders -- class name -> function(inst)
builders = {
	ScreenGui = function(inst)
		buildIdentity(inst)
		local sec = createSection("ScreenGui")
		propToggle(sec, inst, "Enabled")
		propToggle(sec, inst, "IgnoreGuiInset")
		propScrub(sec, inst, "DisplayOrder", nil, { step = 1, int = true })
		propEnum(sec, inst, "ZIndexBehavior", Enum.ZIndexBehavior)
	end,
	BillboardGui = function(inst)
		buildIdentity(inst)
		local sec = createSection("BillboardGui")
		propToggle(sec, inst, "Enabled")
		propToggle(sec, inst, "AlwaysOnTop")
		propUDim2(sec, inst, "Size")
		propV3(sec, inst, "StudsOffset", "StudsOffset", { step = 0.1 })
		propSlider(sec, inst, "LightInfluence", nil, { sliderMin = 0, sliderMax = 1, step = 0.01, min = 0, max = 1 })
	end,
	SurfaceGui = function(inst)
		buildIdentity(inst)
		local sec = createSection("SurfaceGui")
		propToggle(sec, inst, "Enabled")
		propToggle(sec, inst, "AlwaysOnTop")
		propEnum(sec, inst, "Face", Enum.NormalId)
		propSlider(sec, inst, "Brightness", nil, { sliderMin = 0, sliderMax = 10, step = 0.1, min = 0 })
	end,
	UICorner = function(inst)
		buildIdentity(inst)
		local sec = createSection("Corner")
		propUDim(sec, inst, "CornerRadius", "CornerRadius", { offsetMin = 0 })
		createButtonRow(sec, {
			{ "Square",  function() safeSet(inst, "CornerRadius", UDim.new(0, 0)) end },
			{ "Slight",  function() safeSet(inst, "CornerRadius", UDim.new(0, 6)) end },
			{ "Rounded", function() safeSet(inst, "CornerRadius", UDim.new(0, 12)) end },
			{ "Pill",    function() safeSet(inst, "CornerRadius", UDim.new(0.5, 0)) end },
		})
	end,
	UIStroke = function(inst)
		buildIdentity(inst)
		local sec = createSection("Stroke")
		propSlider(sec, inst, "Thickness", nil, { sliderMin = 0, sliderMax = 20, step = 0.1, min = 0 })
		propColor(sec, inst, "Color")
		propSlider(sec, inst, "Transparency", nil, { sliderMin = 0, sliderMax = 1, step = 0.01, min = 0, max = 1 })
		propToggle(sec, inst, "Enabled")
		propEnum(sec, inst, "ApplyStrokeMode", Enum.ApplyStrokeMode)
		propEnum(sec, inst, "LineJoinMode", Enum.LineJoinMode)
	end,
	UIGradient = function(inst)
		buildIdentity(inst)
		local sec = createSection("Gradient")
		propToggle(sec, inst, "Enabled")
		propSlider(sec, inst, "Rotation", nil, { sliderMin = 0, sliderMax = 360, step = 1 })
		propV2(sec, inst, "Offset", "Offset", { sliderMin = -1, sliderMax = 1 })
		mk("TextLabel", {
			Size = UDim2.new(1, 0, 0, 24), BackgroundTransparency = 1,
			Font = FONT, TextSize = 10, TextColor3 = C.SubText, TextWrapped = true,
			Text = "Color/Transparency sequences: not editable yet.",
			TextXAlignment = Enum.TextXAlignment.Left,
			LayoutOrder = 999,
		}, sec)
	end,
	UIScale = function(inst)
		buildIdentity(inst)
		local sec = createSection("Scale")
		propSlider(sec, inst, "Scale", nil, { sliderMin = 0, sliderMax = 3, step = 0.01, min = 0 })
	end,
	UIAspectRatioConstraint = function(inst)
		buildIdentity(inst)
		local sec = createSection("Aspect Ratio")
		propSlider(sec, inst, "AspectRatio", nil, { sliderMin = 0.1, sliderMax = 5, step = 0.01, min = 0.01 })
		propEnum(sec, inst, "DominantAxis", Enum.DominantAxis)
		propEnum(sec, inst, "AspectType", Enum.AspectType)
	end,
	UIPadding = function(inst)
		buildIdentity(inst)
		local sec = createSection("Padding")
		propUDim(sec, inst, "PaddingTop")
		propUDim(sec, inst, "PaddingBottom")
		propUDim(sec, inst, "PaddingLeft")
		propUDim(sec, inst, "PaddingRight")
	end,
	UIListLayout = function(inst)
		buildIdentity(inst)
		local sec = createSection("List Layout")
		propUDim(sec, inst, "Padding")
		propEnum(sec, inst, "FillDirection", Enum.FillDirection)
		propEnum(sec, inst, "HorizontalAlignment", Enum.HorizontalAlignment)
		propEnum(sec, inst, "VerticalAlignment", Enum.VerticalAlignment)
		propEnum(sec, inst, "SortOrder", Enum.SortOrder)
	end,
	UIGridLayout = function(inst)
		buildIdentity(inst)
		local sec = createSection("Grid Layout")
		propUDim2(sec, inst, "CellSize", "CellSize", { offsetMin = 0 })
		propUDim2(sec, inst, "CellPadding", "CellPadding", { offsetMin = 0 })
		propEnum(sec, inst, "FillDirection", Enum.FillDirection)
		propEnum(sec, inst, "HorizontalAlignment", Enum.HorizontalAlignment)
		propEnum(sec, inst, "VerticalAlignment", Enum.VerticalAlignment)
		propEnum(sec, inst, "SortOrder", Enum.SortOrder)
	end,
}

local function buildPart(inst)
	buildIdentity(inst)
	local tf = createSection("Transform")
	propV3(tf, inst, "Position", "Position", { step = 1 })
	propV3(tf, inst, "Size", "Size", { step = 0.1, min = 0.05 })
	propV3(tf, inst, "Orientation", "Orientation", { step = 1 })

	local app = createSection("Appearance")
	propColor(app, inst, "Color")
	propSlider(app, inst, "Transparency", nil, { sliderMin = 0, sliderMax = 1, step = 0.01, min = 0, max = 1 })
	propEnum(app, inst, "Material", Enum.Material)
	propToggle(app, inst, "Anchored")
	propToggle(app, inst, "CanCollide")
	propToggle(app, inst, "CastShadow")
end

--------------------------------------------------------------------
-- Rebuild on selection change
--------------------------------------------------------------------
local function showMessage(text)
	messageLabel.Text = text
	messageLabel.Visible = true
end

local function rebuild()
	clearPanel()
	messageLabel.Visible = false
	classLabel.Text = ""
	nameLabel.Text = ""
	current = nil

	local sel = Selection:Get()
	if #sel == 0 then
		showMessage("Select an instance to inspect.")
		return
	elseif #sel > 1 then
		showMessage("Multiple selection is not supported yet.")
		return
	end

	local inst = sel[1]
	current = inst
	classLabel.Text = inst.ClassName
	nameLabel.Text = inst.Name

	local ok, err = pcall(function()
		if builders[inst.ClassName] then
			builders[inst.ClassName](inst)
		elseif inst:IsA("GuiObject") then
			buildIdentity(inst)
			buildGuiObject(inst)
			if inst:IsA("TextLabel") or inst:IsA("TextButton") or inst:IsA("TextBox") then
				buildText(inst)
			end
			if inst:IsA("ImageLabel") or inst:IsA("ImageButton") then
				buildImage(inst)
			end
			if inst:IsA("ScrollingFrame") then
				local sec = createSection("Scrolling")
				propUDim2(sec, inst, "CanvasSize", "CanvasSize", { offsetMin = 0 })
				propScrub(sec, inst, "ScrollBarThickness", nil, { step = 1, int = true, min = 0 })
				propToggle(sec, inst, "ScrollingEnabled")
			end
		elseif inst:IsA("BasePart") then
			buildPart(inst)
		else
			buildIdentity(inst)
			showMessage("No dedicated controls for " .. inst.ClassName .. " yet. Name editing is available above.")
		end
	end)
	if not ok then
		showMessage("Failed to build inspector: " .. tostring(err))
	end

	-- keep the header name in sync while renaming elsewhere
	track(inst:GetPropertyChangedSignal("Name"):Connect(function()
		nameLabel.Text = inst.Name
	end))
	track(inst.AncestryChanged:Connect(function(_, parent)
		if parent == nil and current == inst then
			rebuild() -- instance deleted
		end
	end))
end

Selection.SelectionChanged:Connect(rebuild)
rebuild()
