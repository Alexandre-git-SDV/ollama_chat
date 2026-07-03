'use client';

import { useRef, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { CopyIcon, CheckIcon } from '@/components/ui/Icons';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';

interface Props {
  content: string;
}

/**
 * Bloc de code avec bouton « Copier » en surimpression. Le texte est lu depuis
 * `textContent` du <pre> au clic, robuste au découpage en spans de rehype-highlight.
 * Le fond du <pre> reste sombre (#0c0c11) dans les deux thèmes : le bouton utilise
 * des couleurs claires fixes pour garder un contraste suffisant en thème clair.
 */
function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const { copied, copy } = useCopyFeedback();

  return (
    <div className="relative group">
      <pre ref={preRef}>{children}</pre>
      <button
        type="button"
        onClick={() => copy(preRef.current?.textContent ?? '')}
        aria-label="Copier le code"
        title="Copier le code"
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/60 hover:text-white/95 backdrop-blur-sm transition-colors"
      >
        {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Code copié' : ''}
      </span>
    </div>
  );
}

export default function Markdown({ content }: Props) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Les tableaux larges scrollent horizontalement sans casser la colonne (720px).
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
          // Bloc de code avec bouton copier en surimpression.
          pre: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
