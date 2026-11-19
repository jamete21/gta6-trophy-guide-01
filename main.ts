// Leonida Trophy Atlas — entry program (Node 22, standard library only).
// The guide is plain static files in app/: index.html, its styles, its ES
// modules and app/data/trophies.json. It loads nothing over the network.
// This program hands the guide in: it copies app/ and screenshots/ beside
// this file into /output (or MAKEFUN_OUTPUT_DIR outside the grader) and
// writes /output/dossier.json with the vendored make.fun library.
// vendor/makefun-frontend.ts is the kit's copy and stays byte-identical.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function copyInto(target, source) {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyInto(join(outputDir, "app"), join(repoRoot, "app"));
copyInto(join(outputDir, "screenshots"), join(repoRoot, "screenshots"));

// The scorer's own caps: text_max_bytes shapes the dossier text; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots, one
// over 256 KiB, app/ over 993 files or 48 MiB).
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
