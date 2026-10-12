import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../styles/tokens.css';
import '../styles/app.css';

export const metadata: Metadata = {
  title: 'Matchday · Immersive Panel',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F3EEE4',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Black&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,300,0,0&display=block" rel="stylesheet" />
        {/* Connect fan view (/c/:id) stand-in fonts (Manrope, Zen Kaku Gothic New) */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
