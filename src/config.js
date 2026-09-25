import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const CONFIG = {
  BOT_NAME: 'Astro Bot',
  PORT: process.env.PORT || 3000,
  SESSION_DIR: path.join(ROOT_DIR, 'session'),
  
  // Image assets mapping
  ASSETS: {
    PAK: path.join(ROOT_DIR, 'assets', 'pak.jpg'),
    PH: path.join(ROOT_DIR, 'assets', 'ph.jpg'),
    INTER: path.join(ROOT_DIR, 'assets', 'inter.jpg'),
    PAK_THUMB: path.join(ROOT_DIR, 'assets', 'pak_thumb.jpg'),
    PH_THUMB: path.join(ROOT_DIR, 'assets', 'ph_thumb.jpg'),
    INTER_THUMB: path.join(ROOT_DIR, 'assets', 'inter_thumb.jpg'),
  },

  // Payment details provided by user
  PAYMENT_INFO: `💳 ASTRO PAYMENT METHODS

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

Tap number to copy. Send screenshot after payment!`,

  // Help menu text
  MENU_TEXT: `⚡ *ASTRO BOT COMMANDS* ⚡
_(Private DMs Only • Paired Account Only)_

💎 *.pak*   — Send Pakistan Region Price List (Red)
🇵🇭 *.ph*    — Send Philippines Region Price List
🌐 *.inter* — Send International Diamonds Price List (Blue)
💳 *.pay*   — Send Astro Payment Methods
🟢 *.bot on*  — Activate Astro Bot
🔴 *.bot off* — Deactivate Astro Bot
📊 *.status*  — Check connection & status

_Astro Bot • Fast, Safe & Lightweight_`,
};
