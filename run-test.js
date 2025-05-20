const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const logFile = "./test.log";

// Clean the log file before each run
function cleanLogsAndLogFolders() {
  // Clear log file
  fs.writeFileSync(logFile, "");

  // Remove all subfolders in 'out' except the latest 10
  const outDir = path.join(__dirname, "out");
  if (fs.existsSync(outDir)) {
    // Get all subfolders with names matching YYYYMMDD
    const folders = fs
      .readdirSync(outDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d{8}$/.test(entry.name))
      .map((entry) => entry.name);

    // Sort folder names descending (latest first)
    folders.sort((a, b) => b.localeCompare(a));

    // Keep the latest 10 folders, remove the rest
    const toRemove = folders.slice(10);

    for (const folder of toRemove) {
      fs.rmSync(path.join(outDir, folder), { recursive: true, force: true });
    }
  }
}

// Clean before each run
cleanLogsAndLogFolders();

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
}

const child = spawn("git stash && git pull && git stash pop && npm i && npm run test", { shell: true });

const logStream = fs.createWriteStream(logFile, { flags: "a" });
child.stdout.pipe(process.stdout);
child.stdout.pipe(logStream);
child.stderr.pipe(process.stderr);
child.stderr.pipe(logStream);

child.on("close", (code) => {
  logStream.write(`Process exited with code ${code}\n`);
  logStream.end();
  process.exit(code);
});
