// ============================================================
//  Configuration
// ============================================================

const OLLAMA_BASE = "http://localhost:11434";

// ============================================================
//  State
// ============================================================

let conversations = JSON.parse(localStorage.getItem("ollama-conversations") || "[]");
let currentConvId = null;
let currentModel = localStorage.getItem("ollama-model") || "";
let isGenerating = false;
let abortController = null;

// ============================================================
//  DOM References
// ============================================================

const $app = document.getElementById("app");
const $sidebar = document.getElementById("sidebar");
const $sidebarBackdrop = document.getElementById("sidebarBackdrop");
const $btnSidebarToggle = document.getElementById("btnSidebarToggle");
const $btnNewChat = document.getElementById("btnNewChat");
const $connectionStatus = document.getElementById("connectionStatus");
const $modelSelect = document.getElementById("modelSelect");
const $btnRefreshModels = document.getElementById("btnRefreshModels");
const $btnModelInfo = document.getElementById("btnModelInfo");
const $conversationsContainer = document.getElementById("conversationsContainer");
const $emptyConversations = document.getElementById("emptyConversations");
const $systemPrompt = document.getElementById("systemPrompt");
const $temperature = document.getElementById("temperature");
const $tempValue = document.getElementById("tempValue");
const $themeToggle = document.getElementById("themeToggle");
const $colorSwatches = document.getElementById("colorSwatches");
const $headerTitle = document.getElementById("headerTitle");
const $btnModelSelect = document.getElementById("btnModelSelect");
const $modelName = document.getElementById("modelName");
const $modelDropdown = document.getElementById("modelDropdown");
const $btnExport = document.getElementById("btnExport");
const $btnClearChat = document.getElementById("btnClearChat");
const $chatMessages = document.getElementById("chatMessages");
const $welcomeScreen = document.getElementById("welcomeScreen");
const $typingIndicator = document.getElementById("typingIndicator");
const $userInput = document.getElementById("userInput");
const $btnSend = document.getElementById("btnSend");
const $btnStop = document.getElementById("btnStop");
const $modelInfoModal = document.getElementById("modelInfoModal");
const $closeModelInfoModal = document.getElementById("closeModelInfoModal");
const $modelInfoContent = document.getElementById("modelInfoContent");
const $toastContainer = document.getElementById("toastContainer");

// ============================================================
//  Utilities
// ============================================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function toast(message, type = "info") {
    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️",
    };
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
    $toastContainer.appendChild(el);

    setTimeout(() => {
        el.classList.add("toast-out");
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

function saveConversations() {
    localStorage.setItem("ollama-conversations", JSON.stringify(conversations));
}

function getCurrentConv() {
    return conversations.find((c) => c.id === currentConvId) || null;
}

function showWelcome(show) {
    $welcomeScreen.style.display = show ? "flex" : "none";
}

// ============================================================
//  Markdown Rendering
// ============================================================

let codeBlockCounter = 0;

function renderMarkdown(text) {
    if (!text) return "";

    let html = escapeHtml(text);

    // Code blocks with language
    html = html.replace(
        /```(\w*)\n([\s\S]*?)```/g,
        (_, lang, code) => {
            const id = `code-${++codeBlockCounter}`;
            const langLabel = lang || "code";
            let highlighted;
            try {
                highlighted =
                    lang && hljs.getLanguage(lang)
                        ? hljs.highlight(code.trim(), { language: lang }).value
                        : hljs.highlightAuto(code.trim()).value;
            } catch {
                highlighted = escapeHtml(code.trim());
            }
            return `<div class="code-block">
                <div class="code-header">
                    <span class="code-lang">${langLabel}</span>
                    <button class="btn-copy" onclick="copyCode('${id}')">📋 Copier</button>
                </div>
                <pre><code id="${id}" class="hljs language-${langLabel}">${highlighted}</code></pre>
            </div>`;
        }
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Headers
    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Horizontal rule
    html = html.replace(/^---$/gm, "<hr>");

    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

    // Unordered lists
    html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    // Links
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, "");

    return html;
}

window.copyCode = function (id) {
    const codeEl = document.getElementById(id);
    if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent);
        toast("Code copié !", "success");
    }
};

// ============================================================
//  Ollama API
// ============================================================

async function checkConnection() {
    const dot = $connectionStatus.querySelector(".status-dot");
    const txt = $connectionStatus.querySelector(".status-text");

    try {
        const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
            method: "GET",
            signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
            dot.className = "status-dot connected";
            txt.textContent = "Connecté à Ollama";
            console.log("✅ Ollama connecté sur", OLLAMA_BASE);
            return true;
        } else {
            throw new Error(`HTTP ${res.status}`);
        }
    } catch (err) {
        dot.className = "status-dot disconnected";
        txt.textContent = "Ollama non détecté";
        console.warn("❌ Ollama non accessible:", err.message);
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
        console.error("Erreur fetchModels:", err);
        return [];
    }
}

async function fetchModelInfo(modelName) {
    try {
        const res = await fetch(`${OLLAMA_BASE}/api/show`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: modelName }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Erreur fetchModelInfo:", err);
        return null;
    }
}

// ============================================================
//  Models UI
// ============================================================

async function loadModels() {
    $modelSelect.innerHTML = '<option value="">Chargement…</option>';
    $modelName.textContent = "Chargement…";

    const models = await fetchModels();

    if (models.length === 0) {
        $modelSelect.innerHTML = '<option value="">Aucun modèle</option>';
        $modelName.textContent = "Aucun modèle";
        toast("Aucun modèle trouvé. Lancez : ollama pull llama3.2", "warning");
        return;
    }

    // Populate sidebar select
    $modelSelect.innerHTML = "";
    models.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.name;
        const sizeGB = m.size ? (m.size / 1e9).toFixed(1) + " GB" : "";
        opt.textContent = `${m.name} ${sizeGB ? `(${sizeGB})` : ""}`;
        $modelSelect.appendChild(opt);
    });

    // Populate header dropdown
    $modelDropdown.innerHTML = "";
    models.forEach((m) => {
        const div = document.createElement("div");
        div.className = "model-dropdown-item";
        const sizeGB = m.size ? (m.size / 1e9).toFixed(1) + " GB" : "";
        div.innerHTML = `<span>${m.name}</span><span class="model-size">${sizeGB}</span>`;
        div.addEventListener("click", () => {
            selectModel(m.name);
            $modelDropdown.classList.remove("open");
        });
        $modelDropdown.appendChild(div);
    });

    // Restore or select first
    if (currentModel && models.some((m) => m.name === currentModel)) {
        selectModel(currentModel);
    } else {
        selectModel(models[0].name);
    }

    toast(`${models.length} modèle(s) trouvé(s)`, "success");
}

function selectModel(name) {
    currentModel = name;
    localStorage.setItem("ollama-model", name);
    $modelSelect.value = name;
    $modelName.textContent = name;

    // Update dropdown active state
    $modelDropdown.querySelectorAll(".model-dropdown-item").forEach((item) => {
        const itemName = item.querySelector("span").textContent;
        item.classList.toggle("active", itemName === name);
    });
}

async function showModelInfo() {
    if (!currentModel) {
        toast("Aucun modèle sélectionné", "warning");
        return;
    }

    $modelInfoContent.innerHTML = "<p>Chargement…</p>";
    $modelInfoModal.style.display = "flex";

    const info = await fetchModelInfo(currentModel);
    if (!info) {
        $modelInfoContent.innerHTML = "<p>Impossible de récupérer les informations.</p>";
        return;
    }

    let html = `<dl class="model-info-grid">`;
    html += `<dt>Nom</dt><dd>${escapeHtml(currentModel)}</dd>`;

    if (info.details) {
        const d = info.details;
        if (d.family) html += `<dt>Famille</dt><dd>${escapeHtml(d.family)}</dd>`;
        if (d.parameter_size) html += `<dt>Paramètres</dt><dd>${escapeHtml(d.parameter_size)}</dd>`;
        if (d.quantization_level) html += `<dt>Quantification</dt><dd>${escapeHtml(d.quantization_level)}</dd>`;
        if (d.format) html += `<dt>Format</dt><dd>${escapeHtml(d.format)}</dd>`;
    }

    if (info.model_info) {
        const mi = info.model_info;
        if (mi["general.architecture"]) html += `<dt>Architecture</dt><dd>${escapeHtml(mi["general.architecture"])}</dd>`;
        if (mi["general.parameter_count"]) html += `<dt>Nb paramètres</dt><dd>${Number(mi["general.parameter_count"]).toLocaleString()}</dd>`;
    }

    html += `</dl>`;

    if (info.system) {
        html += `<h4 style="margin-top:16px;">System prompt par défaut</h4>`;
        html += `<pre><code>${escapeHtml(info.system)}</code></pre>`;
    }

    if (info.template) {
        html += `<h4 style="margin-top:16px;">Template</h4>`;
        html += `<pre><code>${escapeHtml(info.template.slice(0, 500))}${info.template.length > 500 ? "…" : ""}</code></pre>`;
    }

    $modelInfoContent.innerHTML = html;
}

// ============================================================
//  Conversations
// ============================================================

function renderConversationsList() {
    // Clear non-empty-state children
    const items = $conversationsContainer.querySelectorAll(".conversation-item");
    items.forEach((el) => el.remove());

    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

    if (sorted.length === 0) {
        $emptyConversations.style.display = "flex";
        return;
    }

    $emptyConversations.style.display = "none";

    for (const conv of sorted) {
        const div = document.createElement("div");
        div.className = "conversation-item" + (conv.id === currentConvId ? " active" : "");
        div.innerHTML = `
            <span class="conv-title">${escapeHtml(conv.title)}</span>
            <button class="conv-delete" data-id="${conv.id}" title="Supprimer">✕</button>
        `;
        div.addEventListener("click", (e) => {
            if (e.target.classList.contains("conv-delete")) {
                deleteConversation(e.target.dataset.id);
                e.stopPropagation();
                return;
            }
            openConversation(conv.id);
        });
        $conversationsContainer.appendChild(div);
    }
}

function createConversation(firstMessage) {
    const conv = {
        id: generateId(),
        title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "…" : ""),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    conversations.unshift(conv);
    saveConversations();
    currentConvId = conv.id;
    renderConversationsList();
    return conv;
}

function openConversation(id) {
    currentConvId = id;
    const conv = getCurrentConv();
    if (!conv) return;

    $headerTitle.textContent = conv.title;
    showWelcome(false);
    renderMessages(conv.messages);
    renderConversationsList();
}

function deleteConversation(id) {
    conversations = conversations.filter((c) => c.id !== id);
    saveConversations();

    if (currentConvId === id) {
        currentConvId = null;
        $headerTitle.textContent = "Ollama Chat";
        $chatMessages.innerHTML = "";
        $chatMessages.appendChild($welcomeScreen);
        showWelcome(true);
    }

    renderConversationsList();
    toast("Conversation supprimée", "info");
}

function clearCurrentChat() {
    if (!currentConvId) {
        toast("Pas de conversation active", "warning");
        return;
    }
    const conv = getCurrentConv();
    if (!conv) return;

    conv.messages = [];
    conv.updatedAt = Date.now();
    saveConversations();

    $chatMessages.innerHTML = "";
    $chatMessages.appendChild($welcomeScreen);
    showWelcome(true);

    toast("Conversation effacée", "info");
}

// ============================================================
//  Render messages
// ============================================================

function renderMessages(messages) {
    // Keep welcome screen ref but hide
    $chatMessages.innerHTML = "";
    $chatMessages.appendChild($welcomeScreen);
    showWelcome(false);

    for (const msg of messages) {
        appendMessageBubble(msg.role, msg.content, msg.meta);
    }

    scrollToBottom();
}

function appendMessageBubble(role, content, meta) {
    const div = document.createElement("div");
    div.className = `message ${role}`;

    const avatarText = role === "user" ? "👤" : "🤖";

    div.innerHTML = `
        <div class="message-avatar">${avatarText}</div>
        <div class="message-bubble">
            <div class="message-content msg-content">${renderMarkdown(content)}</div>
            ${
                meta
                    ? `<div class="message-stats">
                        ${meta.model ? `<span>🤖 ${escapeHtml(meta.model)}</span>` : ""}
                        ${meta.duration ? `<span>⏱ ${meta.duration}</span>` : ""}
                        ${meta.tokens ? `<span>📊 ${meta.tokens} tokens</span>` : ""}
                    </div>`
                    : ""
            }
            <div class="message-actions">
                <button onclick="copyMessage(this)" title="Copier">📋 Copier</button>
            </div>
        </div>
    `;

    $chatMessages.appendChild(div);
    scrollToBottom();
    return div;
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        $chatMessages.scrollTop = $chatMessages.scrollHeight;
    });
}

window.copyMessage = function (btn) {
    const bubble = btn.closest(".message-bubble");
    const content = bubble.querySelector(".message-content");
    navigator.clipboard.writeText(content.textContent);
    toast("Message copié !", "success");
};

// ============================================================
//  Chat — Stream
// ============================================================

async function sendMessage(text) {
    if (!text.trim() || isGenerating) return;
    if (!currentModel) {
        toast("Sélectionnez un modèle d'abord", "warning");
        return;
    }

    // Get or create conversation
    let conv = getCurrentConv();
    if (!conv) {
        conv = createConversation(text);
        showWelcome(false);
    }

    // Add user message
    conv.messages.push({ role: "user", content: text });
    conv.updatedAt = Date.now();
    saveConversations();
    appendMessageBubble("user", text);

    // Clear input
    $userInput.value = "";
    $userInput.style.height = "auto";
    $btnSend.disabled = true;

    // Prepare assistant bubble
    const assistantDiv = appendMessageBubble("assistant", "");
    const contentEl = assistantDiv.querySelector(".message-content");
    contentEl.innerHTML = '<span class="skeleton" style="display:inline-block;width:60px;height:16px;"></span>';

    // Build request
    const systemPrompt = $systemPrompt.value.trim();
    const temperature = parseFloat($temperature.value);

    const messages = [];
    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    for (const m of conv.messages) {
        messages.push({ role: m.role, content: m.content });
    }

    const body = {
        model: currentModel,
        messages,
        stream: true,
        options: { temperature },
    };

    // Start streaming
    setGenerating(true);
    abortController = new AbortController();
    let fullContent = "";
    let evalCount = 0;
    let totalDuration = 0;

    try {
        const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: abortController.signal,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Ollama API erreur ${res.status}: ${errText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let firstToken = true;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;

                let chunk;
                try {
                    chunk = JSON.parse(line);
                } catch {
                    continue;
                }

                if (chunk.message && chunk.message.content) {
                    if (firstToken) {
                        contentEl.innerHTML = "";
                        firstToken = false;
                    }
                    fullContent += chunk.message.content;
                    contentEl.innerHTML = renderMarkdown(fullContent);
                    scrollToBottom();
                }

                if (chunk.done && chunk.eval_count) {
                    evalCount = chunk.eval_count;
                    totalDuration = chunk.total_duration;
                }
            }
        }

        // Meta
        const meta = { model: currentModel };
        if (totalDuration) meta.duration = (totalDuration / 1e9).toFixed(1) + "s";
        if (evalCount) meta.tokens = evalCount;

        // Add stats under message
        const statsDiv = document.createElement("div");
        statsDiv.className = "message-stats";
        const parts = [];
        if (meta.model) parts.push(`🤖 ${meta.model}`);
        if (meta.duration) parts.push(`⏱ ${meta.duration}`);
        if (meta.tokens) parts.push(`📊 ${meta.tokens} tokens`);
        statsDiv.innerHTML = parts.map((p) => `<span>${p}</span>`).join("");
        contentEl.parentElement.appendChild(statsDiv);

        // Save
        conv.messages.push({ role: "assistant", content: fullContent, meta });
        conv.updatedAt = Date.now();
        saveConversations();
        renderConversationsList();

    } catch (err) {
        if (err.name === "AbortError") {
            contentEl.innerHTML += `<p><em>(Génération interrompue)</em></p>`;
            conv.messages.push({
                role: "assistant",
                content: fullContent + "\n\n*(Génération interrompue)*",
            });
            saveConversations();
            toast("Génération arrêtée", "info");
        } else {
            console.error("❌ streamChat error:", err);
            contentEl.innerHTML = `<p style="color:var(--error)">❌ Erreur : ${escapeHtml(err.message)}</p>`;
            toast("Erreur lors de la génération", "error");
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
    $typingIndicator.style.display = state ? "flex" : "none";
    $btnSend.style.display = state ? "none" : "flex";
    $btnStop.style.display = state ? "flex" : "none";
    $userInput.disabled = state;
    if (!state) $userInput.focus();
}

// ============================================================
//  Export
// ============================================================

function exportConversation() {
    const conv = getCurrentConv();
    if (!conv) {
        toast("Pas de conversation à exporter", "warning");
        return;
    }

    let md = `# ${conv.title}\n\n`;
    for (const m of conv.messages) {
        const label = m.role === "user" ? "**Vous**" : "**Assistant**";
        md += `${label}:\n${m.content}\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conv.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Conversation exportée !", "success");
}

// ============================================================
//  Theme
// ============================================================

function initTheme() {
    const savedTheme = localStorage.getItem("ollama-theme") || "dark";
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ollama-theme", theme);

    const isDark = theme === "dark";
    $themeToggle.classList.toggle("active", isDark);

    // Toggle highlight.js theme
    document.getElementById("hljs-theme-dark").disabled = !isDark;
    document.getElementById("hljs-theme-light").disabled = isDark;
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
}

// ============================================================
//  Accent Color
// ============================================================

function initAccentColor() {
    const saved = localStorage.getItem("ollama-accent");
    if (saved) setAccentColor(saved);
}

function setAccentColor(color) {
    document.documentElement.style.setProperty("--accent", color);
    document.documentElement.style.setProperty("--accent-hover", color);
    document.documentElement.style.setProperty("--accent-bg", color + "18");
    document.documentElement.style.setProperty("--accent-glow", color + "4D");
    document.documentElement.style.setProperty("--logo-color", color);
    localStorage.setItem("ollama-accent", color);

    // Update active swatch
    $colorSwatches.querySelectorAll(".color-swatch").forEach((s) => {
        s.classList.toggle("active", s.dataset.color === color);
    });
}

// ============================================================
//  Textarea auto-resize
// ============================================================

function autoResize() {
    $userInput.style.height = "auto";
    $userInput.style.height = Math.min($userInput.scrollHeight, 200) + "px";
    $btnSend.disabled = !$userInput.value.trim();
}

// ============================================================
//  Event Listeners
// ============================================================

// Sidebar toggle
$btnSidebarToggle.addEventListener("click", () => {
    $sidebar.classList.toggle("collapsed");
    $sidebarBackdrop.classList.toggle("visible");
});

$sidebarBackdrop.addEventListener("click", () => {
    $sidebar.classList.add("collapsed");
    $sidebarBackdrop.classList.remove("visible");
});

// New chat
$btnNewChat.addEventListener("click", () => {
    currentConvId = null;
    $headerTitle.textContent = "Ollama Chat";
    $chatMessages.innerHTML = "";
    $chatMessages.appendChild($welcomeScreen);
    showWelcome(true);
    renderConversationsList();
    $userInput.focus();
});

// Models
$btnRefreshModels.addEventListener("click", async () => {
    toast("Recherche des modèles…", "info");
    await loadModels();
});

$modelSelect.addEventListener("change", () => {
    selectModel($modelSelect.value);
});

$btnModelSelect.addEventListener("click", () => {
    $modelDropdown.classList.toggle("open");
});

// Close dropdown on outside click
document.addEventListener("click", (e) => {
    if (!e.target.closest("#btnModelSelect") && !e.target.closest("#modelDropdown")) {
        $modelDropdown.classList.remove("open");
    }
});

$btnModelInfo.addEventListener("click", showModelInfo);

$closeModelInfoModal.addEventListener("click", () => {
    $modelInfoModal.style.display = "none";
});

$modelInfoModal.addEventListener("click", (e) => {
    if (e.target === $modelInfoModal) $modelInfoModal.style.display = "none";
});

// Temperature
$temperature.addEventListener("input", () => {
    $tempValue.textContent = $temperature.value;
});

// Theme
$themeToggle.addEventListener("click", toggleTheme);

// Accent colors
$colorSwatches.addEventListener("click", (e) => {
    const swatch = e.target.closest(".color-swatch");
    if (swatch) setAccentColor(swatch.dataset.color);
});

// Send
$btnSend.addEventListener("click", () => {
    sendMessage($userInput.value);
});

$btnStop.addEventListener("click", stopGeneration);

// Input
$userInput.addEventListener("input", autoResize);
$userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if ($userInput.value.trim() && !isGenerating) {
            sendMessage($userInput.value);
        }
    }
});

// Suggestions
document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
            $userInput.value = prompt;
            autoResize();
            sendMessage(prompt);
        }
    });
});

// Export & Clear
$btnExport.addEventListener("click", exportConversation);
$btnClearChat.addEventListener("click", clearCurrentChat);

// ============================================================
//  Init
// ============================================================

(async function init() {
    console.log("🚀 Ollama Chat — Initialisation");

    // Theme & accent
    initTheme();
    initAccentColor();

    // Restore system prompt
    const savedPrompt = localStorage.getItem("ollama-system-prompt");
    if (savedPrompt) $systemPrompt.value = savedPrompt;
    $systemPrompt.addEventListener("input", () => {
        localStorage.setItem("ollama-system-prompt", $systemPrompt.value);
    });

    // Restore temperature
    const savedTemp = localStorage.getItem("ollama-temperature");
    if (savedTemp) {
        $temperature.value = savedTemp;
        $tempValue.textContent = savedTemp;
    }
    $temperature.addEventListener("change", () => {
        localStorage.setItem("ollama-temperature", $temperature.value);
    });

    // Check connection
    const connected = await checkConnection();
    if (connected) {
        await loadModels();
    }

    // Render conversations
    renderConversationsList();
    showWelcome(true);

    // Periodic connection check
    setInterval(checkConnection, 15000);

    // Focus input
    $userInput.focus();

    console.log("✅ Initialisation terminée");
})();
