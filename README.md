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
- ⚡ **Ultra-Lightweight & Fast**: Pure Node.js & WebSocket engine (~40MB RAM), no Chromium or Puppeteer. Perfectly optimized for **KataBump** free tier (308MB RAM).

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

## 🌐 Free Hosting on HyeHost (Free Bot Plan)

Astro Bot is configured to run on **HyeHost Free Bot Hosting**:

### Step 1: Deploy to HyeHost
- **Option A (GitHub)**: In your HyeHost Bot Dashboard, connect your GitHub repository:
  `https://github.com/s4killer66-afk/astro-bot` (Branch: `main`).
- **Option B (File Manager Upload)**: Upload `astro-bot-hyehost.zip` directly into your HyeHost file manager and click **Unarchive**.

### Step 2: How to Pair on HyeHost
You have two flexible pairing methods:

#### Method A: Direct Console Pairing (Easiest — No Web Link Needed)
1. In HyeHost, go to **Environment Variables** (or edit `.env`).
2. Add your phone number:
   `PHONE_NUMBER=923418109808`
3. Click **Start / Restart**.
4. Within 5 seconds, the bot prints the 8-digit WhatsApp code directly on your HyeHost Console screen!
5. Enter the code in WhatsApp under **Linked Devices** > **Link with phone number instead**.

#### Method B: Web Dashboard (If Port/URL Allocated)
1. Open your HyeHost provided domain or IP:PORT.
2. Enter your phone number on the webpage and click **"Get 8-Digit Pairing Code"**.

> 💡 **HyeHost Free Tier Performance Optimizations**:
> - **Zero `npm ci` Errors**: Clean, 100% synchronized `package-lock.json` with no heavy native C++ binaries (no sharp).
> - **Ultra-Low Memory Footprint (< 80MB)**: Uses Node memory cap (`--max-old-space-size=256`), running smoothly on free bot quotas.
> - **In-Memory RAM Cache (~960KB)**: All price list images reside in RAM for **0ms disk read delay** and instant WhatsApp dispatch.
> - **Socket-Level Group Filter**: All group messages (`@g.us`) and broadcast channels are rejected at the network layer before decryption (`shouldIgnoreJid`), saving up to 80% CPU and memory.
> - **Auto-Reconnect**: Session credentials save to `session/`. When HyeHost restarts or sleeps, Astro Bot re-establishes connection automatically without re-pairing!

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
