/**
 * ============================================
 *  Model Selector Component
 * ============================================
 */
var ModelSelectorComponent = (function () {
  'use strict';

  let models = [];
  let dropdownOpen = false;

  function init() {
    bindEvents();
    loadModels();
  }

  function bindEvents() {
    const d = DOM.refs;

    if (d.btnModelSelect) {
      d.btnModelSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });
    }

    // Fermer au clic extérieur
    document.addEventListener('click', (e) => {
      if (dropdownOpen && d.modelDropdown && !d.modelDropdown.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  async function loadModels() {
    models = await OllamaService.listModels();
    updateUI();

    // Restaurer le modèle sauvegardé
    const saved = StorageService.getModel();
    if (saved && models.find(m => m.name === saved)) {
      selectModel(saved, false);
    } else if (models.length > 0) {
      selectModel(models[0].name, true);
    }
  }

  function updateUI() {
    const d = DOM.refs;

    // Dropdown header
    if (d.modelDropdown) {
      if (models.length === 0) {
        d.modelDropdown.innerHTML = `
          <div class="model-dropdown-empty">Aucun modèle disponible</div>`;
      } else {
        d.modelDropdown.innerHTML = models.map(m => `
          <div class="model-dropdown-item" data-model="${Helpers.escapeHtml(m.name)}">
            <span class="model-item-name">${Helpers.escapeHtml(m.name)}</span>
            <span class="model-item-size">${Helpers.formatSize(m.size)}</span>
          </div>
        `).join('');

        d.modelDropdown.querySelectorAll('.model-dropdown-item').forEach(item => {
          item.addEventListener('click', () => {
            selectModel(item.dataset.model);
            closeDropdown();
          });
        });
      }
    }

    // Settings select
    if (d.modelSelect) {
      d.modelSelect.innerHTML = models.length === 0
        ? '<option value="">Aucun modèle</option>'
        : models.map(m => `<option value="${Helpers.escapeHtml(m.name)}">${Helpers.escapeHtml(m.name)}</option>`).join('');
    }
  }

  function selectModel(name, save = true) {
    const d = DOM.refs;
    if (d.modelName) d.modelName.textContent = name || 'Sélectionner…';
    if (d.modelSelect) d.modelSelect.value = name;
    if (save) StorageService.setModel(name);

    // Mettre à jour l'état global
    AppState.currentModel = name;
    console.log('🤖 Modèle sélectionné:', name);
  }

  function toggleDropdown() {
    dropdownOpen ? closeDropdown() : openDropdown();
  }

  function openDropdown() {
    const d = DOM.refs;
    if (d.modelDropdown) {
      d.modelDropdown.classList.add('visible');
      dropdownOpen = true;
    }
  }

  function closeDropdown() {
    const d = DOM.refs;
    if (d.modelDropdown) {
      d.modelDropdown.classList.remove('visible');
      dropdownOpen = false;
    }
  }

  function getSelectedModel() {
    return AppState.currentModel;
  }

  return { init, loadModels, selectModel, getSelectedModel };
})();