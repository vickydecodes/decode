#!/usr/bin/env node
/**
 * Decode CLI v0.0.5 — Minimal + Smart CLI Generator
 *
 * Core: decode init <name> → your own global CLI
 * Smart -folders: -mrcs (default) OR any custom names
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { fileURLToPath } from "url";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);
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

function runSync(cmd, opts = {}) {
    const [command, ...cArgs] = cmd.split(" ");
    const res = spawnSync(command, cArgs, {
        stdio: "inherit",
        shell: true,
        cwd: opts.cwd || cwd,
        ...opts,
    });
    if (res.error) throw res.error;
    return res.status ?? 0;
}

/* -------------------------------------------------------------
   MAIN
   ------------------------------------------------------------- */
async function main() {
    
// Show banner only on the first command in a session
if (!global.__DECODE_LOGGED__) {
    console.log(chalk.magentaBright.bold(`\nDecode CLI v0.0.7 — Smart Dev CLI + Generator\n`));
    global.__DECODE_LOGGED__ = true;
}

    if (!args.length) return help();

    const cmd = args[0];

    try {
        // --- VERSION / HELP ---
        if (cmd === "-v" || cmd === "--version") {
            console.log(chalk.bold("v0.0.7"));
            return;
        }
        if (cmd === "-h" || cmd === "--help") return help();

        // --- INIT: CREATE CUSTOM CLI ---
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
            fs.writeFileSync(
                path.join(folder, "package.json"),
                JSON.stringify(pkg, null, 2)
            );

            const engine = generateEngine(cliName);
            fs.writeFileSync(path.join(folder, "index.js"), engine, "utf8");

            log("Installing chalk…");
            runSync("npm install", { cwd: folder });

            log("Linking globally…");
            runSync("npm link", { cwd: folder });

            success(`Done! Use:\n   ${chalk.bold(cliName)} -info`);
            return;
        }

        // --- PACKAGE INSTALL ---
        if (cmd === "-p") {
            if (args.length < 2) return warn("Usage: decode -p pkg1 pkg2…");
            const pkgs = args.slice(1).join(" ");
            log(`Installing with ${pkgManager}: ${pkgs}`);
            runSync(`${pkgManager} install ${pkgs}`);
            success("Installed.");
            return;
        }

        // --- FRONTEND ---
        if (cmd === "-frontend") {
            log("Launching Vite…");
            runSync("npm create vite@latest");
            return;
        }

        // --- BACKEND ---
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
app.listen(PORT, () => console.log("Server on port", PORT));\n`;

            fs.writeFileSync(path.join(src, "server.js"), server);
            runSync(`cd "${target}" && npm init -y`);
            runSync(`cd "${target}" && ${pkgManager} install express cors dotenv`);
            success(`Backend ready: ${target}`);
            return;
        }

        // --- FOLDERS: SMART MODE ---
        if (cmd === "-folders") {
            if (args.length < 2) {
                // Default: -mrcs
                args = ["-folders", "-mrcs"];
            }

            const arg = args[1];
            const created = [];

            if (arg.startsWith("-")) {
                // --- Default MVC mode ---
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
                // --- Custom folder names ---
                args.slice(1).forEach(f => {
                    const dir = path.join(cwd, f);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    created.push(f);
                });
            }

            if (created.length) {
                success(`Created folders: ${created.join(", ")}`);
            } else {
                warn("No folders created. Use -mrcs or custom names.");
            }
            return;
        }

        // --- FILES ---
        if (cmd === "-files") {
            if (args.length < 2) return warn("Usage: decode -files f1 f2…");
            args.slice(1).forEach(f => {
                const p = path.join(cwd, f);
                if (!fs.existsSync(p)) fs.writeFileSync(p, "");
                log(`Created: ${f}`);
            });
            return;
        }

        // --- RUN SCRIPT ---
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
            runSync(`${pkgManager} run ${script}`);
            return;
        }

        // --- GO ---
        if (cmd === "-go") {
            log(`Starting with ${pkgManager}…`);
            try {
                runSync(`${pkgManager} run dev`);
            } catch {
                runSync(`${pkgManager} start`);
            }
            return;
        }

        // --- PLUGIN ---
        if (cmd === "-plugin") {
            if (!args[1]) return warn("Usage: decode -plugin <name> [args…]");
            const name = args[1];
            const extra = args.slice(2);
            const paths = [
                path.join(cwd, "plugins", `${name}.js`),
                path.join(__dirname, "plugins", `${name}.js`),
            ];
            const plugin = paths.find(p => fs.existsSync(p));
            if (!plugin) return warn(`Plugin not found: ${name}`);
            runSync(`node "${plugin}" ${extra.join(" ")}`);
            return;
        }

        // --- OPEN / TERM / INFO ---
        if (cmd === "-open") { runSync("code ."); success("VS Code opened"); return; }
        if (cmd === "-term") {
            if (process.platform === "win32")
                runSync(`start cmd /K "cd /d ${cwd}"`);
            else if (process.platform === "darwin")
                runSync(`osascript -e 'tell app "Terminal" to do script "cd \\"${cwd}\\""'`);
            else
                runSync(`gnome-terminal -- bash -c "cd '${cwd}'; exec bash"`);
            return;
        }
        if (cmd === "-info") {
            log(`Dir: ${cwd}`);
            fs.readdirSync(cwd).forEach(i => console.log(`  ├─ ${i}`));
            return;
        }

        // --- GIT ---
        if (cmd === "-git") {
            if (fs.existsSync(".git")) return warn("Git already exists.");
            runSync("git init");
            fs.writeFileSync(".gitignore", "node_modules\n.env\ndist\n");
            success("Git + .gitignore");
            return;
        }

        // --- ENV ---
        if (cmd === "-env") {
            if (!fs.existsSync(".env")) fs.writeFileSync(".env", "PORT=3000\nNODE_ENV=development\n");
            if (!fs.existsSync(".env.example")) fs.writeFileSync(".env.example", "PORT=3000\nNODE_ENV=development\n");
            success(".env + .env.example");
            return;
        }

        // --- DASH ---
        if (cmd === "-dash") {
            log("Decode Dashboard — coming soon!");
            return;
        }

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
    console.log(chalk.bold("\nDecode CLI v2.2.0 — Commands\n"));
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
    c("decode -open", "Open VS Code");
    c("decode -term", "Open terminal");
    c("decode -info", "List folder");
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