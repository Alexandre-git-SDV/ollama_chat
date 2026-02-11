/**
 * ============================================
 *  SERVEUR — Point d'entrée
 * ============================================
 */

const app            = require('./app');
const config         = require('./config/env');
const logger         = require('./utils/logger');
const ollamaService  = require('./services/ollama.service');

// ══════════════════════════════════════════
//  Démarrage
// ══════════════════════════════════════════

async function start() {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  🦙 Ollama Chat — Démarrage du serveur');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ── Vérification Ollama ──
  logger.info(`Connexion à Ollama: ${config.ollamaHost}`);
  const connected = await ollamaService.checkConnection();

  if (connected) {
    logger.success('Ollama est connecté !');

    // Afficher les modèles disponibles
    try {
      const models = await ollamaService.listModels();
      logger.info(`${models.length} modèle(s) disponible(s):`);
      models.forEach(m => {
        const sizeGB = (m.size / 1e9).toFixed(1);
        logger.info(`  • ${m.name} (${sizeGB} GB)`);
      });
    } catch (err) {
      logger.warn('Impossible de lister les modèles:', err.message);
    }

    // Afficher la version
    try {
      const version = await ollamaService.getVersion();
      if (version) logger.info(`Version Ollama: ${version}`);
    } catch (_) { /* ignore */ }

  } else {
    logger.warn('⚠️  Ollama non détecté ! Lancez "ollama serve" pour activer les fonctionnalités.');
  }

  // ── Lancement du serveur HTTP ──
  app.listen(config.port, config.host, () => {
    logger.success(`Serveur démarré sur http://${config.host}:${config.port}`);
    logger.info(`Dossier public: ${config.publicDir}`);
    logger.info(`Conversations:  ${config.conversationsDir}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}

// ── Gestion des erreurs non attrapées ──
process.on('uncaughtException', (err) => {
  logger.error('Exception non attrapée:', err.message);
  logger.debug(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promesse rejetée non gérée:', reason);
});

// ── Go ! ──
start();
/*
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║   🤖  Ollama Chat App                     ║');
  console.log(`  ║   🌐  http://localhost:${PORT}               ║`);
  console.log('  ║   📡  Ollama: http://127.0.0.1:11434      ║');
  console.log('  ║   📚  Client: ollama-js officiel          ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});*/