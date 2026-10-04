# Figma to Roblox — Image Fixer (Studio plugin)

## Why this is needed

The Figma plugin uploads images through the Roblox **Open Cloud Assets API**, which can
only create **Decal** assets (`AssetTypeId 13`). A Decal is a *wrapper* that points at the
real **Texture** asset — and that Texture has a **different id**.

`ImageLabel.Image` does **not** reliably resolve a Decal id (`ContentProvider:PreloadAsync`
returns `Failure`), so a freshly imported GUI shows **blank/invisible** images even though:

- the upload succeeded,
- the asset exists and passed moderation,
- the `.rbxmx` is structurally correct (`Visible=true`, non-zero size, `ImageTransparency=0`).

The Figma plugin **cannot** resolve Decal → Texture by itself: the Roblox endpoint that
exposes the texture id requires authentication and is blocked by CORS from the plugin
sandbox (returns `401`). The **only** place the resolution works without extra auth is
inside Studio, via `InsertService:LoadAsset`. That's what this plugin does, in one click.

## Install (local plugin)

1. In Roblox Studio, open the **Plugins** tab → **Plugins Folder**. This opens your local
   plugins directory.
2. Copy [`FigmaImageFixer.server.lua`](FigmaImageFixer.server.lua) into that folder.
3. Back in Studio, click **Plugins Folder** is not needed again — Studio auto-loads it.
   A new **"Figma to Roblox"** toolbar with a **"Fix Images"** button appears.

> Alternatively, to build a `.rbxmx`/`.rbxm` plugin: paste the script into a `Script` inside
> Studio, right-click it → **Save as Local Plugin**.

## Usage

1. Import the `.rbxmx` produced by the Figma plugin into Studio.
2. *(Optional)* Select the imported GUI/Frame to limit the scope. With nothing selected,
   it scans all of **StarterGui**.
3. Click **Figma to Roblox → Fix Images**.

It will:
- Resolve every uploaded **Decal** id to its **Texture** id (the value `ImageLabel.Image`
  actually needs) for `ImageLabel`, `ImageButton`, `Decal` and `Texture` instances.
- Clamp any stray `ImageColor3` written as `255,255,255` back to `1,1,1`.
- Wrap everything in a single **undo** step (Ctrl+Z) and print a summary to the Output.

The operation is **idempotent** — running it again does nothing to already-fixed images.

## Note on moderation

Open Cloud uploads pass automatic moderation (usually minutes). A Decal still in
`Pending` state may briefly fail to resolve; re-run **Fix Images** once it reaches
`Completed` if any image is still blank.
