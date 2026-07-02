import { Conversation } from '@/types/chat';

/** Réduit un titre à un slug de fichier sûr (ASCII, minuscules, tirets). */
function slugify(title: string): string {
  const slug = (title || 'conversation')
    .toLowerCase()
    .normalize('NFD')
    // Retire les diacritiques (plage Unicode des marques combinantes).
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'conversation';
}

/** Déclenche le téléchargement client d'un contenu texte via un Blob éphémère. */
function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Exporte la conversation courante au format JSON. */
export function exportConversationJSON(conv: Conversation) {
  download(
    `ollama-chat-${slugify(conv.title)}.json`,
    JSON.stringify(conv, null, 2),
    'application/json'
  );
}

/** Exporte la conversation courante au format Markdown lisible. */
export function exportConversationMarkdown(conv: Conversation) {
  const lines: string[] = [`# ${conv.title || 'Conversation'}`, ''];
  if (conv.model) lines.push(`> Modèle : ${conv.model}`, '');
  for (const m of conv.messages) {
    const who =
      m.role === 'user'
        ? 'Vous'
        : m.role === 'assistant'
          ? m.model || 'Assistant'
          : 'Système';
    lines.push(`## ${who}`, '', m.content || '', '');
  }
  download(
    `ollama-chat-${slugify(conv.title)}.md`,
    lines.join('\n'),
    'text/markdown'
  );
}
