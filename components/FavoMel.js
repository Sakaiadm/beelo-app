'use client';
// @arquivo  components/FavoMel.js: o "Favo de começo", cartão com 5 passos (pessoa, grupo, tarefa, avisos, ideia do dia) que some sozinho.
// @tipo     componente
// @usa      lib/guia.js (estado no aparelho), lib/dicasMotor.js (ideias já lidas)
// @usado-por app/(app)/painel/page.js (no lugar de PrimeirosPassos, quando o Guia da Mel está ligado)
// @cuidado  Pessoa e tarefa vêm do servidor; grupo, avisos e ideia são lidos do aparelho. Reabre pelo livro (Ajuda).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from './Icone';
import { lerGuia, gravarGuia } from '@/lib/guia';
import { ler as lerDicas } from '@/lib/dicasMotor';

export default function FavoMel({ membro, pessoas, tarefas, familiaId }) {
  const [est, setEst] = useState(null);
  const [avisos, setAvisos] = useState(false);
  useEffect(() => {
    const ver = () => {
      setEst(lerGuia(membro));
      try { setAvisos('Notification' in window && Notification.permission === 'granted'); } catch { setAvisos(false); }
    };
    ver();
    window.addEventListener('beelo-guia', ver);
    window.addEventListener('focus', ver);
    return () => { window.removeEventListener('beelo-guia', ver); window.removeEventListener('focus', ver); };
  }, [membro]);
  const completo = !!est && pessoas && est.grupo && tarefas && avisos && (est.ideia || (lerDicas(membro).vistas || []).length > 0);
  // Completou: comemora uma vez e o cartão some para sempre (reabre só se a pessoa pedir pelo livro).
  useEffect(() => {
    if (completo && est && !est.favoFim) { const e = lerGuia(membro); e.favoFim = true; setTimeout(() => gravarGuia(membro, e), 6000); }
  }, [completo, est, membro]);
  if (!est || est.off || est.favoX || (est.favoFim && !completo)) return null;
  if (est.favoFim) return null;
  const itens = [
    { txt: 'Cadastrar a primeira pessoa', ok: pessoas, href: '/config/pessoas/nova' },
    { txt: 'Conhecer o seu grupo', ok: est.grupo, href: `/config/familias/${familiaId}` },
    { txt: 'Criar a primeira tarefa', ok: tarefas, href: '/tarefas/nova?volta=/painel' },
    { txt: 'Ativar os avisos', ok: avisos, href: '/perfil' },
    { txt: 'Ver a ideia do dia', ok: !!est.ideia, href: '/ideias' },
  ];
  const n = itens.filter((i) => i.ok).length;
  const fechar = () => { const e = lerGuia(membro); e.favoX = true; gravarGuia(membro, e); };
  return (
    <section className="favo-mel" aria-label="Seus primeiros passos">
      <div className="favo-t"><b>{completo ? 'Favo completo! Parabéns!' : `Seus primeiros passos · ${n} de 5`}</b>
        <button type="button" className="favo-x" aria-label="Fechar os primeiros passos" onClick={fechar}><Icone nome="x" tam={16} larg={2.4} /></button></div>
      {completo
        ? <p className="sub" style={{ margin: '6px 0 0', fontSize: 'var(--f-apoio)' }}>Tudo pronto: o beelo já está trabalhando com você. Este cartão some sozinho.</p>
        : <ul>{itens.map((i) => (
          <li key={i.txt} className={i.ok ? 'feito' : ''}>
            {i.ok ? <span><i className="q f" aria-hidden="true" />{i.txt}</span> : <Link prefetch={false} href={i.href}><i className="q" aria-hidden="true" />{i.txt}</Link>}
          </li>))}</ul>}
    </section>
  );
}
