// @arquivo  page.js: vitrine de prêmios (banco de prêmios, preços e lista de desejos).
// @tipo     tela
// @usa      banco ra_premios, lib/sessao, lib/desafiosDados, lib/desafios, components/PremioLinha, components/NovoPremio
// @usado-por Next.js (rota /desafios/premios)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import { desafiosLigados } from '@/lib/desafiosDados';
import { PREMIOS } from '@/lib/desafios';
import DesafiosTopo from '@/components/DesafiosTopo';
import PremioLinha from '@/components/PremioLinha';
import NovoPremio from '@/components/NovoPremio';

export const dynamic = 'force-dynamic';

const FAIXA = { ate8: 'até 8 anos', mais8: '9 anos ou mais', todos: 'qualquer idade', teen: 'adolescente' };

// Vitrine de prêmios: o app já começa com uma seleção; os pais tiram, voltam ou acrescentam (do banco ou um prêmio próprio).
export default async function Premios({ searchParams }) {
  const sp = await searchParams;
  const { supabase, familia, membros } = await exigirGestor();
  if (!desafiosLigados(familia)) redirect('/desafios');
  const aba = sp?.a === 'teen' ? 'teen' : 'crianca';
  const { data: todos } = await supabase.from('ra_premios').select('*').order('custo');
  const naAba = (f) => (aba === 'teen' ? f === 'teen' : f !== 'teen');
  // Desejos ainda sem resposta (ou com "agora não") ficam fora da vitrine.
  const meus = (todos || []).filter((p) => naAba(p.faixa) && (!p.desejo || p.desejo === 'aprovado'));
  const nomeDe = Object.fromEntries((membros || []).map((m) => [m.id, m.nome]));
  // As sugestões nunca saem da lista: ao acrescentar, a Vitrine ganha uma cópia (que pode ter nome e valor diferentes).
  const banco = PREMIOS.filter((p) => naAba(p.faixa));
  const un = aba === 'teen' ? 'semanas' : 'estrelinhas';
  return (
    <main className="estreito">
      {/* @decisao 25/11 Thomas (opção A): Vitrine é uma aba da tela Desafios. */}
      <DesafiosTopo gestor ativo={2} />
      <div className="vit-cabeca">
        <p className="sub">Combine com cada um o que vale a pena juntar.</p>
        <NovoPremio itens={banco.map((p) => ({ id: p.id, nome: p.nome, custo: p.custo, faixa: p.faixa }))} un={un} teen={aba === 'teen'} />
      </div>
      <div className="seg">
        <Link prefetch={false} href="/desafios/premios" className={aba === 'crianca' ? 'on' : ''}>Criança</Link>
        <Link prefetch={false} href="/desafios/premios?a=teen" className={aba === 'teen' ? 'on' : ''}>Adolescente</Link>
      </div>
      <div className="grupo-titulo">Na vitrine</div>
      <div className="card" style={{ padding: '4px 18px' }}>
        {meus.length === 0 && <div className="vazio">Nenhum prêmio ainda. Toque em + Prêmio para acrescentar.</div>}
        {meus.map((p) => (
          <PremioLinha key={p.id} premio={{ id: p.id, nome: p.nome, custo: p.custo, ativo: p.ativo }} un={un} teen={aba === 'teen'}
            sub={`${p.custo} ${un} · ${p.membro_id ? `desejo de ${nomeDe[p.membro_id] || 'alguém'}` : FAIXA[p.faixa]}`} />
        ))}
      </div>


    </main>
  );
}
