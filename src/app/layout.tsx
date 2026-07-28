import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ollama Chat',
  description: 'Chat with your local Ollama models',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Applique l'accent et le thème persistés avant le paint pour éviter tout flash
// (couleur d'accent par défaut, ou thème sombre alors que le clair est mémorisé).
const themeInit = `(function(){try{var a=localStorage.getItem('ollama-chat-accent');if(a){document.documentElement.style.setProperty('--accent',a);}var t=localStorage.getItem('ollama-chat-theme');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning : le script anti-FOUC mute className/style de <html>
    // avant l'hydratation (classe `light`, variable --accent) — mutation attendue.
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Injecté dans le HTML initial et exécuté avant l'hydratation (anti-FOUC). */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
