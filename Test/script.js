// ============================================================
//  Configuration
// ============================================================

const OLLAMA_BASE = "http://localhost:11434";

// ============================================================
//  State
// ============================================================

let conversations = JSON.parse(localStorage.getItem("ollama-conversations") || "[]");
let currentConvId = null;
let isGenerating = false;
let abortController = null;

// ============================================================
//  DOM References
// ============================================================

const $modelSelect = document.getElementById("model-select");
const $refreshModelsBtn = document.getElementById("refresh-models-btn");
const $temperature = document.getElementById("temperature");
const $tempValue = document.getElementById("temp-value");
const $maxTokens = document.getElementById("max-tokens");
const $systemPrompt = document.getElementById("system-prompt");
const $chatMessages = document.getElementById("chat-messages");
const $chatForm = document.getElementById("chat-form");
const $userInput = document.getElementById("user-input");
const $sendBtn = document.getElementById("send-btn");
const $stopBtn = document.getElementById("stop-btn");
const $typingIndicator = document.getElementById("typing-indicator");
const $chatTitle = document.getElementById("chat-title");
const $newChatBtn = document.getElementById("new-chat-btn");
const $exportBtn = document.getElementById("export-btn");
const $deleteChatBtn = document.getElementById("delete-chat-btn");
const $convsContainer = document.getElementById("conversations-container");
const $connectionStatus = document.getElementById("connection-status");
const $modelInfoModal = document.getElementById("model-info-modal");
const $modelInfoContent = document.getElementById("model-info-content");
const $closeModal = document.getElementById("close-modal");
const $toastContainer = document.getElementById("toast-container");

// ============================================================
//  Utilities
// ============================================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function saveConversations() {
    localStorage.setItem("ollama-conversations", JSON.stringify(conversations));
}

function getCurrentConv() {
    return conversations.find((c) => c.id === currentConvId) || null;
}

// Toast notifications
function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = message;
    el.style.cssText = `
        padding: 12px 20px;
        margin-bottom: 8px;
        border-radius: 8px;
        font-size: 13px;
        color: white;
        animation: toastIn 0.3s ease, toastOut 0.3s ease 3s forwards;
        background: ${type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#6366f1"};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 350px;
        word-break: break-word;
    `;
    $toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// Add toast animations
const toastStyle = document.createElement("style");
toastStyle.textContent = `
    .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column-reverse;
    }
    @keyframes toastIn {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastOut {
        from { opacity: 1; }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(toastStyle);

// Simple Markdown renderer
function renderMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks ```lang\n...\n```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const id = "code-" + generateId();
        return `<div class="code-block-wrapper"><button class="copy-code-btn" onclick="copyCode('${id}')">Copier</button><pre><code id="${id}" class="language-${lang}">${code.trim()}</code></pre></div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Headers
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

    // Unordered lists
    html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, "");

    return html;
}

// Global copy helper
window.copyCode = function (id) {
    const codeEl = document.getElementById(id);
    if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent);
        toast("Code copié !", "success");
    }
};

// ============================================================
//  Ollama API helpers
// ============================================================

async function ollamaFetch(endpoint, options = {}) {
    const url = `${OLLAMA_BASE}${endpoint}`;
    
    // On ajoute les headers par défaut
    const defaultHeaders = {
        "Content-Type": "application/json",
    };

    options.headers = { ...defaultHeaders, ...options.headers };

    try {
        const response = await fetch(url, options);
        return response;
    } catch (err) {
        console.error(`Erreur fetch ${url}:`, err);
        throw err;
    }
}

/** GET /api/tags – liste des modèles locaux */
async function fetchModels() {
    try {
        const res = await ollamaFetch("/api/tags", { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.models || [];
    } catch (err) {
        console.error("fetchModels:", err);
        return [];
    }
}

/** POST /api/show – infos modèle */
async function fetchModelInfo(modelName) {
    try {
        const res = await ollamaFetch("/api/show", {
            method: "POST",
            body: JSON.stringify({ name: modelName }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("fetchModelInfo:", err);
        return null;
    }
}

/**
 * POST /api/chat (streaming NDJSON)
 * Utilise ReadableStream pour lire les tokens au fur et à mesure
 */
async function* streamChat(model, messages) {
    abortController = new AbortController();

    const body = {
        model: model,
        messages: messages,
        stream: true,
        options: {
            temperature: parseFloat($temperature.value),
            num_predict: parseInt($maxTokens.value, 10),
        },
    };

    console.log("📤 Envoi à Ollama:", OLLAMA_BASE + "/api/chat");
    console.log("📤 Body:", JSON.stringify(body, null, 2));

    let res;
    try {
        res = await fetch(`${OLLAMA_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: abortController.signal,
        });
    } catch (err) {
        console.error("❌ Erreur de connexion à Ollama:", err);
        throw new Error(
            `Impossible de contacter Ollama sur ${OLLAMA_BASE}. ` +
            `Vérifiez que 'ollama serve' est lancé. Erreur: ${err.message}`
        );
    }

    if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Ollama API erreur:", res.status, errText);
        throw new Error(`Ollama API erreur ${res.status}: ${errText}`);
    }

    console.log("✅ Stream connecté, lecture des tokens...");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            console.log("✅ Stream terminé");
            break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Chaque ligne est un objet JSON séparé par \n (NDJSON)
        const lines = buffer.split("\n");
        buffer = lines.pop(); // la dernière ligne potentiellement incomplète reste dans le buffer

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
                console.warn("⚠️ JSON parse error sur ligne:", line, e);
            }
        }
    }
}

/** Vérifie si Ollama est accessible */
async function checkConnection() {
    const dot = $connectionStatus.querySelector(".status-dot");
    const txt = $connectionStatus.querySelector(".status-text");
    
    try {
        // On tente un simple GET sur /api/tags
        const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
            method: "GET",
            signal: AbortSignal.timeout(5000), // timeout 5s
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

// ============================================================
//  UI: Models
// ============================================================

async function loadModels() {
    $modelSelect.innerHTML = '<option value="">Chargement...</option>';
    
    const models = await fetchModels();
    
    if (models.length === 0) {
        $modelSelect.innerHTML = '<option value="">Aucun modèle trouvé</option>';
        toast("Aucun modèle trouvé. Lancez : ollama pull llama3.2", "warning");
        return;
    }

    $modelSelect.innerHTML = models
        .map((m) => {
            const size = formatBytes(m.size);
            return `<option value="${m.name}">${m.name} (${size})</option>`;
        })
        .join("");

    toast(`${models.length} modèle(s) chargé(s)`, "success");
    console.log("📋 Modèles disponibles:", models.map(m => m.name));
}

function formatBytes(bytes) {
    if (!bytes) return "?";
    const gb = bytes / 1e9;
    if (gb >= 1) return gb.toFixed(1) + " GB";
    return (bytes / 1e6).toFixed(0) + " MB";
}

// ============================================================
//  UI: Conversations list
// ============================================================

function renderConversationsList() {
    $convsContainer.innerHTML = "";
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    
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
        $convsContainer.appendChild(div);
    }
}

function openConversation(id) {
    currentConvId = id;
    const conv = getCurrentConv();
    if (!conv) return;
    $chatTitle.textContent = conv.title;
    renderMessages(conv.messages);
    renderConversationsList();
}

function deleteConversation(id) {
    conversations = conversations.filter((c) => c.id !== id);
    saveConversations();
    if (currentConvId === id) {
        currentConvId = null;
        $chatTitle.textContent = "Nouvelle conversation";
        $chatMessages.innerHTML = "";
        showWelcome(true);
    }
    renderConversationsList();
    toast("Conversation supprimée", "info");
}

function createConversation(firstMessage) {
    const conv = {
        id: generateId(),
        title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "…" : ""),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    conversations.push(conv);
    currentConvId = conv.id;
    saveConversations();
    renderConversationsList();
    $chatTitle.textContent = conv.title;
    showWelcome(false);
    return conv;
}

// ============================================================
//  UI: Messages
// ============================================================

function showWelcome(show) {
    if (show) {
        if (!document.getElementById("welcome-screen")) {
            $chatMessages.innerHTML = `
                <div class="welcome-screen" id="welcome-screen">
                    <div class="welcome-icon">🦙</div>
                    <h2>Bienvenue sur Ollama Chat</h2>
                    <p>Commencez une conversation avec vos modèles locaux</p>
                    <div class="suggestions">
                        <button class="suggestion-chip" data-prompt="Explique-moi le fonctionnement des réseaux de neurones">🧠 Réseaux de neurones</button>
                        <button class="suggestion-chip" data-prompt="Écris-moi une fonction Python de tri rapide avec des commentaires">🐍 Code Python</button>
                        <button class="suggestion-chip" data-prompt="Quels sont les principes SOLID en programmation ?">📐 Principes SOLID</button>
                        <button class="suggestion-chip" data-prompt="Résume-moi les avantages de Docker pour le développement">🐳 Docker</button>
                    </div>
                </div>`;
            bindSuggestions();
        }
    } else {
        const ws = document.getElementById("welcome-screen");
        if (ws) ws.remove();
    }
}

function renderMessages(messages) {
    $chatMessages.innerHTML = "";
    showWelcome(false);
    for (const msg of messages) {
        appendMessageBubble(msg.role, msg.content, msg.meta);
    }
    scrollToBottom();
}

function appendMessageBubble(role, content, meta) {
    const div = document.createElement("div");
    div.className = `message ${role}`;

    const avatar = role === "user" ? "👤" : "🦙";
    const rendered = role === "assistant" ? renderMarkdown(content) : `<p>${escapeHtml(content)}</p>`;

    let metaHtml = "";
    if (meta) {
        const parts = [];
        if (meta.model) parts.push(meta.model);
        if (meta.duration) parts.push(meta.duration);
        if (meta.tokens) parts.push(meta.tokens + " tokens");
        metaHtml = `<div class="message-meta">${parts.join(" · ")}</div>`;
    }

    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div>
            <div class="message-content">${rendered}</div>
            ${metaHtml}
        </div>
    `;
    $chatMessages.appendChild(div);
    return div;
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        $chatMessages.scrollTop = $chatMessages.scrollHeight;
    });
}

// ============================================================
//  Core: envoyer message & streamer la réponse
// ============================================================

async function sendMessage(text) {
    if (!text.trim() || isGenerating) return;

    const model = $modelSelect.value;
    if (!model) {
        toast("Sélectionnez un modèle d'abord !", "warning");
        return;
    }

    // Créer conversation si nécessaire
    let conv = getCurrentConv();
    if (!conv) {
        conv = createConversation(text);
    }

    // Construire le tableau de messages pour l'API
    const apiMessages = [];
    
    // Prompt système
    const sysProm = $systemPrompt.value.trim();
    if (sysProm) {
        apiMessages.push({ role: "system", content: sysProm });
    }
    
    // Historique de la conversation
    for (const m of conv.messages) {
        apiMessages.push({ role: m.role, content: m.content });
    }
    
    // Nouveau message utilisateur
    apiMessages.push({ role: "user", content: text });

    // Sauvegarder le message utilisateur
    conv.messages.push({ role: "user", content: text });
    conv.updatedAt = Date.now();
    saveConversations();

    // Afficher
    showWelcome(false);
    appendMessageBubble("user", text);
    scrollToBottom();

    // Préparer la bulle assistant pour le streaming
    const assistantDiv = appendMessageBubble("assistant", "");
    const contentEl = assistantDiv.querySelector(".message-content");
    let fullContent = "";

    // État UI
    setGenerating(true);

    try {
        const gen = streamChat(model, apiMessages);
        let evalCount = 0;
        let totalDuration = 0;

        for await (const chunk of gen) {
            fullContent += chunk.token;
            contentEl.innerHTML = renderMarkdown(fullContent);
            scrollToBottom();

            if (chunk.done && chunk.eval_count) {
                evalCount = chunk.eval_count;
                totalDuration = chunk.total_duration;
            }
        }

        // Métadonnées
        const meta = { model };
        if (totalDuration) {
            meta.duration = (totalDuration / 1e9).toFixed(1) + "s";
        }
        if (evalCount) {
            meta.tokens = evalCount;
        }

        // Ajouter les métadonnées sous le message
        const metaDiv = document.createElement("div");
        metaDiv.className = "message-meta";
        const parts = [];
        if (meta.model) parts.push(meta.model);
        if (meta.duration) parts.push(meta.duration);
        if (meta.tokens) parts.push(meta.tokens + " tokens");
        metaDiv.textContent = parts.join(" · ");
        contentEl.parentElement.appendChild(metaDiv);

        // Sauvegarder le message assistant
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
    $sendBtn.style.display = state ? "none" : "flex";
    $stopBtn.style.display = state ? "flex" : "none";
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
    toast("Conversation exportée", "success");
}

// ============================================================
//  Event listeners
// ============================================================

$temperature.addEventListener("input", () => {
    $tempValue.textContent = $temperature.value;
});

$refreshModelsBtn.addEventListener("click", async () => {
    toast("Recherche des modèles...", "info");
    await loadModels();
});

// Double-clic sur le sélecteur = infos modèle
$modelSelect.addEventListener("dblclick", async () => {
    const model = $modelSelect.value;
    if (!model) return;
    toast("Chargement des infos...", "info");
    const info = await fetchModelInfo(model);
    if (!info) {
        toast("Impossible de récupérer les infos", "error");
        return;
    }
    $modelInfoContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(info, null, 2))}</pre>`;
    $modelInfoModal.style.display = "flex";
});

$closeModal.addEventListener("click", () => {
    $modelInfoModal.style.display = "none";
});

$modelInfoModal.addEventListener("click", (e) => {
    if (e.target === $modelInfoModal) $modelInfoModal.style.display = "none";
});

$newChatBtn.addEventListener("click", () => {
    currentConvId = null;
    $chatTitle.textContent = "Nouvelle conversation";
    $chatMessages.innerHTML = "";
    showWelcome(true);
    renderConversationsList();
});

$chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $userInput.value.trim();
    if (text) {
        $userInput.value = "";
        $userInput.style.height = "auto";
        $sendBtn.disabled = true;
        sendMessage(text);
    }
});

$stopBtn.addEventListener("click", stopGeneration);

$userInput.addEventListener("input", () => {
    $userInput.style.height = "auto";
    $userInput.style.height = Math.min($userInput.scrollHeight, 150) + "px";
    $sendBtn.disabled = !$userInput.value.trim();
});

$userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        $chatForm.dispatchEvent(new Event("submit"));
    }
});

$exportBtn.addEventListener("click", exportConversation);

$deleteChatBtn.addEventListener("click", () => {
    if (currentConvId) {
        if (confirm("Supprimer cette conversation ?")) {
            deleteConversation(currentConvId);
        }
    }
});

function bindSuggestions() {
    document.querySelectorAll(".suggestion-chip").forEach((btn) => {
        btn.addEventListener("click", () => {
            const prompt = btn.dataset.prompt;
            $userInput.value = prompt;
            $userInput.dispatchEvent(new Event("input"));
            $chatForm.dispatchEvent(new Event("submit"));
        });
    });
}

// ============================================================
//  Initialisation
// ============================================================

(async function init() {
    console.log("🦙 Ollama Chat - Initialisation...");
    console.log("🔗 URL Ollama:", OLLAMA_BASE);

    const connected = await checkConnection();

    if (connected) {
        await loadModels();
    } else {
        toast(
            "Ollama non détecté sur " + OLLAMA_BASE + ". Lancez 'ollama serve' puis rechargez la page.",
            "error"
        );
    }

    renderConversationsList();
    showWelcome(true);

    // Vérification périodique de la connexion
    setInterval(checkConnection, 15000);
})();
