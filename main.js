const { app, BrowserWindow, globalShortcut, ipcMain, screen, desktopCapturer, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const screenshot = require('screenshot-desktop');
require('dotenv').config();

let mainWindow = null;
let tray = null;
let isVisible = false;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  const winWidth = 420;
  const winHeight = 680;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: screenWidth - winWidth - 20,
    y: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Start hidden
  mainWindow.hide();
  isVisible = false;

  // Prevent close, just hide
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      isVisible = false;
    }
  });
}

function toggleWindow() {
  if (!mainWindow) return;
  if (isVisible) {
    mainWindow.hide();
    isVisible = false;
  } else {
    mainWindow.show();
    mainWindow.focus();
    isVisible = true;
  }
}

function createTray() {
  // Create a simple tray icon (small circle)
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="8" fill="#7c3aed" stroke="#fff" stroke-width="1.5"/>
        <text x="11" y="15" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="Arial">N</text>
      </svg>`,
      'utf8'
    )
  );

  // Fallback: create a tiny colored icon
  const trayIcon = nativeImage.createEmpty();

  tray = new Tray(icon.isEmpty() ? nativeImage.createFromBuffer(Buffer.alloc(1)) : icon);
  tray.setToolTip('Noted - AI Assistant (Cmd+Shift+Space)');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: toggleWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Global hotkey: Cmd+Shift+Space (Mac) or Ctrl+Shift+Space (Windows/Linux)
  const shortcut = process.platform === 'darwin' ? 'CommandOrControl+Shift+Space' : 'Ctrl+Shift+Space';
  globalShortcut.register(shortcut, toggleWindow);

  // Secondary hotkey for quick screenshot + ask
  globalShortcut.register('CommandOrControl+Shift+H', async () => {
    if (!isVisible) {
      mainWindow.show();
      mainWindow.focus();
      isVisible = true;
    }
    mainWindow.webContents.send('trigger-screenshot');
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ───────────────────────────────────────────────

// Take screenshot
ipcMain.handle('take-screenshot', async () => {
  try {
    const imgBuffer = await screenshot({ format: 'png' });
    return imgBuffer.toString('base64');
  } catch (err) {
    console.error('Screenshot failed:', err);
    return null;
  }
});

// Send message to Claude
ipcMain.handle('send-message', async (event, { messages, screenshotBase64 }) => {
  try {
    const claudeMessages = messages.map((msg) => {
      if (msg.role === 'user' && msg.screenshot) {
        return {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: msg.screenshot,
              },
            },
            { type: 'text', text: msg.text || 'What do you see on my screen? Help me with this.' },
          ],
        };
      }
      return {
        role: msg.role,
        content: msg.text,
      };
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are Noted, a helpful AI assistant that lives as a desktop overlay. You help users with whatever is on their screen — coding, writing, research, problem-solving, etc. Be concise but thorough. When analyzing screenshots, focus on what's most relevant and actionable. Format responses with markdown when helpful.`,
      messages: claudeMessages,
    });

    return {
      success: true,
      text: response.content[0].text,
    };
  } catch (err) {
    console.error('Claude API error:', err);
    return {
      success: false,
      text: `Error: ${err.message}`,
    };
  }
});

// Stream message to Claude
ipcMain.handle('send-message-stream', async (event, { messages }) => {
  try {
    const claudeMessages = messages.map((msg) => {
      if (msg.role === 'user' && msg.screenshot) {
        return {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: msg.screenshot,
              },
            },
            { type: 'text', text: msg.text || 'What do you see on my screen? Help me with this.' },
          ],
        };
      }
      return { role: msg.role, content: msg.text };
    });

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are Noted, a helpful AI assistant that lives as a desktop overlay. You help users with whatever is on their screen — coding, writing, research, problem-solving, etc. Be concise but thorough. When analyzing screenshots, focus on what's most relevant and actionable. Format responses with markdown when helpful.`,
      messages: claudeMessages,
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullText += event.delta.text;
        mainWindow.webContents.send('stream-delta', event.delta.text);
      }
    }

    mainWindow.webContents.send('stream-end');
    return { success: true, text: fullText };
  } catch (err) {
    console.error('Claude API stream error:', err);
    mainWindow.webContents.send('stream-end');
    return { success: false, text: `Error: ${err.message}` };
  }
});

// Window controls
ipcMain.on('window-minimize', () => {
  mainWindow.hide();
  isVisible = false;
});

ipcMain.on('window-close', () => {
  mainWindow.hide();
  isVisible = false;
});
