import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sharedFilesDirectory = path.join(projectRoot, "public", "file");
const manifestPath = path.join(projectRoot, "public", "file-manifest.json");

function toWebPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

async function getDirectoryEntries(relativePath = "") {
  const directoryPath = path.join(sharedFilesDirectory, relativePath);
  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  const visibleEntries = directoryEntries
    .filter((entry) => !entry.name.startsWith("."))
    .sort((first, second) => first.name.localeCompare(second.name, "zh-Hant"));

  return Promise.all(
    visibleEntries.map(async (entry) => {
      const childRelativePath = path.join(relativePath, entry.name);
      const childPath = path.join(sharedFilesDirectory, childRelativePath);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: toWebPath(childRelativePath),
          type: "directory",
          children: await getDirectoryEntries(childRelativePath),
        };
      }

      if (!entry.isFile()) {
        return null;
      }

      const [fileStats, fileContents] = await Promise.all([stat(childPath), readFile(childPath)]);
      return {
        name: entry.name,
        path: toWebPath(childRelativePath),
        type: "file",
        size: fileStats.size,
        sha256: createHash("sha256").update(fileContents).digest("hex"),
      };
    }),
  ).then((entries) => entries.filter(Boolean));
}

async function generateManifest() {
  await mkdir(sharedFilesDirectory, { recursive: true });
  const files = await getDirectoryEntries();
  await writeFile(manifestPath, `${JSON.stringify({ files }, null, 2)}\n`, "utf8");
  console.log(`Generated file manifest with ${files.length} root item(s).`);
}

generateManifest().catch((error) => {
  console.error("Failed to generate file manifest:", error);
  process.exitCode = 1;
});
