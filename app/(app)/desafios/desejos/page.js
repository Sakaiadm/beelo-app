// @arquivo  page.js: aba Desejos dos Desafios: o Acompanhado cadastra o que quer ganhar e vê as respostas.
// @tipo     tela
// @usa      lib/sessao, lib/desafiosDados, lib/desafios, components/DesafiosTopo, components/SugerirDesejo, components/Icone
// @usado-por Next.js (rota /desafios/desejos)
// @decisao  28/11 Thomas: os desejos saíram do Cofrinho e ganharam aba própria (Desafios | Mural | Desejos | Cofrinho).
//           O botão "+ Desejo" fica no alto à direita (padrão "+ Tarefa") e o cadastro tem o botão "Sugestões".
// @cuidado  só para quem tem Cofrinho (criança e adolescente); Responsável e adulto voltam para /desafios.
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { carregarDesafios, desafiosLigados, vitrineDe, desejosVisiveis } from '@/lib/desafiosDados';
import { perfil, faixaDe, MAX_DESEJOS } from '@/lib/desafios';
import DesafiosTopo from '@/components/DesafiosTopo';
import SugerirDesejo from '@/components/SugerirDesejo';
import Icone from '@/components/Icone';

export const dynamic = 'force-dynamic';

export default async function Desejos() {
  const { supabase, eu, membros, gestor, familia } = await exigirMembro();
  if (!desafiosLigados(familia)) redirect('/hoje');
  const pf = perfil(eu);
  if (gestor || (pf !== 'c' && pf !== 'a')) redirect('/desafios');
  const dados = await carregarDesafios(supabase, { eu, membros, atualizar: false });
  const v = vitrineDe(eu, dados.premios, dados.saldo);
  const meus = desejosVisiveis(dados.desejos, eu.id);
  const esperando = meus.filter((x) => x.desejo === 'esperando').length;
  const cheio = esperando >= MAX_DESEJOS;
  return (
    <main className="estreito">
      <DesafiosTopo gestor={false} perfil={pf} ativo={2}
        acao={<SugerirDesejo familia={eu.familia_id} membro={eu.id} esperando={esperando} moeda={v.moeda} faixa={faixaDe(eu)} />} />
      <div className="card" style={{ padding: '14px 18px' }}>
        <div className="des-top">
          <span className="des-ic mel"><Icone nome="presente" tam={22} /></span>
          <span><b>Seus sonhos podem virar realidade</b><small>Mostre o que você quer ganhar. Combine quanto vale e, quando você juntar {v.moeda === 'semanas' ? 'as semanas' : 'as estrelinhas'}, troque por ele.</small></span>
        </div>
      </div>
      <div className="grupo-titulo">Meus desejos</div>
      <div className="card" style={{ padding: '12px 18px' }}>
        {meus.length === 0 && <div className="vazio" style={{ padding: '6px 0' }}>Tem algo que você quer muito? Toque em + Desejo.</div>}
        {meus.map((x) => (
          <div className="vit" key={x.id}>
            <span className="des-ic"><Icone nome="presente" tam={22} /></span>
            <span className="corpo"><b>{x.sugerido || x.nome}</b>
              <small>{x.desejo === 'esperando' ? 'Esperando seus responsáveis' : `Os responsáveis: “${x.resposta}”`}</small></span>
          </div>
        ))}
        <p className="sub" style={{ fontSize: 'var(--f-apoio)', textAlign: 'center', margin: '10px 0 0' }}>
          {cheio ? `Você já tem ${MAX_DESEJOS} desejos esperando. Espere a resposta dos seus responsáveis.` : `Você pode ter até ${MAX_DESEJOS} desejos esperando.`}
        </p>
      </div>
    </main>
  );
}
