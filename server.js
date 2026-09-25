import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { CONFIG } from './src/config.js';
import { botInstance } from './src/bot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || CONFIG.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files and media assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// API: Get bot status, connected number, logs
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    ...botInstance.getStatus(),
  });
});

// API: Request WhatsApp 8-digit Pairing Code
app.post('/api/pair', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const code = await botInstance.requestPairingCode(phone);
    res.json({
      success: true,
      code,
      message: 'Pairing code generated successfully!',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to request pairing code',
    });
  }
});

// API: Toggle Bot Active State (.bot on / .bot off)
app.post('/api/bot-toggle', (req, res) => {
  const { active } = req.body;
  const newState = botInstance.toggleBotActive(active);
  res.json({
    success: true,
    botActive: newState,
  });
});

// API: Simulate Command for Testing
app.post('/api/simulate', (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, message: 'Command is required' });
  }

  const result = botInstance.simulateCommand(command);
  res.json({
    success: true,
    ...result,
  });
});

// API: Send Test to WhatsApp
app.post('/api/send-test', async (req, res) => {
  try {
    const { command } = req.body;
    const msg = await botInstance.sendTestToWhatsApp(command || '.pak');
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// API: Unpair / Logout
app.post('/api/logout', async (req, res) => {
  try {
    await botInstance.logout();
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Express Server (bind to 0.0.0.0 for Docker / HyeHost)
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ${CONFIG.BOT_NAME} Server running at: http://localhost:${PORT}`);
  console.log(`📡 Open this URL in your browser to pair your WhatsApp`);
  console.log(`======================================================\n`);

  // If previous credentials exist in session directory, automatically reconnect!
  const credsPath = path.join(CONFIG.SESSION_DIR, 'creds.json');
  if (fs.existsSync(credsPath)) {
    console.log('🔄 Existing WhatsApp session detected. Connecting automatically...');
    botInstance.initSocket().catch((err) => {
      console.error('Auto-reconnect error:', err.message);
    });
  }
});

export default app;
