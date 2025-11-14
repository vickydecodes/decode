#!/usr/bin/env node
/**
 * Decode CLI v3.0 — Integrated Dev + OS shortcuts
 *
 * Drop this as your CLI entry (index.js). Then:
 *   npm link
 * or
 *   npm i -g (your package)
 *
 * Now use:
 *   decode -choose
 *   decode -cwd
 *   decode -devauto
 *   decode -term
 *   decode -projects
 *   decode -killport
 *   decode -open
 *   decode -run
 * etc.
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let args = process.argv.slice(2);
const cwd = process.cwd();

const log = (s) => console.log(chalk.cyanBright(s));
const success = (s) => console.log(chalk.greenBright(`Success: ${s}`));
const warn = (s) => console.log(chalk.yellow(`Warning: ${s}`));
const err = (s) => console.log(chalk.red(`Error: ${s}`));

let pkgManager = "npm";
try {
    if (fs.existsSync("pnpm-lock.yaml")) pkgManager = "pnpm";
    else if (fs.existsSync("yarn.lock")) pkgManager = "yarn";
} catch { }

/** Run a command with shell and inherit stdio.
 *  Returns exit code.
 */
function runShell(cmd, opts = {}) {
    const res = spawnSync(cmd, { stdio: "inherit", shell: true, cwd: opts.cwd || cwd });
    if (res.error) throw res.error;
    return res.status ?? 0;
}

/** Run a command and return stdout (trimmed), no console output */
function runCapture(cmd, opts = {}) {
    const res = spawnSync(cmd, { encoding: "utf8", shell: true, cwd: opts.cwd || cwd });
    if (res.error) return "";
    return (res.stdout || "").toString().trim();
}

/* -----------------------
   Project roots (edit if you want)
   ----------------------- */
const PROJECT_ROOTS = [
    "D:\\Studies\\projects\\my_projects",
    "D:\\Studies\\projects\\cookie_projects",
    "D:\\Studies\\projects"
];

/* -------------------------------------------------------------
   Helpers: detect active Explorer / VSCode folder (Windows focused)
   ------------------------------------------------------------- */

/**
 * Try to get active Explorer folder via PowerShell COM
 * Returns path string or null
 */
function getActiveExplorerPathWindows() {
    try {
        // PowerShell one-liner: return the first File Explorer folder path
        const ps = `
$found = $null
$shell = New-Object -ComObject Shell.Application
foreach ($w in $shell.Windows()) {
    try {
        if ($w.FullName -like "*explorer.exe") {
            $p = $w.Document.Folder.Self.Path
            if ($p) { $found = $p; break }
        }
    } catch {}
}
if ($found) { Write-Output $found }
`.trim();

        const cmd = `powershell -NoProfile -Command "${ps.replace(/\n/g, ';').replace(/"/g, '\\"')}"`;
        const out = runCapture(cmd);
        return out || null;
    } catch {
        return null;
    }
}

/**
 * Get active VSCode window title via PowerShell
 * Return a cleaned folder name or null
 */
function getActiveVSCodeTitle() {
    try {
        // Get-Process code | select -first 1 MainWindowTitle
        const ps = `(Get-Process code -ErrorAction SilentlyContinue | Select-Object -First 1).MainWindowTitle`;
        const cmd = `powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`;
        let out = runCapture(cmd);
        if (!out) return null;
        out = out.replace(/ - Visual Studio Code$/, "").trim();
        return out || null;
    } catch {
        return null;
    }
}

/**
 * Try to map a VSCode title (folder name) to an actual full path by searching PROJECT_ROOTS
 * If multiple matches, prefer exact folder name match.
 */
function mapTitleToPath(title) {
    if (!title) return null;
    // if title contains path separators (rare), return as-is if exists
    if (path.isAbsolute(title) && fs.existsSync(title)) return title;

    // check each root for folder name matching the title (or title appears as last path part)
    for (const root of PROJECT_ROOTS) {
        try {
            if (!fs.existsSync(root)) continue;
            const candidates = fs.readdirSync(root).filter(d => {
                try {
                    const full = path.join(root, d);
                    return fs.statSync(full).isDirectory() && (d.toLowerCase() === title.toLowerCase() || d.toLowerCase().includes(title.toLowerCase()));
                } catch {
                    return false;
                }
            });
            if (candidates.length === 1) return path.join(root, candidates[0]);
            if (candidates.length > 1) {
                // prefer exact match
                const exact = candidates.find(c => c.toLowerCase() === title.toLowerCase());
                if (exact) return path.join(root, exact);
                // else return first
                return path.join(root, candidates[0]);
            }
        } catch { }
    }
    return null;
}

/**
 * Master: detect an "active" path using Explorer -> VSCode -> fallback cwd
 */
function detectActivePath() {
    // 1) explorer
    const explorer = getActiveExplorerPathWindows();
    if (explorer && fs.existsSync(explorer)) return explorer;
    // 2) VSCode title
    const vsTitle = getActiveVSCodeTitle();
    const vsMapped = mapTitleToPath(vsTitle);
    if (vsMapped) return vsMapped;
    // 3) fallback to cwd
    return cwd;
}

/* -------------------------------------------------------------
   OS-level / CLI commands
   ------------------------------------------------------------- */

async function main() {

    // show banner once
    if (!global.__DECODE_LOGGED__) {
        console.log(chalk.magentaBright.bold(`\nDecode CLI v3.0 — DevOS integrator\n`));
        global.__DECODE_LOGGED__ = true;
    }

    if (!args.length) return help();
    const cmd = args[0];

    try {
        if (cmd === "-v" || cmd === "--version") {
            console.log(chalk.bold("v3.0"));
            return;
        }

        async function stepNavigator(action) {
            let currentChoices = PROJECT_ROOTS.filter(r => fs.existsSync(r));
            let currentPath = null;

            while (true) {
                // Build choice list
                const dirs = currentChoices.map(p => ({
                    name: path.basename(p) || p,
                    value: p
                }));

                dirs.push(new inquirer.Separator());
                dirs.push({ name: "📁 Open Here", value: "__open" });
                dirs.push({ name: "⬅ Go Back", value: "__back" });
                dirs.push({ name: "❌ Exit", value: "__exit" });

                const { chosen } = await inquirer.prompt({
                    type: "list",
                    name: "chosen",
                    message: currentPath
                        ? `Inside: ${currentPath}\nChoose folder:`
                        : "Choose starting folder:",
                    choices: dirs,
                });

                if (chosen === "__exit") return;

                // BACK
                if (chosen === "__back") {
                    if (!currentPath) return;
                    currentPath = path.dirname(currentPath);
                    currentChoices = fs.readdirSync(currentPath)
                        .map(d => path.join(currentPath, d))
                        .filter(p => fs.statSync(p).isDirectory());
                    continue;
                }

                // OPEN
                if (chosen === "__open") {
                    if (!currentPath) {
                        warn("No path selected.");
                        return;
                    }
                    await action(currentPath);
                    return;
                }

                // Descend into chosen folder
                currentPath = chosen;

                let children = [];
                try {
                    children = fs.readdirSync(currentPath)
                        .map(x => path.join(currentPath, x))
                        .filter(p => fs.statSync(p).isDirectory());
                } catch { }

                currentChoices = children.length ? children : [];
            }
        }

        if (cmd === "-explorer") {
            return stepNavigator(async folder => {
                log(`Opening Explorer: ${folder}`);
                runShell(`explorer "${folder}"`);
                success("Opened in Explorer.");
            });
        }

        if (cmd === "-terminal") {
            return stepNavigator(async folder => {
                log(`Opening terminal: ${folder}`);
                try {
                    runShell(`wt.exe -w 0 nt -d "${folder}"`);
                } catch {
                    runShell(`start cmd /K "cd /d ${folder}"`);
                }
                success("Terminal launched.");
            });
        }

        if (cmd === "-nav") {
            return stepNavigator(async folder => {
                log(`Opening VSCode: ${folder}`);
                runShell(`code "${folder}"`);
                success("VSCode opened.");
            });
        }


        // -------------------- MONGO COMPASS --------------------
        if (cmd === "-compass") {
            const COMPASS_PATH = `C:\\Users\\DELL\\AppData\\Local\\MongoDBCompass\\MongoDBCompass.exe`;

            // 1) detect active path (Explorer → VSCode → cwd)
            const active = detectActivePath();
            log(`Active folder: ${active}`);

            const searchPaths = [
                active,
                path.join(active, "src"),
                path.join(active, "config"),
            ];

            const searchFiles = [
                ".env",
                ".env.local",
                ".env.development",
                "config.js",
                "config.json",
                "db.js",
                "database.js",
                path.join("src", "config", "db.js"),
                path.join("src", "db.js"),
            ];

            let uri = null;
            const mongoRegex = /(MONGO(DB)?_?(URI|URL)|DATABASE_URL)\s*=\s*(.+)/i;

            for (const base of searchPaths) {
                if (!fs.existsSync(base)) continue;

                for (const file of searchFiles) {
                    const full = path.join(base, file);
                    if (!fs.existsSync(full)) continue;

                    try {
                        const content = fs.readFileSync(full, "utf8").split("\n");
                        for (const line of content) {
                            const match = mongoRegex.exec(line);
                            if (match) {
                                uri = match[4].trim().replace(/['"`]/g, "");
                                break;
                            }
                        }
                        if (uri) break;
                    } catch { }
                }
                if (uri) break;
            }

            if (uri) {
                success(`MongoDB URI found: ${uri.substring(0, 40)}...`);
                success("Launching Compass with URI…");
                runShell(`"${COMPASS_PATH}" "${uri}"`);
            } else {
                warn("No MongoDB URI found — opening Compass normally.");
                runShell(`"${COMPASS_PATH}"`);
            }

            return;
        }





        // -------------------- OS / shortcut commands --------------------
        if (cmd === "-cwd") {
            const folder = detectActivePath();
            if (!folder || !fs.existsSync(folder)) {
                return warn("Could not detect an active folder.");
            }
            log(`Opening VS Code: ${folder}`);
            runShell(`code "${folder}"`);
            return;
        }

        if (cmd === "-choose") {
            // interactive list across PROJECT_ROOTS
            let choices = [];
            for (const root of PROJECT_ROOTS) {
                if (!fs.existsSync(root)) continue;
                const dirs = fs.readdirSync(root).filter(d => {
                    try { return fs.statSync(path.join(root, d)).isDirectory(); } catch { return false; }
                });
                choices = choices.concat(dirs.map(d => ({ name: `${d} — ${path.basename(root)}`, value: path.join(root, d) })));
            }
            if (!choices.length) return warn("No projects found in configured roots.");
            const { selected } = await inquirer.prompt({
                type: "list",
                name: "selected",
                message: "Select project to open:",
                choices
            });
            runShell(`code "${selected}"`);
            success(`Opened: ${selected}`);
            return;
        }

        if (cmd === "-projects") {
            log("Projects found:");
            for (const root of PROJECT_ROOTS) {
                if (!fs.existsSync(root)) continue;
                console.log(chalk.yellow(`\nFrom: ${root}`));
                const dirs = fs.readdirSync(root).filter(d => {
                    try { return fs.statSync(path.join(root, d)).isDirectory(); } catch { return false; }
                });
                dirs.forEach(d => console.log(`  ├─ ${d}`));
            }
            return;
        }

        if (cmd === "-devauto") {
            // detect active VSCode folder + run npm run dev in WT
            const vsTitle = getActiveVSCodeTitle();
            const folder = mapTitleToPath(vsTitle) || detectActivePath();
            if (!folder || !fs.existsSync(folder)) {
                return warn("No active VSCode project or folder detected.");
            }
            log(`Detected project: ${folder}`);
            // prefer wt, fallback to start cmd
            try {
                runShell(`wt.exe -w 0 nt -d "${folder}" cmd /k npm run dev`);
            } catch (e) {
                // fallback
                runShell(`start cmd /K "cd /d ${folder} && npm run dev"`);
            }
            return;
        }

        if (cmd === "-term") {
            const argPath = args[1] || detectActivePath();
            if (!argPath || !fs.existsSync(argPath)) return warn("Path not found for terminal.");
            runShell(`wt.exe -w 0 nt -d "${argPath}"`);
            success("Terminal opened");
            return;
        }

        if (cmd === "-killport") {
            // kill common dev ports
            const ports = args.length > 1 ? args.slice(1) : ["3000", "5173", "8000", "8080"];
            for (const p of ports) {
                try {
                    // PowerShell: find owning process and kill
                    const psCmd = `powershell -NoProfile -Command "try { $pid=(Get-NetTCPConnection -LocalPort ${p} -ErrorAction SilentlyContinue).OwningProcess; if ($pid) {Stop-Process -Id $pid -Force; Write-Output 'killed' } } catch {}"`;
                    const out = runCapture(psCmd);
                    if (out && out.includes("killed")) log(`Killed process on port ${p}`);
                    else warn(`No process found on port ${p}`);
                } catch (e) {
                    warn(`Failed to kill port ${p}`);
                }
            }
            return;
        }

        // -------------------- existing CLI / utilities --------------------
        if (cmd === "-choose-old") {
            // backwards-compat quick mapping to earlier behavior
            const root = "D:\\Studies\\projects";
            if (!fs.existsSync(root)) return warn("Root not found.");
            const dirs = fs.readdirSync(root).filter(f => fs.statSync(path.join(root, f)).isDirectory());
            const { selected } = await inquirer.prompt({
                type: "list",
                name: "selected",
                message: "Select a project to open:",
                choices: dirs,
            });
            const projectPath = path.join(root, selected);
            runShell(`code "${projectPath}"`);
            success("Opened: " + selected);
            return;
        }

        // --- INIT / -p / -frontend / -backend / -folders / -files / -run / -go / -plugin etc.
        // keep your existing code logic here (copied and minimally adapted)
        if (cmd === "init") {
            const cliName = args[1];
            if (!cliName) return warn("Usage: decode init <cli-name>");
            const folder = `${cliName}-cli`;
            if (fs.existsSync(folder)) return err(`Folder '${folder}' already exists.`);
            log(`Creating custom CLI: ${cliName}`);
            fs.mkdirSync(folder);
            const pkg = {
                name: cliName,
                version: "1.0.0",
                description: `${cliName} — powered by Decode`,
                bin: { [cliName]: "./index.js" },
                type: "module",
                dependencies: { chalk: "^5.3.0" },
            };
            fs.writeFileSync(path.join(folder, "package.json"), JSON.stringify(pkg, null, 2));
            const engine = generateEngine(cliName);
            fs.writeFileSync(path.join(folder, "index.js"), engine, "utf8");
            log("Installing chalk…");
            runShell(`cd "${folder}" && npm install`);
            log("Linking globally…");
            runShell(`cd "${folder}" && npm link`);
            success(`Done! Use:\n   ${chalk.bold(cliName)} -info`);
            return;
        }

        if (cmd === "-p") {
            if (args.length < 2) return warn("Usage: decode -p pkg1 pkg2…");
            const pkgs = args.slice(1).join(" ");
            log(`Installing with ${pkgManager}: ${pkgs}`);
            runShell(`${pkgManager} install ${pkgs}`);
            success("Installed.");
            return;
        }

        if (cmd === "-frontend") {
            log("Launching Vite…");
            runShell("npm create vite@latest");
            return;
        }

        if (cmd === "-backend") {
            const name = args[1] || ".";
            const target = name === "." ? cwd : path.join(cwd, name);
            if (name !== "." && !fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
            const src = path.join(target, "src");
            fs.mkdirSync(src, { recursive: true });
            const server = `import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ msg: "API ready" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server on port", PORT));
`;
            fs.writeFileSync(path.join(src, "server.js"), server);
            runShell(`cd "${target}" && npm init -y`);
            runShell(`cd "${target}" && ${pkgManager} install express cors dotenv`);
            success(`Backend ready: ${target}`);
            return;
        }

        if (cmd === "-folders") {
            if (args.length < 2) args = ["-folders", "-mrcs"];
            const arg = args[1];
            const created = [];
            if (arg.startsWith("-")) {
                const map = { m: "models", c: "controllers", r: "routes", s: "services" };
                const flags = arg.replace("-", "").split("");
                flags.forEach(f => {
                    if (map[f]) {
                        const dir = path.join(cwd, map[f]);
                        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                        created.push(map[f]);
                    }
                });
            } else {
                args.slice(1).forEach(f => {
                    const dir = path.join(cwd, f);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    created.push(f);
                });
            }
            if (created.length) success(`Created folders: ${created.join(", ")}`);
            else warn("No folders created. Use -mrcs or custom names.");
            return;
        }

        if (cmd === "-files") {
            if (args.length < 2) return warn("Usage: decode -files f1 f2…");
            args.slice(1).forEach(f => {
                const p = path.join(cwd, f);
                if (!fs.existsSync(p)) fs.writeFileSync(p, "");
                log(`Created: ${f}`);
            });
            return;
        }

        if (cmd === "-run") {
            const pkgPath = path.join(cwd, "package.json");
            if (!fs.existsSync(pkgPath)) return warn("No package.json found.");
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            const scripts = Object.keys(pkg.scripts || {});
            if (!scripts.length) return warn("No scripts found.");
            const { script } = await inquirer.prompt({
                type: "list",
                name: "script",
                message: "Run:",
                choices: scripts,
            });
            runShell(`${pkgManager} run ${script}`);
            return;
        }

        if (cmd === "-go") {
            log(`Starting with ${pkgManager}…`);
            try { runShell(`${pkgManager} run dev`); } catch { runShell(`${pkgManager} start`); }
            return;
        }

        if (cmd === "-plugin") {
            if (!args[1]) return warn("Usage: decode -plugin <name> [args…]");
            const name = args[1];
            const extra = args.slice(2);
            const paths = [path.join(cwd, "plugins", `${name}.js`), path.join(__dirname, "plugins", `${name}.js`)];
            const plugin = paths.find(p => fs.existsSync(p));
            if (!plugin) return warn(`Plugin not found: ${name}`);
            runShell(`node "${plugin}" ${extra.join(" ")}`);
            return;
        }

        if (cmd === "-open") { runShell("code ."); success("VS Code opened"); return; }

        if (cmd === "-term") {
            if (process.platform === "win32") runShell(`start cmd /K "cd /d ${cwd}"`);
            else if (process.platform === "darwin") runShell(`osascript -e 'tell app "Terminal" to do script "cd \\"${cwd}\\""'`);
            else runShell(`gnome-terminal -- bash -c "cd '${cwd}'; exec bash"`);
            return;
        }

        if (cmd === "-info") {
            log(`Dir: ${cwd}`);
            fs.readdirSync(cwd).forEach(i => console.log(`  ├─ ${i}`));
            return;
        }

        if (cmd === "-git") {
            if (fs.existsSync(".git")) return warn("Git already exists.");
            runShell("git init");
            fs.writeFileSync(".gitignore", "node_modules\n.env\ndist\n");
            success("Git + .gitignore");
            return;
        }

        if (cmd === "-env") {
            if (!fs.existsSync(".env")) fs.writeFileSync(".env", "PORT=3000\nNODE_ENV=development\n");
            if (!fs.existsSync(".env.example")) fs.writeFileSync(".env.example", "PORT=3000\nNODE_ENV=development\n");
            success(".env + .env.example");
            return;
        }

        if (cmd === "-dash") {
            log("Decode Dashboard — coming soon!");
            return;
        }

        // default
        help();
    } catch (e) {
        err(e.message || e);
        process.exit(1);
    }
}

/* -------------------------------------------------------------
   HELP
   ------------------------------------------------------------- */
function help() {
    console.log(chalk.bold("\nDecode CLI v3.0 — Commands\n"));
    const c = (cmd, desc) => console.log(`  ${chalk.cyan(cmd)} ${desc}`);
    c("decode init <name>", "Create your own CLI");
    c("decode -p pkg1 pkg2", "Install packages");
    c("decode -frontend", "Vite project");
    c("decode -backend [name]", "Express API");
    c("decode -folders -mrcs", "MVC folders (default)");
    c("decode -folders f1 f2", "Any custom folders");
    c("decode -files f1 f2", "Create files");
    c("decode -run", "Run npm script");
    c("decode -go", "Run dev/start");
    c("decode -plugin name", "Run ./plugins/name.js");
    c("decode -open", "Open VS Code (cwd)");
    c("decode -cwd", "Open active folder (Explorer or active VSCode) in VSCode");
    c("decode -choose", "Interactive project picker across your roots");
    c("decode -devauto", "Detect active VSCode project and run npm run dev (WT)");
    c("decode -term", "Open terminal in folder");
    c("decode -projects", "List projects in configured roots");
    c("decode -killport [port...]", "Kill common dev ports (Windows)");
    c("decode -info", "List folder content");
    c("decode -git", "git init + .gitignore");
    c("decode -env", "Create .env files");
    c("decode -dash", "Dashboard (soon)");
    c("decode -v", "Show version");
    console.log();
}

/* -------------------------------------------------------------
   CUSTOM CLI ENGINE (generated by `init`)
   ------------------------------------------------------------- */
function generateEngine(cliName) {
    return `#!/usr/bin/env node
import chalk from "chalk";
import { spawnSync } from "child_process";
import fs from "fs";

const CLI = "${cliName}";
const args = process.argv.slice(2);
const log = (s) => console.log(chalk.cyan(s));
const run = (cmd) => spawnSync(cmd, { stdio: "inherit", shell: true });

if (!args.length) {
  console.log("Usage: " + CLI + " -p pkg1 pkg2");
  return;
}

const cmd = args[0];

if (cmd === "-p") {
  const pkgs = args.slice(1).join(" ");
  log("Installing " + pkgs);
  run("npm install " + pkgs);
} else if (cmd === "-info") {
  log("Current folder:");
  fs.readdirSync(".").forEach(f => console.log("  - " + f));
} else {
  console.log(chalk.yellow("Unknown: " + cmd));
}
`;
}

/* -------------------------------------------------------------
   START
   ------------------------------------------------------------- */
main();
