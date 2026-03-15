/**
 * ============================================
 *  Rendu Markdown avec highlight.js
 * ============================================
 */
var MarkdownRenderer = (function () {
  'use strict';

  let codeBlockCounter = 0;

  function configure() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        highlight: function (code, lang) {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true,
      });
    }
  }

  function render(text) {
    if (!text) return '';

    // Utiliser marked si disponible
    if (typeof marked !== 'undefined') {
      try {
        let html = marked.parse(text);

        // Ajouter les boutons de copie aux blocs de code
        html = html.replace(
          /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
          function (match, lang, code) {
            const id = `code-block-${++codeBlockCounter}`;
            const langLabel = lang || 'code';
            return `
              <div class="code-block">
                <div class="code-header">
                  <span class="code-lang">${Helpers.escapeHtml(langLabel)}</span>
                  <button class="btn-copy" onclick="MarkdownRenderer.copyCode('${id}')">
                    ${AppConfig.ICONS.copy} Copier
                  </button>
                </div>
                <pre><code id="${id}" class="language-${langLabel}">${code}</code></pre>
              </div>`;
          }
        );

        return html;
      } catch (e) {
        console.warn('[Markdown] Erreur marked:', e);
      }
    }

    // Fallback basique
    return renderBasic(text);
  }

  function renderBasic(text) {
    let h = Helpers.escapeHtml(text);

    // Code blocks
    h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function (_, lang, code) {
      const id = `code-block-${++codeBlockCounter}`;
      return `
        <div class="code-block">
          <div class="code-header">
            <span class="code-lang">${lang || 'code'}</span>
            <button class="btn-copy" onclick="MarkdownRenderer.copyCode('${id}')">
              ${AppConfig.ICONS.copy} Copier
            </button>
          </div>
          <pre><code id="${id}">${code}</code></pre>
        </div>`;
    });

    // Inline code
    h = h.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold / italic
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Paragraphs
    h = h.replace(/\n\n/g, '</p><p>');
    h = h.replace(/\n/g, '<br>');
    h = `<p>${h}</p>`;
    h = h.replace(/<p><\/p>/g, '');

    return h;
  }

  function copyCode(id) {
    const el = document.getElementById(id);
    if (el) {
      navigator.clipboard.writeText(el.textContent).then(() => {
        ToastComponent.show('Code copié', 'success');
      });
    }
  }

  return { configure, render, copyCode };
})();