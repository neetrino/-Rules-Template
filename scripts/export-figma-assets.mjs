#!/usr/bin/env node
/**
 * Export Figma assets (SVG/PNG) with layer names from Figma REST API.
 * Requires: FIGMA_ACCESS_TOKEN in env, Node 18+.
 *
 * Usage:
 *   node --env-file=.env scripts/export-figma-assets.mjs
 *   FIGMA_ACCESS_TOKEN=xxx node scripts/export-figma-assets.mjs
 *
 * Options (env):
 *   FIGMA_FILE_KEY   - default: 7PlNcJ5BjWztGqYNYfsH2D
 *   FIGMA_NODE_IDS   - comma-separated node IDs to export (default: 111:4293)
 *   FIGMA_OUTPUT_DIR - directory to write files (default: public/assets/figma-by-name)
 *   FIGMA_FORMAT    - svg | png (default: svg)
 */

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

const FIGMA_API = "https://api.figma.com/v1";
const FILE_KEY = process.env.FIGMA_FILE_KEY || "7PlNcJ5BjWztGqYNYfsH2D";
const NODE_IDS = (process.env.FIGMA_NODE_IDS || "111:4293").split(",").map((s) => s.trim());
const OUTPUT_DIR = process.env.FIGMA_OUTPUT_DIR || join(ROOT, "public/assets/figma-by-name");
const FORMAT = (process.env.FIGMA_FORMAT || "svg").toLowerCase();

function getToken() {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    console.error("Missing FIGMA_ACCESS_TOKEN. Set it in .env or env.");
    process.exit(1);
  }
  return token;
}

/** Sanitize layer name for filename: safe chars + extension */
function sanitizeFilename(name, extension) {
  const ext = extension === "png" ? ".png" : ".svg";
  const base = (name || "unnamed")
    .replace(/\s+/g, "-")
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unnamed";
  return base.endsWith(ext) ? base : base + ext;
}

/** Collect all node id + name from a Figma node tree (recursive). */
function collectNodes(node, list = []) {
  if (!node || !node.id) return list;
  list.push({ id: node.id, name: node.name });
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      collectNodes(child, list);
    }
  }
  return list;
}

async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status}: ${url}`);
  }
  return res.json();
}

async function main() {
  const token = getToken();
  const idsParam = NODE_IDS.join(",");

  console.log("Fetching nodes...", idsParam);
  const nodesUrl = `${FIGMA_API}/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(idsParam)}&depth=10`;
  const nodesResponse = await fetch(nodesUrl, {
    headers: { "X-Figma-Token": token },
  });
  if (!nodesResponse.ok) {
    throw new Error(`Figma nodes API ${nodesResponse.status}: ${await nodesResponse.text()}`);
  }
  const nodesData = await nodesResponse.json();

  const nodeList = [];
  for (const id of NODE_IDS) {
    const entry = nodesData.nodes?.[id];
    const doc = entry?.document;
    if (doc) {
      collectNodes(doc, nodeList);
    }
  }

  if (nodeList.length === 0) {
    console.log("No nodes found under given IDs.");
    process.exit(0);
  }

  const allIds = nodeList.map((n) => n.id).join(",");
  console.log("Requesting images for", nodeList.length, "nodes...");
  const imagesUrl = `${FIGMA_API}/images/${FILE_KEY}?ids=${encodeURIComponent(allIds)}&format=${FORMAT}`;
  const imagesData = await fetchJson(imagesUrl, token);

  const images = imagesData.images || {};
  const idToName = new Map(nodeList.map((n) => [n.id, n.name]));
  const usedNames = new Map();

  function uniqueFilename(name) {
    const file = sanitizeFilename(name, FORMAT);
    const count = usedNames.get(file) || 0;
    usedNames.set(file, count + 1);
    if (count === 0) return file;
    const base = file.replace(/\.(svg|png)$/i, "");
    const ext = FORMAT === "png" ? ".png" : ".svg";
    return `${base}_${count}${ext}`;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  let saved = 0;
  for (const [nodeId, url] of Object.entries(images)) {
    if (!url) continue;
    const name = idToName.get(nodeId) || nodeId;
    const filename = uniqueFilename(name);
    const filepath = join(OUTPUT_DIR, filename);

    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Skip download", filename, res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(filepath, buf);
    console.log("Saved:", filename);
    saved++;
  }

  console.log("Done. Saved", saved, "files to", OUTPUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
