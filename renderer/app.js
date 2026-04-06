// ─── State ─────────────────────────────────────────────
const state = {
  messages: [],       // { role, text, screenshot? }
  screenshotBase64: null,
  isStreaming: false,
};

// ─── DOM Elements ──────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const chatContainer = $('#chat-container');
const messagesDiv = $('#messages');
const welcomeDiv = $('#welcome');
const input = $('#input');
const btnSend = $('#btn-send');
const btnScreenshot = $('#btn-screenshot');
const screenshotPreview = $('#screenshot-preview');
const screenshotImg = $('#screenshot-img');
const removeScreenshot = $('#remove-screenshot');
const statusBadge = $('#status-badge');

// ─── Markdown Rendering (lightweight) ──────────────────
function renderMarkdown(text) {
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const escaped = escapeHtml(code.trim());
      return `<pre><code class="lang-${lang || 'text'}">${escaped}</code><button class="copy-code-btn" onclick="copyCode(this)">Copy</button></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks → paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap loose <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\s*(?:<br>)?)+)/g, '<ul>$1</ul>');
  html = html.replace(/<br><\/ul>/g, '</ul>');
  html = html.replace(/<ul><br>/g, '<ul>');

  return `<p>${html}</p>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function copyCode(btn) {
  const code = btn.previousElementSibling.textContent;
  navigator.clipboard.writeText(code);
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
}
// Make it globally available for onclick
window.copyCode = copyCode;

// ─── Message Rendering ────────────────────────────────
function addMessage(role, text, screenshot = null) {
  welcomeDiv.classList.add('hidden');

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;

  let content = '';
  content += `<div class="message-label">${role === 'user' ? 'You' : 'Noted'}</div>`;

  if (screenshot) {
    content += `<img class="message-screenshot" src="data:image/png;base64,${screenshot}" />`;
  }

  content += `<div class="message-bubble">${role === 'assistant' ? renderMarkdown(text) : escapeHtml(text).replace(/\n/g, '<br>')}</div>`;

  msgDiv.innerHTML = content;
  messagesDiv.appendChild(msgDiv);
  scrollToBottom();

  return msgDiv;
}

function createStreamingMessage() {
  welcomeDiv.classList.add('hidden');

  const msgDiv = document.createElement('div');
  msgDiv.className = 'message assistant';
  msgDiv.innerHTML = `
    <div class="message-label">Noted</div>
    <div class="message-bubble">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;
  messagesDiv.appendChild(msgDiv);
  scrollToBottom();
  return msgDiv;
}

function updateStreamingMessage(msgDiv, text) {
  const bubble = msgDiv.querySelector('.message-bubble');
  bubble.innerHTML = renderMarkdown(text);
  scrollToBottom();
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ─── Status ────────────────────────────────────────────
function setStatus(text, thinking = false) {
  statusBadge.textContent = text;
  statusBadge.className = thinking ? 'thinking' : '';
}

// ─── Screenshot ────────────────────────────────────────
async function takeScreenshot() {
  setStatus('Capturing...', true);
  const base64 = await window.noted.takeScreenshot();
  if (base64) {
    state.screenshotBase64 = base64;
    screenshotImg.src = `data:image/png;base64,${base64}`;
    screenshotPreview.classList.remove('hidden');
    setStatus('Screenshot attached');
    setTimeout(() => setStatus('Ready'), 2000);
  } else {
    setStatus('Capture failed');
    setTimeout(() => setStatus('Ready'), 2000);
  }
}

function clearScreenshot() {
  state.screenshotBase64 = null;
  screenshotPreview.classList.add('hidden');
  screenshotImg.src = '';
}

// ─── Send Message ──────────────────────────────────────
async function sendMessage() {
  const text = input.value.trim();
  if (!text && !state.screenshotBase64) return;
  if (state.isStreaming) return;

  const userMsg = {
    role: 'user',
    text: text || '(screenshot attached)',
    screenshot: state.screenshotBase64 || null,
  };

  state.messages.push(userMsg);
  addMessage('user', userMsg.text, userMsg.screenshot);

  input.value = '';
  input.style.height = 'auto';
  clearScreenshot();

  state.isStreaming = true;
  btnSend.disabled = true;
  setStatus('Thinking...', true);

  // Create streaming message placeholder
  const streamDiv = createStreamingMessage();
  let fullText = '';

  // Set up stream listeners
  const deltaHandler = (text) => {
    fullText += text;
    updateStreamingMessage(streamDiv, fullText);
  };

  const endHandler = () => {
    state.isStreaming = false;
    btnSend.disabled = false;
    setStatus('Ready');
    state.messages.push({ role: 'assistant', text: fullText });
  };

  window.noted.onStreamDelta(deltaHandler);
  window.noted.onStreamEnd(endHandler);

  // Send to Claude via streaming
  const result = await window.noted.sendMessageStream({ messages: state.messages.filter(m => m.role === 'user' || m.role === 'assistant') });

  if (!result.success) {
    updateStreamingMessage(streamDiv, result.text);
    state.isStreaming = false;
    btnSend.disabled = false;
    setStatus('Error');
    setTimeout(() => setStatus('Ready'), 3000);
  }
}

// ─── Event Listeners ───────────────────────────────────
btnSend.addEventListener('click', sendMessage);

btnScreenshot.addEventListener('click', takeScreenshot);

removeScreenshot.addEventListener('click', clearScreenshot);

$('#btn-minimize').addEventListener('click', () => window.noted.minimizeWindow());
$('#btn-close').addEventListener('click', () => window.noted.closeWindow());

// Auto-resize textarea
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
});

// Enter to send, Shift+Enter for new line
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Listen for screenshot trigger from main process (Cmd+Shift+H)
window.noted.onTriggerScreenshot(async () => {
  await takeScreenshot();
  input.focus();
});

// Focus input on show
window.addEventListener('focus', () => {
  input.focus();
});

// Initial focus
input.focus();
