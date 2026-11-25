'use client';
// @arquivo  Imprimir.js: abre as partes fechadas antes de imprimir o relatório.
// @tipo     componente
// @usado-por app/(app)/relatorios/page.js
import { useEffect } from 'react';

// Abre as partes fechadas antes de imprimir: o PDF sai com o relatório inteiro (Raio-X U45).
const abrirTudo = () => document.querySelectorAll('main details').forEach((d) => { d.open = true; });
export default function Imprimir() {
  useEffect(() => { window.addEventListener('beforeprint', abrirTudo); return () => window.removeEventListener('beforeprint', abrirTudo); }, []);
  return <button className="btn sec" onClick={() => { abrirTudo(); window.print(); }}>Exportar PDF</button>;
}
