// @arquivo  layout.js: layout raiz: fontes, tema claro/escuro, manifesto, registro do service worker.
// @tipo     tela
// @usado-por Next.js (arquivo especial do app)
// @cuidado  o app abre sempre no modo claro.
import './globals.css';
import { cookies } from 'next/headers';
import localFont from 'next/font/local';

// A letra do app vem DENTRO do repositório (app/fonts), sem baixar nada do Google na build.
// @decisao 25/11 a build da VPS falhava quando a rede não alcançava o Google; arquivo local resolve de vez.
// Mesma letra (Plus Jakarta Sans, variável 200-800, cobre os pesos 400/500/600/700/800), mesma variável --fonte.
const fonte = localFont({ src: './fonts/PlusJakartaSans-latin-variavel.woff2', weight: '200 800', display: 'swap', variable: '--fonte' });

// Tela de abertura do app instalado no iPhone (seção 71): fundo branco (ou escuro no modo escuro),
// logo beelo e a frase "Pequenas tarefas, grandes pessoas.". O iPhone exige uma imagem por tamanho de tela.
const TELAS = [[440, 956, 3], [430, 932, 3], [428, 926, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [375, 667, 2], [320, 568, 2]];
const ABERTURA = TELAS.flatMap(([w, h, r]) => ['claro', 'escuro'].map((t) => ({
  url: `/marca/abertura/abertura-${t}-${w * r}x${h * r}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait) and (prefers-color-scheme: ${t === 'claro' ? 'light' : 'dark'})`,
})));

export const metadata = {
  title: 'beelo',
  description: 'Tarefas, agenda e acompanhamento para responsáveis e pessoas do grupo.',
  manifest: '/manifest.json',
  icons: { icon: '/icone.svg', apple: '/apple-touch-icon.png' },
  // Android (Chrome): acompanha o tamanho de letra escolhido no celular (Raio-X V8).
  other: { 'text-scale': 'scale' },
  appleWebApp: { capable: true, title: 'beelo', statusBarStyle: 'default', startupImage: ABERTURA },
};
export const viewport = { themeColor: '#1a6fe0', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const tema = (await cookies()).get('tema')?.value;
  return (
    <html lang="pt-BR" className={fonte.variable} data-theme={tema === 'escuro' ? 'escuro' : 'claro'}>
      <body>{children}</body>
    </html>
  );
}
