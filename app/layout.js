import './globals.css';
import { cookies } from 'next/headers';
import { Plus_Jakarta_Sans } from 'next/font/google';

// A letra do app vem junto com o app (baixada na hora de montar), sem esperar o site do Google ao abrir.
const fonte = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--fonte' });

// Tela de abertura do app instalado no iPhone (seção 71): fundo branco (ou escuro no modo escuro),
// logo beelo e a frase "Pequenas tarefas, grandes pessoas.". O iPhone exige uma imagem por tamanho de tela.
const TELAS = [[440, 956, 3], [430, 932, 3], [428, 926, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [375, 667, 2], [320, 568, 2]];
const ABERTURA = TELAS.flatMap(([w, h, r]) => ['claro', 'escuro'].map((t) => ({
  url: `/marca/abertura/abertura-${t}-${w * r}x${h * r}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait) and (prefers-color-scheme: ${t === 'claro' ? 'light' : 'dark'})`,
})));

export const metadata = {
  title: 'beelo',
  description: 'Rotina do grupo: tarefas, agenda e acompanhamento.',
  manifest: '/manifest.json',
  icons: { icon: '/icone.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'beelo', statusBarStyle: 'default', startupImage: ABERTURA },
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
