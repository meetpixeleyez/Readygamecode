const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Copied ${src} -> ${dest}`);
}

const root = path.resolve(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

if (fs.existsSync(standaloneDir)) {
  copyRecursive(
    path.join(root, ".next", "static"),
    path.join(standaloneDir, ".next", "static")
  );
  copyRecursive(
    path.join(root, "public"),
    path.join(standaloneDir, "public")
  );
  console.log("Standalone build assets copied successfully.");
} else {
  console.log("Standalone directory not found, skipping asset copy.");
}
