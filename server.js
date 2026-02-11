/**
 * ============================================
 *  OLLAMA CHAT — Express.js Server
 * ============================================
 *
 *  Utilise ollama-js officiel pour communiquer
 *  avec le serveur Ollama local.
 *
 *  npm install express ollama uuid
 *
 * ============================================
 */

import express from 'express';
import { Ollama } from 'ollama';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// ── __dirname en ESM ──
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Config ──
const PORT        = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DATA_DIR    = join(__dirname, 'data');
const CONVS_FILE  = join(DATA_DIR, 'conversations.json');

// ── Ollama client (ollama-js officiel) ──
const ollama = new Ollama({ host: OLLAMA_HOST });

// ── Express ──
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'public')));

// ══════════════════════════════════════════
//  DATA PERSISTENCE (simple JSON file)
// ══════════════════════════════════════════

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function loadConversations() {
    ensureDataDir();
    try {
        if (fs.existsSync(CONVS_FILE)) {
            const raw = fs.readFileSync(CONVS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('❌ Erreur lecture conversations:', err.message);
    }
    return {};
}

function saveConversations(convs) {
    ensureDataDir();
    try {
        fs.writeFileSync(CONVS_FILE, JSON.stringify(convs, null, 2), 'utf-8');
    } catch (err) {
        console.error('❌ Erreur écriture conversations:', err.message);
    }
}

// ══════════════════════════════════════════
//  ROUTE: Health check
// ══════════════════════════════════════════

app.get('/api/health', async (req, res) => {
    try {
        // Simple list call to verify Ollama is reachable
        await ollama.list();
        res.json({ success: true, status: 'connected' });
    } catch (err) {
        res.json({ success: false, status: 'disconnected', error: err.message });
    }
});

// ══════════════════════════════════════════
//  ROUTE: Version
// ══════════════════════════════════════════

app.get('/api/version', async (req, res) => {
    try {
        // ollama-js n'a pas de .version() direct,
        // on fait un fetch brut sur /api/version
        const response = await fetch(`${OLLAMA_HOST}/api/version`);
        const data = await response.json();
        res.json({ success: true, version: data.version || 'inconnue' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ══════════════════════════════════════════
//  ROUTE: List models (tags)
// ══════════════════════════════════════════

app.get('/api/tags', async (req, res) => {
    try {
        const response = await ollama.list();
        const models = (response.models || []).map(m => ({
            name:        m.name,
            model:       m.model,
            size:        m.size,
            digest:      m.digest,
            modified_at: m.modified_at,
            details:     m.details || {}
        }));
        res.json({ success: true, models });
    } catch (err) {
        console.error('❌ /api/tags error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ══════════════════════════════════════════
//  ROUTE: Running models (ps)
// ══════════════════════════════════════════

app.get('/api/ps', async (req, res) => {
    try {
        const response = await ollama.ps();
        const running = (response.models || []).map(m => ({
            name:        m.name,
            model:       m.model,
            size:        m.size,
            digest:      m.digest,
            expires_at:  m.expires_at,
            size_vram:   m.size_vram,
            details:     m.details || {}
        }));
        res.json({ success: true, running });
    } catch (err) {
        console.error('❌ /api/ps error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ══════════════════════════════════════════
//  ROUTE: Show model details
// ══════════════════════════════════════════

app.post('/api/show', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: 'name requis' });
        }

        const response = await ollama.show({ model: name });
        res.json({
            success: true,
            info: {
                license:    response.license,
                modelfile:  response.modelfile,
                parameters: response.parameters,
                template:   response.template,
                details:    response.details,
                model_info: response.model_info
            }
        });
    } catch (err) {
        console.error('❌ /api/show error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ══════════════════════════════════════════
//  ROUTE: Load model into memory
// ══════════════════════════════════════════

app.post('/api/generate/load', async (req, res) => {
    try {
        const { model } = req.body;
        if (!model) {
            return res.status(400).json({ success: false, error: 'model requis' });
        }

        // Envoyer un generate avec keep_alive pour charger le modèle
        await ollama.generate({
            model,
            prompt: '',
            keep_alive: '30m'
        });

        res.json({ success: true, message: `Modèle ${model} chargé` });
    } catch (err) {
        console.error('❌ /api/generate/load error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ══════════════════════════════════════════
//  ROUTE: Unload model from memory
// ══════════════════════════════════════════

app.post('/api/generate/unload', async (req, res) => {
    try {
        const { model } = req.body;
        if (!model) {
            return res.status(400).json({ success: false, error: 'model requis' });
        }

        // keep_alive: 0 force le déchargement
        await ollama.generate({
            model,
            prompt: '',
            keep_alive: 0
        });

        res.json({ success: true, message: `Modèle ${model} déchargé` });
    } catch (err) {
        console.error('❌ /api/generate/unload error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ══════════════════════════════════════════
//  ROUTE: Chat streaming (SSE)
// ══════════════════════════════════════════

app.post('/api/chat/stream', async (req, res) => {
    const { model, messages, options } = req.body;

    if (!model || !messages) {
        return res.status(400).json({ success: false, error: 'model et messages requis' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
        const chatOptions = {
            num_predict: options?.num_predict || 4096,
        };

        if (options?.temperature !== undefined) {
            chatOptions.temperature = options.temperature;
        }

        const stream = await ollama.chat({
            model,
            messages,
            stream: true,
            options: chatOptions
        });

        let aborted = false;

        req.on('close', () => {
            aborted = true;
        });

        for await (const chunk of stream) {
            if (aborted) break;

            const payload = {
                token:   chunk.message?.content || '',
                done:    chunk.done || false,
                role:    chunk.message?.role || 'assistant'
            };

            // Ajouter les stats quand c'est terminé
            if (chunk.done) {
                payload.total_duration = chunk.total_duration;
                payload.eval_count     = chunk.eval_count;
                payload.eval_duration  = chunk.eval_duration;
                payload.prompt_eval_count    = chunk.prompt_eval_count;
                payload.prompt_eval_duration = chunk.prompt_eval_duration;
            }

            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }

        // Signal de fin
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (err) {
        console.error('❌ /api/chat/stream error:', err.message);

        const errorPayload = {
            error: true,
            message: err.message
        };
        res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

// ══════════════════════════════════════════
//  ROUTE: Generate title for conversation
// ══════════════════════════════════════════

app.post('/api/chat/title', async (req, res) => {
    try {
        const { model, messages } = req.body;

        if (!model || !messages || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'model et messages requis' });
        }

        // Prendre les premiers messages pour le contexte
        const contextMessages = messages.slice(0, 4);

        const titleMessages = [
            ...contextMessages,
            {
                role: 'user',
                content: 'Génère un titre très court (max 6 mots) pour cette conversation. ' +
                         'Réponds uniquement avec le titre, sans guillemets, sans ponctuation finale, sans explication.'
            }
        ];

        const response = await ollama.chat({
            model,
            messages: titleMessages,
            stream: false,
            options: {
                temperature: 0.3,
                num_predict: 30
            }
        });

        let title = response.message?.content?.trim() || 'Nouvelle conversation';

        // Nettoyer le titre
        title = title.replace(/^["'«]|["'»]$/g, '').trim();
        title = title.replace(/[.!?]$/, '').trim();

        // Limiter la longueur
        if (title.length > 60) {
            title = title.substring(0, 57) + '…';
        }

        res.json({ success: true, title });

    } catch (err) {
        console.error('❌ /api/chat/title error:', err.message);
        res.json({ success: true, title: 'Nouvelle conversation' });
    }
});

// ══════════════════════════════════════════
//  ROUTES: Conversations CRUD
// ══════════════════════════════════════════

// List all conversations
app.get('/api/chat/conversations', (req, res) => {
    try {
        const convs = loadConversations();

        // Retourner un résumé (sans les messages complets)
        const list = Object.values(convs)
            .map(c => ({
                id:         c.id,
                title:      c.title,
                model:      c.model,
                createdAt:  c.createdAt,
                updatedAt:  c.updatedAt,
                messageCount: (c.messages || []).length
            }))
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json({ success: true, conversations: list });
    } catch (err) {
        console.error('❌ GET /api/chat/conversations error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get single conversation
app.get('/api/chat/conversation/:id', (req, res) => {
    try {
        const convs = loadConversations();
        const conv  = convs[req.params.id];

        if (!conv) {
            return res.status(404).json({ success: false, error: 'Conversation introuvable' });
        }

        res.json({ success: true, conversation: conv });
    } catch (err) {
        console.error('❌ GET /api/chat/conversation/:id error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Create conversation
app.post('/api/chat/conversation', (req, res) => {
    try {
        const { title, model } = req.body;
        const convs = loadConversations();

        const id  = uuidv4();
        const now = new Date().toISOString();

        const conv = {
            id,
            title:     title || 'Nouvelle conversation',
            model:     model || '',
            messages:  [],
            createdAt: now,
            updatedAt: now
        };

        convs[id] = conv;
        saveConversations(convs);

        res.json({ success: true, conversation: conv });
    } catch (err) {
        console.error('❌ POST /api/chat/conversation error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Save conversation (append/replace messages)
app.post('/api/chat/conversation/:id/save', (req, res) => {
    try {
        const convs = loadConversations();
        const conv  = convs[req.params.id];

        if (!conv) {
            return res.status(404).json({ success: false, error: 'Conversation introuvable' });
        }

        const { messages, title, model } = req.body;

        if (messages !== undefined) {
            conv.messages = messages;
        }
        if (title !== undefined) {
            conv.title = title;
        }
        if (model !== undefined) {
            conv.model = model;
        }

        conv.updatedAt = new Date().toISOString();
        convs[req.params.id] = conv;
        saveConversations(convs);

        res.json({ success: true, conversation: conv });
    } catch (err) {
        console.error('❌ POST /api/chat/conversation/:id/save error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Rename conversation
app.put('/api/chat/conversation/:id', (req, res) => {
    try {
        const convs = loadConversations();
        const conv  = convs[req.params.id];

        if (!conv) {
            return res.status(404).json({ success: false, error: 'Conversation introuvable' });
        }

        const { title } = req.body;
        if (title) {
            conv.title = title;
        }

        conv.updatedAt = new Date().toISOString();
        convs[req.params.id] = conv;
        saveConversations(convs);

        res.json({ success: true, conversation: conv });
    } catch (err) {
        console.error('❌ PUT /api/chat/conversation/:id error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete conversation
app.delete('/api/chat/conversation/:id', (req, res) => {
    try {
        const convs = loadConversations();

        if (!convs[req.params.id]) {
            return res.status(404).json({ success: false, error: 'Conversation introuvable' });
        }

        delete convs[req.params.id];
        saveConversations(convs);

        res.json({ success: true });
    } catch (err) {
        console.error('❌ DELETE /api/chat/conversation/:id error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ══════════════════════════════════════════
//  FALLBACK: SPA
// ══════════════════════════════════════════

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ══════════════════════════════════════════
//  START
// ══════════════════════════════════════════

app.listen(PORT, () => {
    console.log('');
    console.log('  ╔═══════════════════════════════════════════╗');
    console.log('  ║   🤖  Ollama Chat App                     ║');
    console.log(`  ║   🌐  http://localhost:${PORT}               ║`);
    console.log('  ║   📡  Ollama: http://127.0.0.1:11434      ║');
    console.log('  ║   📚  Client: ollama-js officiel          ║');
    console.log('  ╚═══════════════════════════════════════════╝');
    console.log('');

    // Vérification initiale de la connexion Ollama
    ollama.list()
        .then(response => {
            const count = response.models?.length || 0;
            console.log(`  ✅ Ollama connecté — ${count} modèle(s) disponible(s)`);
            if (response.models) {
                response.models.forEach(m => {
                    const sizeGB = (m.size / 1e9).toFixed(1);
                    console.log(`     • ${m.name} (${sizeGB} GB)`);
                });
            }
            console.log('');
        })
        .catch(err => {
            console.log('  ⚠️  Ollama non accessible:', err.message);
            console.log('  💡 Lancez: ollama serve');
            console.log('');
        });
});

export default app;
