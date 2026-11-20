'use client';
import TelaErro from '@/components/TelaErro';

// Qualquer erro numa tela mostra esta página em português (em vez da tela branca em inglês).
export default function Erro({ error, reset }) {
  if (typeof console !== 'undefined') console.error('Erro na tela:', error);
  return <TelaErro reset={reset} />;
}
