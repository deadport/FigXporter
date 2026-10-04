# [FigXporter — Figma to Roblox FREE](https://www.figma.com/community/plugin/1649141134308228780)

If you encounter any bugs/issues please let me know through [github]((https://github.com/deadport/FigXporter))


## How to build

Install [Node.js](https://nodejs.org/), then install the project dependencies and
build the plugin bundle:

```bash
npm install
npm run build
```

Run `npm run dev` while editing `src/` to rebuild automatically.

## How to use:
1. Download this repo (**Code → Download ZIP**) or clone it with Git.
2. Run `npm install` and `npm run build`.
3. Open Figma and go to **Figma/File → Plugins → Development → Manage plugins in development**.
4. Select **Import new plugin from manifest** and choose `manifest.json`.

The Roblox Studio companion plugin is in [`studio-plugin/`](studio-plugin/), and
the optional Figma ↔ Studio bridge is documented in [`proxy/README.md`](proxy/README.md).

## Uploading Images:
1. Navigate to your [Open Cloud API Keys](https://create.roblox.com/dashboard/credentials?activeTab=ApiKeysTab) and create a new API key, or edit an existing one.
2. Add the **Assets** permission with **Read & Write** access.
3. Add your IP address to the allow list. Avoid `0.0.0.0/0` unless you understand the security implications.
4. Enter the key in the plugin's **Cloud API Key** field and enter your User ID (or Group ID when **Upload to Group** is enabled).
5. Enable **Upload Images**.

## Buttons & Scrollng Frame
For a scrollingFrame: include 'Scroll' in the name of the frame/container
For a TextButton: include 'Button' in the name of the Text element & parent group/frame (Backgrounds can be added with a child rectangle named 'Background', does not support gradients)
For a ImageButton: include 'Button' in the name of the Image

<br>

## Currently Supported:
NOTE: This might be missing some things

### Rectangle
* Background Transparency/Solid Colour
* Stroke (**ONLY** using UIStroke)
* Gradient
    * Only supports linear gradients
    * May also apply to any strokes
* Corners (in px)
* Rotation

### Ellipse
* Same properties as a Rectangle with a corner radius set to 1 scale
* Must be an even circle (height & width are the same)

### Text
* Rich Text
* Text Transparency
* Text Colour
* Text Stroke (**ONLY** using UIStroke)
    * Transparent text will not look the same when exported to roblox, as the UIStroke's border is visible inside of any semi-transparent text ([e.g.](https://cdn.thisstuff.xyz/Uploads/Figma-Invisible-Text-Example.png))
* Text Gradient
    * Only supports linear gradients
    * Will also apply to any strokes
    * Does not support Rich Text
    * Does not support Text Button
* Rotation
* Auto Resizing (?)
* Text Alignment
* Text Decoration
* Text Case
* Text Font
* Text Wrapping
* Text Truncation
* Text Button (include either "Button" or "BTN" in the name, does not support gradients)

### Images
* Image Transparency/Colour
* Text Gradient
    * Only supports linear gradients
    * Will also apply to any strokes
    * NOTE: any transparency cannot be done in figma (to my knowledge), and will likely not look the same
* Rotation
* Image Button (include either "Button" or "BTN" in the name)
* Optionally, any nodes can be exported as Images by including `IMG` in the name (not case sensitive)

### Buttons
    Both Text and Image buttons are suppported,
    rename both the Text/Image & parent (Frame, Container or Group) to include "Button" or "BTN" anywhere in the name, not case sensitive.
    if "BTN" is used it will be removed from the exported name, "Button" will not be removed.
    
    see the examples below:
![TextButton example](https://cdn.thisstuff.xyz/Uploads/Figma-TextButton-Example.png)
![ImageButton example](https://cdn.thisstuff.xyz/Uploads/Figma-ImageButton-Example.png)

### Scrolling Frame
    have "Scroll" or "SCRL" in the name, not case sensitive
    List Layouts are supported


### Images
    All nodes support this tag,
    include either "Image" or "IMG" in the name, not case sensitive

### UI List & UI Grids

<br>

## General guidance:

### Creating Frames
There are two ways to create a Roblox Frame

> #### Option 1:
> Use a Frame (<kbd>F</kbd>).

![Image Node parented to a Frame](https://cdn.thisstuff.xyz/Uploads/Figma-4K-Frame-Example.png)

> #### Option 2:
> A Rectangle/Circle/Image named "Background" inside of a Group (select Nodes(s) and <kbd>Ctrl</kbd>+<kbd>G</kbd>), the Group will receive the visual properties of Background.
> NOTE: Currently this means it is expected the Background & Group to be the same size

!["Background" Frame and Image grouped inside of Group](https://cdn.thisstuff.xyz/Uploads/Figma-FHD-Group-Example.png)
