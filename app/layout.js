import './globals.css';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'Rotina Ativa',
  description: 'Rotina da família: tarefas, agenda e acompanhamento.',
  manifest: '/manifest.json',
  icons: { icon: '/icone.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Rotina Ativa', statusBarStyle: 'default' },
};
export const viewport = { themeColor: '#1a6fe0', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const tema = (await cookies()).get('tema')?.value;
  return (
    <html lang="pt-BR" data-theme={tema === 'escuro' || tema === 'claro' ? tema : undefined}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
