# 🚀 Astro Bot — WhatsApp MLBB Store Self-Assistant

An ultra-lightweight, high-performance WhatsApp self-assistant bot tailored for **Astro Gaming Store**. Built with [Baileys](https://github.com/WhiskeySockets/Baileys), Express, and modern WebSockets to give you lightning-fast auto-responses with zero server lag.

---

## 🌟 Key Features

- 🔒 **Private DMs Only**: Strictly ignores all Group Chats (`@g.us`), broadcasts, and channels. Never interferes in group chats.
- 👑 **Owner-Triggered Only**: Commands only activate when **YOU** send the trigger (`.ph`, `.pak`, etc.) from your paired account. Customers and strangers cannot trigger or spam your bot.
- 🛡️ **100% Anti-Ban Safe**:
  - No cold messaging or automated bulk spamming.
  - Realistic official browser handshake (`Browsers.ubuntu('Chrome')`).
  - Sends straight images without mentioning (`@`) anyone.
- 📲 **8-Digit Pairing Code Webpage**: Pair your WhatsApp number effortlessly in seconds without scanning QR codes.
- 🧪 **Interactive Web Simulator & Tester**: Test every command (`.pak`, `.ph`, `.inter`, `.pay`) in an authentic WhatsApp simulator right inside your browser before going live, plus a one-click test message to your own phone!
- ⚡ **Ultra-Lightweight & Fast**: Pure Node.js & WebSocket engine (~40MB RAM), no Chromium or Puppeteer. Perfect for free hosting like **HyeHost**, Render, Railway, or VPS.

---

## 💎 Available Commands (Private DMs Only)

| Command | Action | Output |
| :--- | :--- | :--- |
| `.pak` | Pakistan Region Price List | Sends Red MLBB Pak Region banner |
| `.ph` | Philippines Region Price List | Sends Purple MLBB PH Region banner |
| `.inter` | International Diamonds List | Sends Blue MLBB International banner |
| `.pay` | Astro Payment Details | Sends Easypaisa, Jazzcash, Merchant Till ID & Binance Pay |
| `.bot on` | Activate Bot | Enables command responses |
| `.bot off` | Pause Bot | Pauses command responses |
| `.menu` | View Menu | Displays full list of commands |
| `.status` | Check Status | Shows bot health, uptime, and account info |

---

## 💳 Payment Method Format (.pay)

```text
💳 ASTRO PAYMENT METHODS

🟢 Easypaisa
📱 03418109808
👤 Syed Nabeel Azhar

🟠 Jazzcash
📱 03345655395
👤 Nabeel Azhar

🏪 By Merchant Payment
🔢 Till ID: 999213495
🏷️ Astro Gaming Store

🟡 Binance Pay / NayaPay
📞 Contact: +92 341 8109808

Tap number to copy. Send screenshot after payment!
```

---

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Bot & Web Dashboard
```bash
npm start
```
The server will start at `http://localhost:3000`.

### 3. Pair Your WhatsApp Account
1. Open your browser and go to `http://localhost:3000`.
2. Enter your WhatsApp number with international country code (e.g. `923418109808`).
3. Click **"Get 8-Digit Pairing Code"**.
4. Open WhatsApp on your phone:
   - Tap **Settings / Menu (⋮)** > **Linked Devices** > **Link a Device**.
   - Tap **"Link with phone number instead"** at the bottom.
   - Enter the 8-digit code displayed on the webpage.
5. Once linked, the dashboard status turns **🟢 Connected**!

---

## 🌐 Free Hosting on HyeHost (cPanel Node.js)

Astro Bot is designed to run seamlessly on **HyeHost** free cPanel hosting:

1. **Log in to HyeHost cPanel**.
2. Scroll to the **Software** section and click **"Setup Node.js App"**.
3. Click **"Create Application"**:
   - **Node.js version**: Choose `20.x` or `18.x`.
   - **Application mode**: `Production`.
   - **Application root**: `astro-bot` (or your folder name).
   - **Application URL**: Select your domain/subdomain.
   - **Application startup file**: `server.js`.
4. Click **Create**.
5. Upload your files into the application directory using **cPanel File Manager** or Git:
   - Upload `package.json`, `server.js`, `src/`, `assets/`, `public/`.
   - *(Note: Do NOT upload `node_modules` or `session` folder).*
6. In the Node.js App settings, click **"Run NPM Install"** (Takes < 10 seconds because heavy native dependencies like Sharp are eliminated).
7. Click **"Restart"** / **"Start"**.
8. Visit your website URL, enter your phone number, get the pairing code, and link your WhatsApp!

> 💡 **HyeHost Free Tier Optimizations Built-In**:
> - **Zero Native Build Errors**: Pre-converted JPEG/WebP assets eliminate heavy C++ packages like `sharp` from `package.json`.
> - **In-Memory RAM Cache (~960KB)**: All images reside in memory on boot, resulting in **0ms disk reads** and zero I/O throttling from CloudLinux.
> - **Socket-Level Group Filter**: All group messages (`@g.us`) and broadcast channels are rejected at the network layer before decryption (`shouldIgnoreJid`), saving up to 80% CPU and RAM.
> - **Memory Cap**: Configured to run with `--max-old-space-size=256` to prevent exceeding free hosting RAM quotas.
> - **Auto-Reconnect**: The session is stored in `session/`. When HyeHost restarts or recycles the app pool, Astro Bot automatically reconnects without re-pairing!

---

## 🐙 GitHub Repository

Repository URL: **[https://github.com/s4killer66-afk/astro-bot](https://github.com/s4killer66-afk/astro-bot)**

To pull or push future updates:
```bash
git add .
git commit -m "update: improvements"
git push origin main
```

---

## 🛡️ Ban Safety Guarantee

Astro Bot follows strict safety guidelines:
1. **Never initiates chats** — only works when you are already messaging in private.
2. **Never sends to groups** — blocks all group JIDs.
3. **Owner-Only** — only responds to messages sent by the owner's WhatsApp (`fromMe: true`).
4. **No tags/mentions** — eliminates spam flags from WhatsApp filters.
