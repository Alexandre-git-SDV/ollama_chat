/**
 * ComponentLoader
 * ─────────────────────────────────────────────
 * Charge des fragments HTML dans des slots du DOM.
 * Pattern : micro-frontend léger sans framework.
 */
class ComponentLoader {

  /**
   * Charge un fichier HTML dans un élément slot
   * @param {string} componentPath - Chemin vers le fichier .html
   * @param {string} slotId        - ID de l'élément conteneur
   * @returns {Promise<void>}
   */
  static async load(componentPath, slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) {
      console.warn(`[ComponentLoader] Slot "#${slotId}" introuvable`);
      return;
    }

    try {
      const response = await fetch(componentPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} pour ${componentPath}`);
      }

      const html = await response.text();

      // Injection du HTML
      slot.innerHTML = html;

      // Exécution des scripts inline éventuels
      slot.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        [...oldScript.attributes].forEach(attr =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      console.log(`[ComponentLoader] ✓ ${componentPath} → #${slotId}`);
    } catch (error) {
      console.error(`[ComponentLoader] ✗ ${componentPath}:`, error);
      slot.innerHTML = `
        <div style="color:red; padding:1rem; font-size:0.85rem;">
          Erreur de chargement : ${componentPath}
        </div>`;
    }
  }

  /**
   * Charge plusieurs composants en parallèle
   * @param {Array<{path: string, slot: string}>} components
   * @returns {Promise<void>}
   */
  static async loadAll(components) {
    const start = performance.now();

    await Promise.all(
      components.map(({ path, slot }) => this.load(path, slot))
    );

    const duration = (performance.now() - start).toFixed(1);
    console.log(`[ComponentLoader] Tous les composants chargés en ${duration}ms`);
  }
}

// Exposer globalement
window.ComponentLoader = ComponentLoader;
