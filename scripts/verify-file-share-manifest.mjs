import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(path.join(projectRoot, "public", "file-manifest.json"), "utf8"),
);
const verificationFile = manifest.files.find(
  (entry) => entry.name === "manifest-verification.txt",
);

if (!verificationFile || verificationFile.size <= 0 || !verificationFile.sha256) {
  throw new Error("File share manifest did not include a non-empty verification file.");
}

console.log(JSON.stringify(verificationFile));
