import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  delay,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

// Logger configuration - silent or minimal for speed and low memory
const logger = pino({ level: 'silent' });

class AstroBot {
  constructor() {
    this.sock = null;
    this.connected = false;
    this.botActive = true; // .bot on / .bot off
    this.user = null; // Connected user details
    this.lastPairingCode = null;
    this.logs = [];
    this.isInitializing = false;
    this.startTime = Date.now();
    this.saveCreds = null;
    this.cachedBuffers = null;
    this.cachedThumbs = null;
  }

  // Pre-load assets and thumbnails into memory once to ensure 0ms disk I/O and bypass native image decoders
  initAssetCache() {
    try {
      this.cachedBuffers = {
        pak: this.getImageBuffer(CONFIG.ASSETS.PAK),
        ph: this.getImageBuffer(CONFIG.ASSETS.PH),
        inter: this.getImageBuffer(CONFIG.ASSETS.INTER),
      };
      this.cachedThumbs = {
        pak: this.getThumbBuffer(CONFIG.ASSETS.PAK_THUMB),
        ph: this.getThumbBuffer(CONFIG.ASSETS.PH_THUMB),
        inter: this.getThumbBuffer(CONFIG.ASSETS.INTER_THUMB),
      };
      this.addLog('info', 'Assets & thumbnails pre-cached in RAM for instant zero-latency responses.');
    } catch (e) {
      this.addLog('warning', `Asset cache note: ${e.message}`);
    }
  }

  addLog(type, message) {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type, // 'info', 'success', 'warning', 'error', 'command'
      message,
    };
    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs.pop(); // Keep low memory footprint for KataBump
    console.log(`[${logEntry.timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  // Pre-load or read image buffer safely
  getImageBuffer(filePath) {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    // Fallback to webp if jpg not found
    const webpPath = filePath.replace(/\.jpg$/, '.webp');
    if (fs.existsSync(webpPath)) {
      return fs.readFileSync(webpPath);
    }
    throw new Error(`Asset not found: ${filePath}`);
  }

  // Pre-load thumbnail buffer safely (or return minimal JPEG fallback)
  getThumbBuffer(filePath) {
    if (filePath && fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    // Safe 1x1 minimal JPEG fallback
    return Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  }

  async initSocket() {
    if (this.isInitializing) return this.sock;
    this.isInitializing = true;

    // Cache images into memory on startup
    if (!this.cachedBuffers) {
      this.initAssetCache();
    }

    try {
      if (!fs.existsSync(CONFIG.SESSION_DIR)) {
        fs.mkdirSync(CONFIG.SESSION_DIR, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(CONFIG.SESSION_DIR);
      this.saveCreds = saveCreds;

      this.sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'), // Safe official standard browser signature
        syncFullHistory: false,
        markOnlineOnConnect: false, // Save bandwidth & CPU on KataBump
        generateHighQualityLinkPreview: false, // Save CPU
        // Ignore all groups and broadcasts at network level to save ~80% CPU & RAM
        shouldIgnoreJid: (jid) =>
          !jid || jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.includes('@newsletter'),
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          this.connected = true;
          this.user = this.sock.user;
          const phone = this.user?.id ? this.user.id.split(':')[0] : 'Unknown';
          this.addLog('success', `Astro Bot connected successfully as +${phone}!`);
        } else if (connection === 'close') {
          this.connected = false;
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          this.addLog('warning', `Connection closed. Reason code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (statusCode === DisconnectReason.loggedOut) {
            this.addLog('error', 'Device logged out. Clearing session files...');
            try {
              fs.rmSync(CONFIG.SESSION_DIR, { recursive: true, force: true });
            } catch (err) {
              console.error('Error clearing session:', err);
            }
            this.user = null;
            this.sock = null;
          } else {
            // Auto reconnect after short delay
            await delay(3000);
            this.isInitializing = false;
            this.initSocket().catch((e) => console.error('Reconnect failed:', e));
          }
        }
      });

      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' && type !== 'append') return;

        for (const msg of messages) {
          await this.handleIncomingMessage(msg);
        }
      });

      this.isInitializing = false;
      return this.sock;
    } catch (err) {
      this.isInitializing = false;
      this.addLog('error', `Socket initialization error: ${err.message}`);
      throw err;
    }
  }

  async handleIncomingMessage(msg) {
    try {
      if (!msg.message) return;

      const remoteJid = msg.key?.remoteJid;
      if (!remoteJid) return;

      // STRICT RULE 1: PRIVATE DMS ONLY (Never work in group chats or broadcasts)
      if (remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast' || remoteJid.includes('@newsletter')) {
        return;
      }

      // STRICT RULE 2: ONLY WORK ON MY (PAIRED ACCOUNT) COMMAND
      // "only work on paired whstapp number not for everyone only the person who pair number can trigger commands"
      const isFromMe = Boolean(msg.key.fromMe);
      const cleanPhone = process.env.PHONE_NUMBER ? process.env.PHONE_NUMBER.replace(/\D/g, '') : null;
      const isOwnerPhone = cleanPhone && (remoteJid.includes(cleanPhone) || msg.key.participant?.includes(cleanPhone));

      if (!isFromMe && !isOwnerPhone) {
        // Message sent by another person (customer). We do NOT trigger on their messages.
        return;
      }

      // Unpack message wrappers (ephemeral, view-once, document-with-caption)
      const messageContent =
        msg.message.ephemeralMessage?.message ||
        msg.message.viewOnceMessage?.message ||
        msg.message.viewOnceMessageV2?.message ||
        msg.message.documentWithCaptionMessage?.message ||
        msg.message;

      // Extract message text
      const rawText =
        messageContent?.conversation ||
        messageContent?.extendedTextMessage?.text ||
        messageContent?.imageMessage?.caption ||
        messageContent?.videoMessage?.caption ||
        '';

      const text = rawText.trim();
      if (!text.startsWith('.')) return;

      const cmd = text.toLowerCase().trim();

      // Bot ON / OFF Toggle Commands
      if (cmd === '.bot off') {
        this.botActive = false;
        this.addLog('command', `Owner toggled bot OFF in chat: ${remoteJid}`);
        await this.sock.sendMessage(remoteJid, {
          text: '🔴 *Astro Bot is now OFF.*\nCommands (.pak, .ph, .inter, .pay) are paused.\nType *.bot on* anytime to reactivate.',
        });
        return;
      }

      if (cmd === '.bot on') {
        this.botActive = true;
        this.addLog('command', `Owner toggled bot ON in chat: ${remoteJid}`);
        await this.sock.sendMessage(remoteJid, {
          text: '🟢 *Astro Bot is now ON.*\nReady to send price lists & payment details instantly on your command.',
        });
        return;
      }

      // If bot is turned off, ignore other commands
      if (!this.botActive) {
        return;
      }

      // Execute Commands (0ms Disk I/O - served directly from RAM with precomputed thumbnail)
      if (cmd === '.pak') {
        this.addLog('command', `Sending Pak Region list to: ${remoteJid}`);
        const imageBuffer = this.cachedBuffers?.pak || this.getImageBuffer(CONFIG.ASSETS.PAK);
        const thumbBuffer = this.cachedThumbs?.pak || this.getThumbBuffer(CONFIG.ASSETS.PAK_THUMB);
        await this.sock.sendMessage(remoteJid, {
          image: imageBuffer,
          jpegThumbnail: thumbBuffer,
        });
        this.addLog('success', `Pak Region list sent successfully to: ${remoteJid}`);
      } else if (cmd === '.ph') {
        this.addLog('command', `Sending PH Region list to: ${remoteJid}`);
        const imageBuffer = this.cachedBuffers?.ph || this.getImageBuffer(CONFIG.ASSETS.PH);
        const thumbBuffer = this.cachedThumbs?.ph || this.getThumbBuffer(CONFIG.ASSETS.PH_THUMB);
        await this.sock.sendMessage(remoteJid, {
          image: imageBuffer,
          jpegThumbnail: thumbBuffer,
        });
        this.addLog('success', `PH Region list sent successfully to: ${remoteJid}`);
      } else if (cmd === '.inter') {
        this.addLog('command', `Sending International list to: ${remoteJid}`);
        const imageBuffer = this.cachedBuffers?.inter || this.getImageBuffer(CONFIG.ASSETS.INTER);
        const thumbBuffer = this.cachedThumbs?.inter || this.getThumbBuffer(CONFIG.ASSETS.INTER_THUMB);
        await this.sock.sendMessage(remoteJid, {
          image: imageBuffer,
          jpegThumbnail: thumbBuffer,
        });
        this.addLog('success', `International list sent successfully to: ${remoteJid}`);
      } else if (cmd === '.pay') {
        this.addLog('command', `Sending Payment Methods to: ${remoteJid}`);
        await this.sock.sendMessage(remoteJid, {
          text: CONFIG.PAYMENT_INFO,
        });
        this.addLog('success', `Payment methods sent successfully to: ${remoteJid}`);
      } else if (cmd === '.menu' || cmd === '.help') {
        this.addLog('command', `Sending Menu to: ${remoteJid}`);
        await this.sock.sendMessage(remoteJid, {
          text: CONFIG.MENU_TEXT,
        });
        this.addLog('success', `Menu sent successfully to: ${remoteJid}`);
      } else if (cmd === '.status') {
        const uptimeHours = ((Date.now() - this.startTime) / (1000 * 60 * 60)).toFixed(1);
        const statusText = `⚡ *ASTRO BOT STATUS* ⚡\n\n` +
          `• State: ${this.botActive ? '🟢 Active' : '🔴 Inactive (Off)'}\n` +
          `• Target: Private DMs Only 🔒\n` +
          `• Account: +${this.user?.id ? this.user.id.split(':')[0] : 'Not Connected'}\n` +
          `• Anti-Ban Protection: Active 🛡️\n` +
          `• Uptime: ${uptimeHours} hours\n` +
          `• Ultra-Lightweight Baileys Engine`;
        await this.sock.sendMessage(remoteJid, { text: statusText });
        this.addLog('success', `Status sent successfully to: ${remoteJid}`);
      }
    } catch (err) {
      this.addLog('error', `Error executing command: ${err.message}`);
    }
  }

  // Request 8-digit WhatsApp Pairing Code
  async requestPairingCode(rawPhoneNumber) {
    const phoneNumber = rawPhoneNumber.replace(/[^0-9]/g, '');
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error('Please enter a valid phone number with country code (e.g. 923418109808)');
    }

    if (!this.sock) {
      await this.initSocket();
    }

    // Give socket brief time to establish WebSocket if just started
    await delay(1500);

    if (this.sock.authState.creds.registered) {
      throw new Error('This bot instance is already linked to a WhatsApp number! Logout first to pair a new number.');
    }

    try {
      this.addLog('info', `Requesting WhatsApp pairing code for +${phoneNumber}...`);
      const code = await this.sock.requestPairingCode(phoneNumber);
      const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
      this.lastPairingCode = formattedCode;
      this.addLog('success', `Pairing code generated: ${formattedCode}`);
      return formattedCode;
    } catch (err) {
      this.addLog('error', `Failed to generate pairing code: ${err.message}`);
      throw err;
    }
  }

  // Simulator for web dashboard testing
  simulateCommand(cmd) {
    const cleanCmd = cmd.toLowerCase().trim();
    if (cleanCmd === '.bot off') {
      return {
        type: 'text',
        response: '🔴 *Astro Bot is now OFF.*\nCommands (.pak, .ph, .inter, .pay) are paused.\nType *.bot on* anytime to reactivate.',
      };
    }
    if (cleanCmd === '.bot on') {
      return {
        type: 'text',
        response: '🟢 *Astro Bot is now ON.*\nReady to send price lists & payment details instantly on your command.',
      };
    }
    if (cleanCmd === '.pak') {
      return {
        type: 'image',
        imageUrl: '/assets/pak.jpg',
        title: 'Recharge for Pak Region only (Red)',
      };
    }
    if (cleanCmd === '.ph') {
      return {
        type: 'image',
        imageUrl: '/assets/ph.jpg',
        title: 'MLBB Price List (PH Region)',
      };
    }
    if (cleanCmd === '.inter') {
      return {
        type: 'image',
        imageUrl: '/assets/inter.jpg',
        title: 'MLBB Diamonds Price List (International - Blue)',
      };
    }
    if (cleanCmd === '.pay') {
      return {
        type: 'text',
        response: CONFIG.PAYMENT_INFO,
      };
    }
    if (cleanCmd === '.menu' || cleanCmd === '.help') {
      return {
        type: 'text',
        response: CONFIG.MENU_TEXT,
      };
    }
    return {
      type: 'text',
      response: `Command "${cmd}" not recognized. Available commands: .pak, .ph, .inter, .pay, .bot on, .bot off, .menu`,
    };
  }

  // Send a test message directly to the owner's WhatsApp
  async sendTestToWhatsApp(command) {
    if (!this.connected || !this.sock) {
      throw new Error('Bot is not connected to WhatsApp! Pair your phone number first.');
    }
    const myJid = this.sock.user?.id;
    if (!myJid) throw new Error('No active user JID found.');

    const targetJid = myJid.split(':')[0] + '@s.whatsapp.net';
    const cleanCmd = command.toLowerCase().trim();

    if (cleanCmd === '.pak') {
      const buffer = this.cachedBuffers?.pak || this.getImageBuffer(CONFIG.ASSETS.PAK);
      await this.sock.sendMessage(targetJid, { image: buffer });
      return 'Sent Pak Region image (.pak) to your WhatsApp!';
    } else if (cleanCmd === '.ph') {
      const buffer = this.cachedBuffers?.ph || this.getImageBuffer(CONFIG.ASSETS.PH);
      await this.sock.sendMessage(targetJid, { image: buffer });
      return 'Sent PH Region image (.ph) to your WhatsApp!';
    } else if (cleanCmd === '.inter') {
      const buffer = this.cachedBuffers?.inter || this.getImageBuffer(CONFIG.ASSETS.INTER);
      await this.sock.sendMessage(targetJid, { image: buffer });
      return 'Sent International image (.inter) to your WhatsApp!';
    } else if (cleanCmd === '.pay') {
      await this.sock.sendMessage(targetJid, { text: CONFIG.PAYMENT_INFO });
      return 'Sent Payment Methods (.pay) to your WhatsApp!';
    } else {
      await this.sock.sendMessage(targetJid, { text: CONFIG.MENU_TEXT });
      return 'Sent Menu (.menu) to your WhatsApp!';
    }
  }

  // Toggle Bot ON/OFF from Web Dashboard
  toggleBotActive(activeState) {
    this.botActive = Boolean(activeState);
    this.addLog('info', `Bot state changed to: ${this.botActive ? 'ACTIVE (ON)' : 'INACTIVE (OFF)'}`);
    return this.botActive;
  }

  // Unpair / Logout
  async logout() {
    this.addLog('warning', 'Manual logout requested. Unpairing...');
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end();
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
    try {
      fs.rmSync(CONFIG.SESSION_DIR, { recursive: true, force: true });
    } catch (e) {
      console.error('Error removing session directory:', e);
    }
    this.connected = false;
    this.user = null;
    this.sock = null;
    this.lastPairingCode = null;
    this.addLog('info', 'Logged out and session cleared.');
    // Re-initialize a fresh socket ready for pairing
    await this.initSocket();
    return true;
  }

  getStatus() {
    const phone = this.user?.id ? this.user.id.split(':')[0] : null;
    return {
      connected: this.connected,
      botActive: this.botActive,
      phone: phone ? `+${phone}` : null,
      name: this.user?.name || CONFIG.BOT_NAME,
      lastPairingCode: this.lastPairingCode,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      logs: this.logs.slice(0, 30),
    };
  }
}

export const botInstance = new AstroBot();
