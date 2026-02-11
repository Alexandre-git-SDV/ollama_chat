// ════════════════════════════════════════════════════════════
//  Ollama Chat — script.js
//  Sidebar : conversations uniquement + connexion + settings + thème
// ════════════════════════════════════════════════════════════

const OLLAMA_BASE = "http://localhost:11434";

// ── State ──
let conversations = JSON.parse(localStorage.getItem("ollama-conversations") || "[]");
let currentConvId = null;
let currentModel = localStorage.getItem("ollama-model") || "";
let isGenerating = false;
let abortController = null;

// ── DOM ──
const dom = {
  app:                document.getElementById("app"),
  sidebar:            document.getElementById("sidebar"),
  sidebarBackdrop:    document.getElementById("sidebarBackdrop"),
  btnSidebarToggle:   document.getElementById("btnSidebarToggle"),
  btnNewChat:         document.getElementById("btnNewChat"),
  connectionStatus:   document.getElementById("connectionStatus"),
  conversationsList:  document.getElementById("conversationsList"),
  btnOpenSettings:    document.getElementById("btnOpenSettings"),
  btnToggleTheme:     document.getElementById("btnToggleTheme"),
  themeLabel:         document.getElementById("themeLabel"),
  headerTitle:        document.getElementById("headerTitle"),
  btnModelSelect:     document.getElementById("btnModelSelect"),
  modelName:          document.getElementById("modelName"),
  modelDropdown:      document.getElementById("modelDropdown"),
  btnExport:          document.getElementById("btnExport"),
  btnDeleteChat:      document.getElementById("btnDeleteChat"),
  chatMessages:       document.getElementById("chatMessages"),
  welcomeScreen:      document.getElementById("welcomeScreen"),
  typingIndicator:    document.getElementById("typingIndicator"),
  userInput:          document.getElementById("userInput"),
  btnSend:            document.getElementById("btnSend"),
  btnStop:            document.getElementById("btnStop"),
  // Settings modal
  settingsModal:      document.getElementById("settingsModal"),
  closeSettings:      document.getElementById("closeSettings"),
  modelSelect:        document.getElementById("modelSelect"),
  btnRefreshModels:   document.getElementById("btnRefreshModels"),
  btnModelInfo:       document.getElementById("btnModelInfo"),
  systemPrompt:       document.getElementById("systemPrompt"),
  temperature:        document.getElementById("temperature"),
  tempValue:          document.getElementById("tempValue"),
  colorSwatches:      document.getElementById("colorSwatches"),
  // Model info modal
  modelInfoModal:     document.getElementById("modelInfoModal"),
  closeModelInfo:     document.getElementById("closeModelInfo"),
  modelInfoContent:   document.getElementById("modelInfoContent"),
  // Toast
  toastContainer:     document.getElementById("toastContainer"),
};

// ════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function esc(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function toast(msg, type = "info") {
  const icons = { success: "✓", error: "✗", warning: "⚠", info: "ℹ" };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ"}</span><span>${esc(msg)}</span>`;
  dom.toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add("toast-out");
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function save() {
  localStorage.setItem("ollama-conversations", JSON.stringify(conversations));
}

function getConv() {
  return conversations.find(c => c.id === currentConvId) || null;
}

function showWelcome(show) {
  if (dom.welcomeScreen) {
    dom.welcomeScreen.style.display = show ? "flex" : "none";
  }
}

function scrollBottom() {
  requestAnimationFrame(() => {
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  });
}

function formatBytes(bytes) {
  if (!bytes) return "?";
  const gb = bytes / 1e9;
  if (gb >= 1) return gb.toFixed(1) + " GB";
  return (bytes / 1e6).toFixed(0) + " MB";
}

// ════════════════════════════════════════════
//  MARKDOWN RENDERER
// ════════════════════════════════════════════

let codeId = 0;

function renderMd(text) {
  if (!text) return "";
  let h = esc(text);

  // Code blocks  ```lang\ncode```
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const id = `cb-${++codeId}`;
    const label = lang || "code";
    let highlighted;
    try {
      highlighted = lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value;
    } catch {
      highlighted = esc(code);
    }
    return `<div class="code-block">
      <div class="code-header">
        <span class="code-lang">${label}</span>
        <button class="btn-copy-code" onclick="copyCode('${id}')">Copier</button>
      </div>
      <pre><code id="${id}">${highlighted}</code></pre>
    </div>`;
  });

  // Inline code
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold / italic
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headers
  h = h.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  h = h.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // HR
  h = h.replace(/^---$/gm, '<hr>');

  // Blockquote
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Lists
  h = h.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  // Paragraphs
  h = h.replace(/\n\n/g, '</p><p>');
  h = h.replace(/\n/g, '<br>');
  h = `<p>${h}</p>`;
  h = h.replace(/<p><\/p>/g, '');

  return h;
}

window.copyCode = function (id) {
  const el = document.getElementById(id);
  if (el) {
    navigator.clipboard.writeText(el.textContent);
    toast("Code copié", "success");
  }
};

// ════════════════════════════════════════════
//  OLLAMA API
// ════════════════════════════════════════════

async function checkConnection() {
  const dot = dom.connectionStatus.querySelector(".status-dot");
  const txt = dom.connectionStatus.querySelector(".status-text");
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      dot.classList.remove("disconnected");
      dot.classList.add("connected");
      txt.textContent = "Ollama connecté";
      return true;
    }
    throw new Error("not ok");
  } catch {
    dot.classList.remove("connected");
    dot.classList.add("disconnected");
    txt.textContent = "Ollama déconnecté";
    return false;
  }
}

async function fetchModels() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.models || [];
  } catch (err) {
    console.error("fetchModels:", err);
    return [];
  }
}

async function fetchModelInfo(name) {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("fetchModelInfo:", err);
    return null;
  }
}

async function* streamChat(model, messages) {
  abortController = new AbortController();

  const temp = parseFloat(dom.temperature.value) || 0.7;

  const body = {
    model,
    messages,
    stream: true,
    options: {
      temperature: temp,
    },
  };

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: abortController.signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // garder le fragment incomplet

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message && json.message.content) {
          yield { token: json.message.content, done: false };
        }
        if (json.done) {
          yield {
            token: "",
            done: true,
            total_duration: json.total_duration,
            eval_count: json.eval_count,
            eval_duration: json.eval_duration,
          };
        }
      } catch (e) {
        console.warn("JSON parse:", line, e);
      }
    }
  }

  // Traiter le reste du buffer
  if (buffer.trim()) {
    try {
      const json = JSON.parse(buffer);
      if (json.message && json.message.content) {
        yield { token: json.message.content, done: false };
      }
      if (json.done) {
        yield {
          token: "",
          done: true,
          total_duration: json.total_duration,
          eval_count: json.eval_count,
          eval_duration: json.eval_duration,
        };
      }
    } catch (e) {
      console.warn("JSON parse final:", buffer, e);
    }
  }
}

// ════════════════════════════════════════════
//  LOAD MODELS
// ════════════════════════════════════════════

async function loadModels() {
  const models = await fetchModels();
  if (!models.length) {
    dom.modelName.textContent = "Aucun modèle";
    dom.modelSelect.innerHTML = '<option value="">Aucun modèle</option>';
    toast("Aucun modèle trouvé. Installez-en avec : ollama pull", "warning");
    return;
  }

  // Dropdown dans header
  dom.modelDropdown.innerHTML = models.map(m => {
    const size = formatBytes(m.size);
    const active = m.name === currentModel ? "active" : "";
    return `<div class="model-option ${active}" data-model="${m.name}">
      <span class="model-option-name">${m.name}</span>
      <span class="model-option-size">${size}</span>
    </div>`;
  }).join("");

  // Select dans settings
  dom.modelSelect.innerHTML = models.map(m => {
    const size = formatBytes(m.size);
    return `<option value="${m.name}" ${m.name === currentModel ? "selected" : ""}>${m.name} (${size})</option>`;
  }).join("");

  // Si pas de modèle sélectionné, prendre le premier
  if (!currentModel || !models.find(m => m.name === currentModel)) {
    currentModel = models[0].name;
    localStorage.setItem("ollama-model", currentModel);
  }

  dom.modelName.textContent = currentModel;
  toast(`${models.length} modèle(s) chargé(s)`, "success");

  // Bind click sur dropdown
  dom.modelDropdown.querySelectorAll(".model-option").forEach(opt => {
    opt.addEventListener("click", () => {
      currentModel = opt.dataset.model;
      localStorage.setItem("ollama-model", currentModel);
      dom.modelName.textContent = currentModel;
      dom.modelSelect.value = currentModel;
      closeModelDropdown();
      toast(`Modèle : ${currentModel}`, "info");
      // Mettre à jour les classes active
      dom.modelDropdown.querySelectorAll(".model-option").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
    });
  });
}

// ════════════════════════════════════════════
//  MODEL DROPDOWN (header)
// ════════════════════════════════════════════

let dropdownOpen = false;

function toggleModelDropdown() {
  dropdownOpen ? closeModelDropdown() : openModelDropdown();
}

function openModelDropdown() {
  dom.modelDropdown.classList.add("open");
  dropdownOpen = true;
}

function closeModelDropdown() {
  dom.modelDropdown.classList.remove("open");
  dropdownOpen = false;
}

// ════════════════════════════════════════════
//  CONVERSATIONS LIST
// ════════════════════════════════════════════

function renderConversations() {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  if (!sorted.length) {
    dom.conversationsList.innerHTML = `
      <div class="conversations-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Aucune conversation</span>
      </div>`;
    return;
  }

  dom.conversationsList.innerHTML = sorted.map(c => `
    <div class="conv-item ${c.id === currentConvId ? 'active' : ''}" data-id="${c.id}">
      <span class="conv-title">${esc(c.title)}</span>
      <button class="conv-delete" data-id="${c.id}" title="Supprimer">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join("");

  // Bind clicks
  dom.conversationsList.querySelectorAll(".conv-item").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".conv-delete")) {
        e.stopPropagation();
        deleteConversation(el.dataset.id);
        return;
      }
      openConversation(el.dataset.id);
    });
  });
}

// ════════════════════════════════════════════
//  CONVERSATION OPERATIONS
// ════════════════════════════════════════════

function newChat() {
  currentConvId = null;
  dom.headerTitle.textContent = "Nouvelle conversation";
  dom.chatMessages.querySelectorAll(".message").forEach(m => m.remove());
  showWelcome(true);
  renderConversations();
  dom.userInput.focus();
}

function openConversation(id) {
  currentConvId = id;
  const conv = getConv();
  if (!conv) return;

  dom.headerTitle.textContent = conv.title;
  showWelcome(false);
  renderMessages(conv.messages);
  renderConversations();

  // Fermer la sidebar sur mobile
  if (window.innerWidth <= 768) {
    dom.sidebar.classList.add("collapsed");
    dom.sidebarBackdrop.classList.remove("visible");
  }
}

function deleteConversation(id) {
  if (!confirm("Supprimer cette conversation ?")) return;
  conversations = conversations.filter(c => c.id !== id);
  save();
  if (currentConvId === id) {
    newChat();
  }
  renderConversations();
  toast("Conversation supprimée", "info");
}

function createConversation(firstMessage) {
  const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + "…" : firstMessage;
  const conv = {
    id: uid(),
    title,
    model: currentModel,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  conversations.push(conv);
  currentConvId = conv.id;
  dom.headerTitle.textContent = title;
  save();
  renderConversations();
  return conv;
}

// ════════════════════════════════════════════
//  RENDER MESSAGES
// ════════════════════════════════════════════

function renderMessages(messages) {
  // Supprimer les anciens messages (pas le welcome)
  dom.chatMessages.querySelectorAll(".message").forEach(m => m.remove());

  messages.forEach(msg => {
    appendMessageBubble(msg.role, msg.content, msg.meta);
  });
  scrollBottom();
}

function appendMessageBubble(role, content, meta) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  const avatarSvg = role === "user"
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

  div.innerHTML = `
    <div class="message-avatar">${avatarSvg}</div>
    <div class="message-bubble">
      <div class="message-content msg-content">${renderMd(content)}</div>
      ${meta ? renderMeta(meta) : ""}
      <div class="message-actions">
        <button onclick="copyMessage(this)">Copier</button>
      </div>
    </div>
  `;

  // Insérer avant le welcome screen
  dom.chatMessages.appendChild(div);
  return div;
}

function renderMeta(meta) {
  const parts = [];
  if (meta.model) parts.push(meta.model);
  if (meta.duration) parts.push(meta.duration);
  if (meta.tokens) parts.push(meta.tokens + " tokens");
  if (!parts.length) return "";
  return `<div class="message-stats">${parts.join(" · ")}</div>`;
}

window.copyMessage = function (btn) {
  const content = btn.closest(".message-bubble").querySelector(".message-content");
  if (content) {
    navigator.clipboard.writeText(content.textContent);
    toast("Message copié", "success");
  }
};

// ════════════════════════════════════════════
//  SEND MESSAGE
// ════════════════════════════════════════════

async function sendMessage(text) {
  if (!text || !text.trim() || isGenerating) return;

  text = text.trim();

  if (!currentModel) {
    toast("Sélectionnez un modèle d'abord", "warning");
    return;
  }

  // Créer la conversation si nécessaire
  let conv = getConv();
  if (!conv) {
    conv = createConversation(text);
  }

  showWelcome(false);

  // Ajouter le message utilisateur
  conv.messages.push({ role: "user", content: text });
  conv.updatedAt = Date.now();
  save();

  appendMessageBubble("user", text);
  scrollBottom();

  // Vider l'input
  dom.userInput.value = "";
  dom.userInput.style.height = "auto";
  dom.btnSend.disabled = true;

  // Préparer le message assistant (vide pour commencer)
  const assistantDiv = appendMessageBubble("assistant", "");
  const contentEl = assistantDiv.querySelector(".message-content");
  contentEl.innerHTML = '<span class="skeleton" style="display:inline-block;width:60px;height:16px;"></span>';

  setGenerating(true);

  let fullContent = "";
  let evalCount = 0;
  let totalDuration = 0;

  try {
    // Construire le tableau de messages pour l'API
    const apiMessages = [];

    // System prompt
    const sysPrompt = dom.systemPrompt.value.trim();
    if (sysPrompt) {
      apiMessages.push({ role: "system", content: sysPrompt });
    }

    // Historique
    conv.messages.forEach(m => {
      apiMessages.push({ role: m.role, content: m.content });
    });

    const stream = streamChat(currentModel, apiMessages);

    for await (const chunk of stream) {
      if (chunk.token) {
        fullContent += chunk.token;
        contentEl.innerHTML = renderMd(fullContent);
        scrollBottom();
      }
      if (chunk.done && chunk.eval_count) {
        evalCount = chunk.eval_count;
        totalDuration = chunk.total_duration;
      }
    }

    // Métadonnées
    const meta = { model: currentModel };
    if (totalDuration) {
      meta.duration = (totalDuration / 1e9).toFixed(1) + "s";
    }
    if (evalCount) {
      meta.tokens = evalCount;
    }

    // Ajouter les stats
    const statsHtml = renderMeta(meta);
    if (statsHtml) {
      const statsEl = document.createElement("div");
      statsEl.innerHTML = statsHtml;
      const bubble = contentEl.closest(".message-bubble");
      const actions = bubble.querySelector(".message-actions");
      bubble.insertBefore(statsEl.firstElementChild, actions);
    }

    // Sauvegarder
    conv.messages.push({ role: "assistant", content: fullContent, meta });
    conv.updatedAt = Date.now();
    save();
    renderConversations();

  } catch (err) {
    if (err.name === "AbortError") {
      contentEl.innerHTML = renderMd(fullContent) + '<p><em>(Génération interrompue)</em></p>';
      conv.messages.push({
        role: "assistant",
        content: fullContent + "\n\n*(Génération interrompue)*",
      });
      save();
      toast("Génération arrêtée", "info");
    } else {
      console.error("streamChat error:", err);
      contentEl.innerHTML = `<p style="color:var(--error)">Erreur : ${esc(err.message)}</p>`;
      toast("Erreur de génération", "error");
    }
  } finally {
    setGenerating(false);
  }
}

function stopGeneration() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

function setGenerating(state) {
  isGenerating = state;
  dom.typingIndicator.style.display = state ? "flex" : "none";
  dom.btnSend.style.display = state ? "none" : "flex";
  dom.btnStop.style.display = state ? "flex" : "none";
  dom.userInput.disabled = state;
  if (!state) dom.userInput.focus();
}

// ════════════════════════════════════════════
//  EXPORT
// ════════════════════════════════════════════

function exportConversation() {
  const conv = getConv();
  if (!conv) {
    toast("Aucune conversation à exporter", "warning");
    return;
  }

  let md = `# ${conv.title}\n\n`;
  md += `**Modèle** : ${conv.model || "?"}\n`;
  md += `**Date** : ${new Date(conv.createdAt).toLocaleString("fr-FR")}\n\n---\n\n`;

  conv.messages.forEach(m => {
    const label = m.role === "user" ? "Vous" : "Assistant";
    md += `### ${label}\n\n${m.content}\n\n`;
    if (m.meta) {
      const parts = [];
      if (m.meta.model) parts.push(m.meta.model);
      if (m.meta.duration) parts.push(m.meta.duration);
      if (m.meta.tokens) parts.push(m.meta.tokens + " tokens");
      if (parts.length) md += `*${parts.join(" · ")}*\n\n`;
    }
    md += "---\n\n";
  });

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${conv.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Conversation exportée", "success");
}

// ════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════

function initTheme() {
  const saved = localStorage.getItem("ollama-theme") || "dark";
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ollama-theme", theme);

  // Icônes
  const moonIcon = dom.btnToggleTheme.querySelector(".icon-moon");
  const sunIcon = dom.btnToggleTheme.querySelector(".icon-sun");

  if (theme === "dark") {
    moonIcon.style.display = "block";
    sunIcon.style.display = "none";
    dom.themeLabel.textContent = "Thème sombre";
    // hljs
    const dark = document.getElementById("hljs-theme-dark");
    const light = document.getElementById("hljs-theme-light");
    if (dark) dark.disabled = false;
    if (light) light.disabled = true;
  } else {
    moonIcon.style.display = "none";
    sunIcon.style.display = "block";
    dom.themeLabel.textContent = "Thème clair";
    const dark = document.getElementById("hljs-theme-dark");
    const light = document.getElementById("hljs-theme-light");
    if (dark) dark.disabled = true;
    if (light) light.disabled = false;
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

// ════════════════════════════════════════════
//  ACCENT COLOR
// ════════════════════════════════════════════

function initAccentColor() {
  const saved = localStorage.getItem("ollama-accent");
  if (saved) setAccentColor(saved);

  // Marquer le swatch actif
  dom.colorSwatches.querySelectorAll(".color-swatch").forEach(sw => {
    if (sw.dataset.color === saved) {
      sw.classList.add("active");
    } else {
      sw.classList.remove("active");
    }
  });
}

function setAccentColor(color) {
  document.documentElement.style.setProperty("--accent", color);
  // Calculer hover (légèrement plus sombre)
  document.documentElement.style.setProperty("--accent-hover", color);
  document.documentElement.style.setProperty("--accent-bg", color + "15");
  document.documentElement.style.setProperty("--accent-glow", color + "40");
  localStorage.setItem("ollama-accent", color);
}

// ════════════════════════════════════════════
//  MODEL INFO
// ════════════════════════════════════════════

async function showModelInfo() {
  if (!currentModel) {
    toast("Aucun modèle sélectionné", "warning");
    return;
  }

  dom.modelInfoContent.innerHTML = '<div class="skeleton" style="height:100px;width:100%;"></div>';
  dom.modelInfoModal.style.display = "flex";

  const info = await fetchModelInfo(currentModel);
  if (!info) {
    dom.modelInfoContent.innerHTML = "<p>Impossible de charger les informations.</p>";
    return;
  }

  let html = '<dl class="model-info-grid">';
  html += `<dt>Nom</dt><dd>${esc(currentModel)}</dd>`;

  if (info.details) {
    if (info.details.family) html += `<dt>Famille</dt><dd>${esc(info.details.family)}</dd>`;
    if (info.details.parameter_size) html += `<dt>Paramètres</dt><dd>${esc(info.details.parameter_size)}</dd>`;
    if (info.details.quantization_level) html += `<dt>Quantization</dt><dd>${esc(info.details.quantization_level)}</dd>`;
    if (info.details.format) html += `<dt>Format</dt><dd>${esc(info.details.format)}</dd>`;
  }

  if (info.model_info) {
    const mi = info.model_info;
    // Chercher des clés utiles
    for (const [key, val] of Object.entries(mi)) {
      if (key.includes("context_length")) {
        html += `<dt>Contexte</dt><dd>${val} tokens</dd>`;
      }
      if (key.includes("embedding_length")) {
        html += `<dt>Embedding</dt><dd>${val}</dd>`;
      }
    }
  }

  if (info.license) {
    html += `<dt>Licence</dt><dd>${esc(info.license.slice(0, 200))}${info.license.length > 200 ? "…" : ""}</dd>`;
  }

  html += "</dl>";

  if (info.template) {
    html += `<h4 style="margin-top:16px;">Template</h4>
    <pre style="background:var(--bg-code);padding:10px;border-radius:6px;font-size:12px;overflow-x:auto;margin-top:8px;">${esc(info.template)}</pre>`;
  }

  dom.modelInfoContent.innerHTML = html;
}

// ════════════════════════════════════════════
//  AUTO RESIZE TEXTAREA
// ════════════════════════════════════════════

function autoResize() {
  dom.userInput.style.height = "auto";
  dom.userInput.style.height = Math.min(dom.userInput.scrollHeight, 200) + "px";
}

// ════════════════════════════════════════════
//  EVENT BINDINGS
// ════════════════════════════════════════════

// ── Sidebar toggle ──
dom.btnSidebarToggle.addEventListener("click", () => {
  dom.sidebar.classList.toggle("collapsed");
  if (window.innerWidth <= 768) {
    if (!dom.sidebar.classList.contains("collapsed")) {
      dom.sidebarBackdrop.classList.add("visible");
    } else {
      dom.sidebarBackdrop.classList.remove("visible");
    }
  }
});

dom.sidebarBackdrop.addEventListener("click", () => {
  dom.sidebar.classList.add("collapsed");
  dom.sidebarBackdrop.classList.remove("visible");
});

// ── New chat ──
dom.btnNewChat.addEventListener("click", newChat);

// ── Theme ──
dom.btnToggleTheme.addEventListener("click", toggleTheme);

// ── Model dropdown ──
dom.btnModelSelect.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleModelDropdown();
});

document.addEventListener("click", (e) => {
  if (dropdownOpen && !dom.modelDropdown.contains(e.target)) {
    closeModelDropdown();
  }
});

// ── Settings modal ──
dom.btnOpenSettings.addEventListener("click", () => {
  dom.settingsModal.style.display = "flex";
});

dom.closeSettings.addEventListener("click", () => {
  dom.settingsModal.style.display = "none";
});

dom.settingsModal.addEventListener("click", (e) => {
  if (e.target === dom.settingsModal) {
    dom.settingsModal.style.display = "none";
  }
});

// ── Model select (dans settings) ──
dom.modelSelect.addEventListener("change", () => {
  currentModel = dom.modelSelect.value;
  localStorage.setItem("ollama-model", currentModel);
  dom.modelName.textContent = currentModel;
  // Mettre à jour le dropdown
  dom.modelDropdown.querySelectorAll(".model-option").forEach(o => {
    o.classList.toggle("active", o.dataset.model === currentModel);
  });
  toast(`Modèle : ${currentModel}`, "info");
});

dom.btnRefreshModels.addEventListener("click", async () => {
  toast("Rafraîchissement…", "info");
  await loadModels();
});

dom.btnModelInfo.addEventListener("click", showModelInfo);

// ── Model info modal ──
dom.closeModelInfo.addEventListener("click", () => {
  dom.modelInfoModal.style.display = "none";
});

dom.modelInfoModal.addEventListener("click", (e) => {
  if (e.target === dom.modelInfoModal) {
    dom.modelInfoModal.style.display = "none";
  }
});

// ── Temperature slider ──
dom.temperature.addEventListener("input", () => {
  dom.tempValue.textContent = dom.temperature.value;
});

dom.temperature.addEventListener("change", () => {
  localStorage.setItem("ollama-temperature", dom.temperature.value);
});

// ── Color swatches ──
dom.colorSwatches.querySelectorAll(".color-swatch").forEach(sw => {
  sw.addEventListener("click", () => {
    dom.colorSwatches.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
    sw.classList.add("active");
    setAccentColor(sw.dataset.color);
  });
});

// ── System prompt ──
dom.systemPrompt.addEventListener("input", () => {
  localStorage.setItem("ollama-system-prompt", dom.systemPrompt.value);
});

// ── Export ──
dom.btnExport.addEventListener("click", exportConversation);

// ── Delete chat ──
dom.btnDeleteChat.addEventListener("click", () => {
  if (currentConvId) {
    deleteConversation(currentConvId);
  } else {
    toast("Aucune conversation sélectionnée", "warning");
  }
});

// ── Send / Stop ──
dom.btnSend.addEventListener("click", () => {
  sendMessage(dom.userInput.value);
});

dom.btnStop.addEventListener("click", stopGeneration);

// ── Input textarea ──
dom.userInput.addEventListener("input", () => {
  autoResize();
  dom.btnSend.disabled = !dom.userInput.value.trim();
});

dom.userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (dom.userInput.value.trim() && !isGenerating) {
      sendMessage(dom.userInput.value);
    }
  }
});

// ── Suggestions ──
document.querySelectorAll(".suggestion-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const prompt = chip.dataset.prompt;
    if (prompt) {
      dom.userInput.value = prompt;
      autoResize();
      sendMessage(prompt);
    }
  });
});

// ════════════════════════════════════════════
//  INITIALIZATION
// ════════════════════════════════════════════

(async function init() {
  console.log("Ollama Chat — Initialisation");

  // Theme
  initTheme();
  initAccentColor();

  // Restore settings
  const savedPrompt = localStorage.getItem("ollama-system-prompt");
  if (savedPrompt) dom.systemPrompt.value = savedPrompt;

  const savedTemp = localStorage.getItem("ollama-temperature");
  if (savedTemp) {
    dom.temperature.value = savedTemp;
    dom.tempValue.textContent = savedTemp;
  }

  // Check connection & load models
  const connected = await checkConnection();
  if (connected) {
    await loadModels();
  } else {
    toast("Ollama non détecté. Lancez 'ollama serve' puis rechargez.", "error");
  }

  // Render conversations
  renderConversations();
  showWelcome(true);

  // Periodic check
  setInterval(async () => {
    const ok = await checkConnection();
    // Si on était déconnecté et maintenant connecté, recharger les modèles
    if (ok && dom.modelSelect.options.length <= 1) {
      await loadModels();
    }
  }, 15000);

  // Focus
  dom.userInput.focus();

  console.log("Initialisation terminée");
})();