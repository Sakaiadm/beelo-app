'use client';
// @arquivo  global-error.js: tela de erro quando o próprio layout falha.
// @tipo     tela
// @usa      components/TelaErro
// @usado-por Next.js (arquivo especial do app)
import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import TelaErro from '@/components/TelaErro';

const fonte = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'], display: 'swap', variable: '--fonte' });

// Último recurso: se até a moldura do app falhar, ainda mostra uma tela em português.
export default function ErroGeral({ error, reset }) {
  if (typeof console !== 'undefined') console.error('Erro geral:', error);
  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body><TelaErro reset={reset} /></body>
    </html>
  );
}
