const fs = require("node:fs");
const path = require("node:path");

const directory = __dirname;
const sourcePath = path.join(directory, "FigmaImageFixer.server.lua");
const outputPath = path.join(directory, "FigXporter.rbxmx");
const source = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");

function escapeXmlText(value) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\t/g, "&#9;");
}

const xml = `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
\t<External>null</External>
\t<External>nil</External>
\t<Item class="Script" referent="RBX1">
\t\t<Properties>
\t\t\t<ProtectedString name="Source">${escapeXmlText(source)}</ProtectedString>
\t\t\t<bool name="Disabled">false</bool>
\t\t\t<Content name="LinkedSource"><null></null></Content>
\t\t\t<token name="RunContext">0</token>
\t\t\t<string name="ScriptGuid">{D0A02E3D-E6C7-4A6B-8A7C-E017AD1FE221}</string>
\t\t\t<BinaryString name="AttributesSerialize"></BinaryString>
\t\t\t<SecurityCapabilities name="Capabilities">0</SecurityCapabilities>
\t\t\t<bool name="DefinesCapabilities">false</bool>
\t\t\t<string name="Name">FigXporter</string>
\t\t\t<int64 name="SourceAssetId">-1</int64>
\t\t\t<BinaryString name="Tags"></BinaryString>
\t\t</Properties>
\t</Item>
</roblox>
`;

fs.writeFileSync(outputPath, xml, "utf8");
process.stdout.write(`Built ${path.relative(process.cwd(), outputPath)} from ${path.basename(sourcePath)}\n`);
