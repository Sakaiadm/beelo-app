'use client';
// @arquivo  global-error.js: tela de erro quando o próprio layout falha.
// @tipo     tela
// @usa      components/TelaErro
// @usado-por Next.js (arquivo especial do app)
import './globals.css';
import localFont from 'next/font/local';
import TelaErro from '@/components/TelaErro';

// A letra do app vem DENTRO do repositório (app/fonts), sem baixar nada do Google na build.
// @decisao 25/11 a build da VPS falhava quando a rede não alcançava o Google; arquivo local resolve de vez.
// Mesma letra (Plus Jakarta Sans, variável 200-800, cobre os pesos 400/500/600/700/800), mesma variável --fonte.
const fonte = localFont({ src: './fonts/PlusJakartaSans-latin-variavel.woff2', weight: '200 800', display: 'swap', variable: '--fonte' });

// Último recurso: se até a moldura do app falhar, ainda mostra uma tela em português.
export default function ErroGeral({ error, reset }) {
  if (typeof console !== 'undefined') console.error('Erro geral:', error);
  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body><TelaErro reset={reset} /></body>
    </html>
  );
}
