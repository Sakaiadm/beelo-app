import './globals.css';
import { cookies } from 'next/headers';
import { Plus_Jakarta_Sans } from 'next/font/google';

// A letra do app vem junto com o app (baixada na hora de montar), sem esperar o site do Google ao abrir.
const fonte = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--fonte' });

export const metadata = {
  title: 'Beelo',
  description: 'Rotina do grupo: tarefas, agenda e acompanhamento.',
  manifest: '/manifest.json',
  icons: { icon: '/icone.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Beelo', statusBarStyle: 'default' },
};
export const viewport = { themeColor: '#1a6fe0', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const tema = (await cookies()).get('tema')?.value;
  return (
    <html lang="pt-BR" className={fonte.variable} data-theme={tema === 'escuro' || tema === 'claro' ? tema : undefined}>
      <body>{children}</body>
    </html>
  );
}
