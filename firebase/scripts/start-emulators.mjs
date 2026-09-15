import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const projectId = "demo-bytebank";
const configPath = fileURLToPath(new URL("../firebase.json", import.meta.url));
const exportDirectory = fileURLToPath(
  new URL("../.emulator-data", import.meta.url),
);
const exportMetadata = fileURLToPath(
  new URL("../.emulator-data/firebase-export-metadata.json", import.meta.url),
);
const freshStart = process.argv.includes("--fresh");
const authOnly = process.argv.includes("--auth-only");
const require = createRequire(import.meta.url);
const firebaseCliPath = require.resolve("firebase-tools/lib/bin/firebase.js");

const args = [
  "emulators:start",
  "--config",
  configPath,
  "--project",
  projectId,
  "--only",
  authOnly ? "auth" : "auth,firestore,storage",
  "--export-on-exit",
  exportDirectory,
];

if (!freshStart && existsSync(exportMetadata)) {
  args.push("--import", exportDirectory);
}

const emulatorProcess = spawn(process.execPath, [firebaseCliPath, ...args], {
  stdio: "inherit",
  windowsHide: true,
});

emulatorProcess.on("error", (error) => {
  console.error(`Unable to start Firebase emulators: ${error.message}`);
  process.exitCode = 1;
});

emulatorProcess.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
