#!/usr/bin/env node
/**
 * For GitHub Enterprise Pages when only "branch + /(root) or /docs" is available
 * (no Actions tab). Builds static export with the correct basePath and copies to docs/.
 *
 * Then: commit + push docs/, set Settings → Pages → Branch fdeandrade, Folder /docs
 */
import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BASE = "/pages/fdeandrade/agentic-marketing-studio";

const env = {
  ...process.env,
  NEXT_PUBLIC_BASE_PATH: BASE,
  NEXT_STATIC_EXPORT: "1",
};

execSync("npm run build", { stdio: "inherit", env });

rmSync("docs", { recursive: true, force: true });
mkdirSync("docs", { recursive: true });
cpSync("out", "docs", { recursive: true });
writeFileSync("docs/.nojekyll", "");

// GitHub Enterprise Pages returns 404 for paths with no static file (e.g. dynamic
// /projects/[id]). Serving the app shell as 404.html lets the client router handle the URL.
const indexHtml = readFileSync("docs/index.html", "utf8");
writeFileSync("docs/404.html", indexHtml);

console.log("\nDone. Next steps:");
console.log("  1. git add docs && git commit -m \"chore: publish Pages to docs\" && git push");
console.log("  2. Repo Settings → Pages → Branch: fdeandrade  Folder: /docs\n");
