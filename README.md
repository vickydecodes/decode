```
                               ____                       _       
                              |  _ \  ___  ___   ___     | | ___  
                              | | | |/ _ \/ __| / _ \ / _` |/ _ \ 
                              | |_| |  __/ (__ | (_) | (_| |  __/ 
                              |____/ \___|\___| \___/ \__,_|\___| 

      🧩 Decode CLI — Vicky’s Developer Utility
      ⚡ Automate • Scaffold • Build • Deploy
```

---

<div align="center">

# 🧩 DECODE CLI

### *The Developer’s Swiss Army Knife*

**Made with ⚡ by [@vickydecodes](https://github.com/vickydecodes)**

**Automate. Scaffold. Build. Deploy.**
Your terminal just got smarter.

---

![npm](https://img.shields.io/npm/v/@vickydecodes/decode?color=%2300ff99\&style=for-the-badge)
![license](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![node](https://img.shields.io/node/v/@vickydecodes/decode?style=for-the-badge)
![maintained](https://img.shields.io/maintenance/yes/2025?color=brightgreen\&style=for-the-badge)

</div>

---

## ✨ Overview

**Decode CLI** is your all-in-one **developer companion**, created to make coding faster, cleaner, and more powerful.
Whether you’re spinning up a backend API, launching a Vite frontend, or automating your setup — **Decode** does it all.

It’s not just another CLI; it’s your **coding sidekick**.
And yeah, it’s built by a dev for devs.

---

## 🚀 Quick Install

No setup. No fuss. Just one line:

```bash
npm install -g @vickydecodes/decode
```

Once installed, you can instantly use it anywhere:

```bash
decode -info      # view current directory info
decode -backend   # create an express backend
decode -frontend  # run vite setup
decode -go        # start project
```

✅ That’s it — no imports, configs, or extra steps.
Decode becomes a **global command** available in any terminal.

---

## ⚙️ Commands Reference

| 🧩 Command               | 💬 Description                                              |
| ------------------------ | ----------------------------------------------------------- |
| `decode -p pkg1 pkg2...` | Install npm packages quickly.                               |
| `decode -frontend`       | Create a new **Vite frontend** interactively.               |
| `decode -backend [name]` | Scaffold a **Node + Express backend** (with dotenv + cors). |
| `decode -folders -mcrs`  | Create `models/`, `controllers/`, `routes/`, `services/`.   |
| `decode -files f1 f2...` | Instantly create multiple files.                            |
| `decode -run`            | Interactive script runner (pick from package.json).         |
| `decode -go`             | Smart start: runs `npm run dev` → fallback to `npm start`.  |
| `decode -plugin <name>`  | Execute a plugin from `./plugins`.                          |
| `decode -open`           | Open your project in **VS Code**.                           |
| `decode -term`           | Open a terminal in current directory.                       |
| `decode -info`           | Display current directory info.                             |
| `decode -dash`           | (Coming soon) Decode Web Dashboard.                         |
| `decode init <cli-name>` | Build your own CLI — powered by Decode.                     |

---

## 🧱 Example Workflows

### ⚡ Full-Stack Setup in 3 Lines

```bash
decode -frontend
decode -backend api
decode -go
```

### 🧰 Backend-Only Setup

```bash
decode -backend myapi
decode -folders -mcrs
decode -p express mongoose cors dotenv
decode -files .env .gitignore README.md
```

### 💻 File / Folder Utilities

```bash
decode -folders -mcrs
decode -files index.html style.css main.js
```

---

## 🧠 Create Your Own CLI

Decode can also **build new CLIs** under your own name 😎

```bash
decode init mycli
cd mycli
npm link
```

Then use it globally:

```bash
mycli -info
mycli -backend api
```

---

## 🔌 Plugin System

Extend Decode with your own plugins inside the `plugins/` folder.

**Example:** `plugins/hello.js`

```js
console.log("👋 Hello from your Decode plugin!");
```

Run it:

```bash
decode -plugin hello
```

---

## 🧠 Future Integration — Flux Mode

Decode is part of the **VickyDecodes Developer Suite**, alongside
[`@vickydecodes/flux`](https://www.npmjs.com/package/@vickydecodes/flux).

Soon you’ll be able to do:

```bash
decode -flux myapi
```

and instantly get a **Flux-powered backend** scaffold.

---

## 🪄 Pro Shortcuts

| Command        | What It Does                       |
| -------------- | ---------------------------------- |
| `decode -open` | Launch VS Code instantly.          |
| `decode -term` | Opens terminal at project root.    |
| `decode -go`   | Runs `npm run dev` or `npm start`. |
| `decode -info` | Lists directory contents.          |

---

## 🧭 Folder Structure (After Init)

```
decode/
├── index.js
├── package.json
├── plugins/
│   └── hello.js
└── README.md
```

---

## 🧑‍💻 Developer Mode

```bash
git clone https://github.com/vickydecodes/decode
cd decode
npm link
decode -info
```

---

## 📈 Roadmap

✅ Backend scaffolding
✅ Frontend scaffolding
✅ File & folder generators
✅ Plugin system
✅ CLI creation
🚧 Decode Dashboard
🚧 Flux integration
🚧 Template registry

---

## 💎 Production-Grade Setup

```bash
npm install -g @vickydecodes/decode
decode -backend api
decode -go
```

---

## 🧾 License

MIT © [Vicky](https://github.com/vickydecodes)
Part of the **@vickydecodes** developer ecosystem.

---

## 💬 Connect

| Platform       | Link                                                           |
| -------------- | -------------------------------------------------------------- |
| 🌐 Website     | [vickify.in](https://vickify.in)                               |
| 🧠 GitHub      | [github.com/vickydecodes](https://github.com/vickydecodes)     |
| 🧩 NPM         | [npmjs.com/~vickydecodes](https://www.npmjs.com/~vickydecodes) |
| 💬 Twitter (X) | [@vickydecodes](https://x.com/vickydecodes)                    |

---

<div align="center">

### ⚡ Decode CLI

*“Because coding should be fast, fun, and frictionless.”*

</div>
