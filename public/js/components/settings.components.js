/**
 * ============================================
 *  Settings Component — Modal Paramètres
 * ============================================
 */
var SettingsComponent = (function () {
  'use strict';

  function init() {
    bindEvents();
    restoreValues();
  }

  function bindEvents() {
    const d = DOM.refs;

    // Ouvrir/fermer
    if (d.btnOpenSettings) {
      d.btnOpenSettings.addEventListener('click', open);
    }
    if (d.closeSettings) {
      d.closeSettings.addEventListener('click', close);
    }
    if (d.settingsModal) {
      d.settingsModal.addEventListener('click', (e) => {
        if (e.target === d.settingsModal) close();
      });
    }

    // Température
    if (d.temperature) {
      d.temperature.addEventListener('input', () => {
        const val = d.temperature.value;
        if (d.tempValue) d.tempValue.textContent = val;
        StorageService.setTemperature(val);
      });
    }

    // System prompt
    if (d.systemPrompt) {
      d.systemPrompt.addEventListener('change', () => {
        StorageService.setSystemPrompt(d.systemPrompt.value);
      });
    }

    // Rafraîchir modèles
    if (d.btnRefreshModels) {
      d.btnRefreshModels.addEventListener('click', async () => {
        await ModelSelectorComponent.loadModels();
        ToastComponent.show('Modèles rafraîchis', 'success');
      });
    }

    // Model select dans settings
    if (d.modelSelect) {
      d.modelSelect.addEventListener('change', () => {
        ModelSelectorComponent.selectModel(d.modelSelect.value);
      });
    }

    // Info modèle
    if (d.btnModelInfo) {
      d.btnModelInfo.addEventListener('click', showModelInfo);
    }
    if (d.closeModelInfo) {
      d.closeModelInfo.addEventListener('click', () => {
        if (d.modelInfoModal) d.modelInfoModal.style.display = 'none';
      });
    }

    // Couleurs accent
    if (d.colorSwatches) {
      d.colorSwatches.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) return;
        const color = swatch.dataset.color;
        ThemeComponent.setAccent(color);
        d.colorSwatches.querySelectorAll('.color-swatch')
          .forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
    }
  }

  function restoreValues() {
    const d = DOM.refs;

    // Température
    const temp = StorageService.getTemperature();
    if (d.temperature) d.temperature.value = temp;
    if (d.tempValue) d.tempValue.textContent = temp;

    // System prompt
    const prompt = StorageService.getSystemPrompt();
    if (d.systemPrompt) d.systemPrompt.value = prompt;

    // Accent color highlight
    const accent = StorageService.getAccent();
    if (d.colorSwatches) {
      d.colorSwatches.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color === accent);
      });
    }
  }

  async function showModelInfo() {
    const d = DOM.refs;
    const model = ModelSelectorComponent.getSelectedModel();
    if (!model) {
      ToastComponent.show('Sélectionnez un modèle', 'warning');
      return;
    }

    if (d.modelInfoContent) {
      d.modelInfoContent.innerHTML = '<p>Chargement…</p>';
    }
    if (d.modelInfoModal) d.modelInfoModal.style.display = 'flex';

    try {
      const data = await OllamaService.showModel(model);
      if (d.modelInfoContent) {
        d.modelInfoContent.innerHTML = `
          <div class="model-info-grid">
            <div class="info-row"><strong>Modèle</strong><span>${Helpers.escapeHtml(model)}</span></div>
            <div class="info-row"><strong>Famille</strong><span>${Helpers.escapeHtml(data.details?.family || '—')}</span></div>
            <div class="info-row"><strong>Paramètres</strong><span>${Helpers.escapeHtml(data.details?.parameter_size || '—')}</span></div>
            <div class="info-row"><strong>Quantisation</strong><span>${Helpers.escapeHtml(data.details?.quantization_level || '—')}</span></div>
            <div class="info-row"><strong>Format</strong><span>${Helpers.escapeHtml(data.details?.format || '—')}</span></div>
          </div>
          ${data.modelfile ? `<details><summary>Modelfile</summary><pre class="modelfile-pre">${Helpers.escapeHtml(data.modelfile)}</pre></details>` : ''}
        `;
      }
    } catch (err) {
      if (d.modelInfoContent) {
        d.modelInfoContent.innerHTML = `<p style="color:var(--danger);">Erreur: ${Helpers.escapeHtml(err.message)}</p>`;
      }
    }
  }

  function open() {
    if (DOM.refs.settingsModal) DOM.refs.settingsModal.style.display = 'flex';
  }

  function close() {
    if (DOM.refs.settingsModal) DOM.refs.settingsModal.style.display = 'none';
  }

  return { init, open, close };
})();