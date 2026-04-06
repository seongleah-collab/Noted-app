# Noted

AI-powered desktop overlay assistant, powered by Claude.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Claude API key to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Run the app:
   ```bash
   npm start
   ```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+Shift+Space` | Toggle overlay on/off |
| `Cmd+Shift+H` | Screenshot + open overlay |
| `Enter` | Send message |
| `Shift+Enter` | New line in input |

## Features

- **Always-on-top overlay** — floats over your other windows
- **Screen capture** — take screenshots and ask Claude about what's on screen
- **Streaming responses** — see answers appear in real-time
- **Markdown rendering** — code blocks, lists, bold, etc.
- **Draggable + resizable** — position it wherever you want
- **System tray** — right-click to show/hide or quit
