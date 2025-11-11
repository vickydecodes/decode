#!/usr/bin/env node
/**
 * Decode CLI — Developer Utility + CLI Generator by Vicky 🚀
 *
 * Features:
 *  decode init <cli-name>  -> create your own CLI from this engine
 *  -p pkg1 pkg2...         -> npm install packages
 *  -frontend               -> run `npm create vite@latest`
 *  -backend [name]         -> scaffold express backend
 *  -folders -mcrs          -> create models/controllers/routes/services
 *  -files f1 f2 ...        -> create files
 *  -run                    -> choose and run npm script
 *  -go                     -> run npm run dev || npm start
 *  -plugin <name>          -> run plugin from ./plugins
 *  -open                   -> open in VS Code
 *  -term                   -> open terminal
 *  -info                   -> show folder info
 *  -dash                   -> dashboard placeholder
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const cwd = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = (s) => console.log(chalk.cyanBright(s));
const warn = (s) => console.log(chalk.yellow(s));
const err = (s) => console.log(chalk.red(s));

function runSync(cmd, opts = {}) {
    const res = spawnSync(cmd, { stdio: "inherit", shell: true, ...opts });
    if (res.error) throw res.error;
    return res.status ?? 0;
}

async function main() {
    console.log(
        chalk.magentaBright.bold(
            `\n🧩 Decode CLI — Vicky's Developer Utility (v1.0.0)\n`
        )
    );

    if (!args.length) return help();

    const cmd = args[0];

    // 🧠 === INIT COMMAND ===
    if (cmd === "init") {
        const cliName = args[1];
        if (!cliName) {
            warn("Usage: decode init <cli-name>");
            return;
        }

        const folder = `${cliName}-cli`;
        if (fs.existsSync(folder)) {
            err(`❌ Folder '${folder}' already exists.`);
            return;
        }

        log(`🚀 Creating new CLI: ${cliName}`);
        fs.mkdirSync(folder);

        const pkg = {
            name: cliName,
            version: "1.0.0",
            description: `${cliName} — custom CLI powered by Decode`,
            bin: { [cliName]: "./index.js" },
            type: "module",
            dependencies: { chalk: "^5.3.0", inquirer: "^9.2.7" },
        };

        fs.writeFileSync(
            path.join(folder, "package.json"),
            JSON.stringify(pkg, null, 2)
        );

        // generate engine with custom CLI name
        const engineCode = generateEngine(cliName);
        fs.writeFileSync(path.join(folder, "index.js"), engineCode, "utf8");

        log("📦 Installing dependencies...");
        runSync("npm install", { cwd: folder });

        log("🔗 Linking CLI globally...");
        runSync("npm link", { cwd: folder });

        console.log(chalk.greenBright(`✅ Done! You can now use:`));
        console.log(chalk.bold(`   ${cliName} -info`));
        return;
    }

    // ============ EXISTING DECODE COMMANDS =============
    try {
        if (cmd === "-p") {
            if (args.length < 2)
                return warn("Usage: decode -p package1 package2 ...");
            const pkgs = args.slice(1).join(" ");
            log(`📦 Installing packages: ${pkgs}`);
            runSync(`npm install ${pkgs}`);
            log("✅ Packages installed.");
            return;
        }

        if (cmd === "-frontend") {
            log("🚀 Launching official Vite setup (npm create vite@latest)");
            runSync("npm create vite@latest");
            return;
        }

        if (cmd === "-backend") {
            const projectName = args[1] || ".";
            const target = projectName === "." ? cwd : path.join(cwd, projectName);

            if (projectName !== "." && !fs.existsSync(target))
                fs.mkdirSync(target, { recursive: true });

            log(`🧱 Creating backend scaffold in ${target}`);
            const srcDir = path.join(target, "src");
            if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

            const serverJs = `import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("API running 🚀"));
app.listen(PORT, () => console.log("Server running on port", PORT));\n`;

            fs.writeFileSync(path.join(srcDir, "server.js"), serverJs, "utf8");

            log("⚙️ Initializing npm project...");
            runSync(`cd "${target}" && npm init -y`);
            log("📦 Installing express cors dotenv...");
            runSync(`cd "${target}" && npm install express cors dotenv`);
            log(`✅ Backend ready! cd "${target}" && decode -go`);
            return;
        }

       if (cmd === "-folders") {
    const map = {
        m: "models",
        c: "controllers",
        r: "routes",
        s: "services",
    };

    const arg = args[1] || "";

    if (!arg) {
        warn("Usage: decode -folders -mcrs (or any combo, e.g. -mc, -rs)");
        return;
    }

    if (!arg.startsWith("-")) {
        warn("Invalid flag. Try: decode -folders -mcrs");
        return;
    }

    const flags = arg.replace("-", "").split("");
    const created = [];

    flags.forEach((f) => {
        const folder = map[f];
        if (folder) {
            const p = path.join(cwd, folder);
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
            created.push(folder);
        }
    });

    if (created.length > 0) {
        log(`📁 Created folders: ${created.join(", ")}`);
    } else {
        warn("⚠️ No valid flags provided. Use combinations like -mc or -mcrs.");
    }

    return;
}


        if (cmd === "-files") {
            if (args.length < 2) return warn("Usage: decode -files f1 f2 ...");
            args.slice(1).forEach((f) => {
                const p = path.join(cwd, f);
                if (!fs.existsSync(p)) fs.writeFileSync(p, "", "utf8");
                log(`📝 Created file: ${f}`);
            });
            return;
        }

        if (cmd === "-run") {
            const pkgPath = path.join(cwd, "package.json");
            if (!fs.existsSync(pkgPath)) return warn("No package.json found.");
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            const scripts = Object.keys(pkg.scripts || {});
            if (!scripts.length) return warn("No npm scripts found.");
            const { script } = await inquirer.prompt({
                type: "list",
                name: "script",
                message: "Choose script to run",
                choices: scripts,
            });
            runSync(`npm run ${script}`);
            return;
        }

        if (cmd === "-go") {
            log("⚡ Running npm run dev || npm start");
            try {
                runSync("npm run dev");
            } catch {
                runSync("npm start");
            }
            return;
        }

        if (cmd === "-plugin") {
            if (!args[1]) return warn("Usage: decode -plugin <name>");
            const pluginName = args[1];
            const pluginPath = [
                path.join(cwd, "plugins", `${pluginName}.js`),
                path.join(__dirname, "plugins", `${pluginName}.js`),
            ].find((p) => fs.existsSync(p));
            if (!pluginPath) return warn(`Plugin not found: ${pluginName}`);
            log(`🔌 Running plugin ${pluginName}`);
            runSync(`node "${pluginPath}"`);
            return;
        }

        if (cmd === "-open") {
            runSync("code .");
            log("💻 VS Code opened.");
            return;
        }

        if (cmd === "-term") {
            if (process.platform === "win32")
                runSync(`start cmd.exe /K "cd /d ${cwd}"`);
            else if (process.platform === "darwin")
                runSync(
                    `osascript -e 'tell app "Terminal" to do script \"cd ${cwd}\"'`
                );
            else
                runSync(`bash -lc "gnome-terminal -- bash -c 'cd ${cwd}; exec bash'"`);
            return;
        }

        if (cmd === "-info") {
            log(`📂 Current Directory: ${cwd}`);
            fs.readdirSync(cwd).forEach((i) => console.log("  - " + i));
            return;
        }

        if (cmd === "-dash") {
            log("🧭 Decode Dashboard placeholder — coming soon!");
            return;
        }

        help();
    } catch (e) {
        err("Error: " + (e.message || e));
    }
}

function help() {
    console.log(chalk.bold("\nDecode CLI — Commands\n"));
    console.log(
        "  decode init <cli-name>     Create your own CLI (powered by Decode)"
    );
    console.log("  decode -p pkg1 pkg2...     Install npm packages");
    console.log("  decode -frontend           Create new Vite frontend");
    console.log("  decode -backend [name]     Scaffold Express backend");
    console.log(
        "  decode -folders -mcrs      Create models/controllers/routes/services"
    );
    console.log("  decode -files f1 f2...     Create files");
    console.log("  decode -run                Choose & run npm script");
    console.log("  decode -go                 Run dev || start");
    console.log("  decode -plugin name        Run plugin from ./plugins");
    console.log("  decode -open               Open folder in VS Code");
    console.log("  decode -term               Open terminal");
    console.log("  decode -info               Show folder info");
    console.log("  decode -dash               (future) local dashboard\n");
}

function generateEngine(cliName) {
    return `#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
const CLI_NAME = "${cliName}";
const args = process.argv.slice(2);
const cwd = process.cwd();
const log=(s)=>console.log(chalk.cyanBright(s));
const warn=(s)=>console.log(chalk.yellow(s));
const err=(s)=>console.log(chalk.red(s));
function runSync(cmd,opts={}){const r=spawnSync(cmd,{stdio:"inherit",shell:true,...opts});if(r.error)throw r.error;}
if(!args.length){console.log("Usage: "+CLI_NAME+" -p pkg1 pkg2 ...");process.exit(0);}
const cmd=args[0];
if(cmd===" -p"){const pkgs=args.slice(1).join(" ");log("📦 Installing "+pkgs);runSync("npm install "+pkgs);}
else if(cmd==="-backend"){fs.mkdirSync("src",{recursive:true});fs.writeFileSync("src/server.js","console.log('🚀 Backend ready');");runSync("npm init -y");runSync("npm i express cors dotenv");}
else if(cmd==="-frontend"){runSync("npm create vite@latest");}
else if(cmd==="-files"){args.slice(1).forEach(f=>{fs.writeFileSync(f,"");log("📝 Created "+f);});}
else if(cmd==="-info"){log("📂 "+cwd);fs.readdirSync(cwd).forEach(i=>console.log(" - "+i));}
else{warn("Unknown command");}
`;
}

main();
