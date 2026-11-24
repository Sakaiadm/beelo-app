import ConfirmarBotao from '@/components/ConfirmarBotao';
import Link from 'next/link';
import Form from '@/components/Form';
import { notFound } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import Avatar from '@/components/Avatar';
import FamiliaEditor from '@/components/FamiliaEditor';
import { adminAtivarFamilia } from '@/app/acoes';
import { urlsAvatares } from '@/lib/avatar';
import { nomeFuncao } from '@/lib/papeis';

export const dynamic = 'force-dynamic';

const resumoGrupo = (r, p, e) => `${r} ${r === 1 ? 'responsável' : 'responsáveis'} · ${p} ${p === 1 ? 'pessoa' : 'pessoas'} · ${e} já ${e === 1 ? 'entrou' : 'entraram'}`;

export default async function Familia({ params }) {
  const { id } = await params;
  const { supabase, superAdmin, membros, familia: minha } = await exigirGestor();
  const propria = id === minha.id;
  if (!propria && !superAdmin) notFound();
  let fam = minha, pessoas, resumo;
  if (propria) {
    const gestores = membros.filter((m) => m.papel === 'gestor').sort((a, b) => String(a.criado_em).localeCompare(String(b.criado_em)));
    const respId = minha.responsavel_id || gestores[0]?.id;
    pessoas = membros.map((m) => ({ ...m, entrou: !!m.user_id, responsavel: m.id === respId }));
    resumo = resumoGrupo(gestores.length, membros.length - gestores.length, membros.filter((m) => m.user_id).length);
  } else {
    const [{ data: lista }, { data: ps }, { data: cores }] = await Promise.all([supabase.rpc('ra_admin_familias'), supabase.rpc('ra_admin_membros', { p_familia: id }), supabase.rpc('ra_admin_cores')]);
    const f = (lista || []).find((x) => x.id === id);
    if (!f) notFound();
    fam = { id: f.id, nome: f.nome, avatar: f.avatar, ativa: f.ativa, cor: (cores || []).find((c) => c.id === f.id)?.cor };
    pessoas = ps || [];
    resumo = `${resumoGrupo(f.n_gestores, f.n_filhos, f.n_ativos)} · ${f.tarefas} ${f.tarefas === 1 ? 'tarefa' : 'tarefas'}`;
  }
  const urls = await urlsAvatares(supabase, [fam.avatar, ...(propria ? pessoas.map((p) => p.avatar) : [])]);
  const resp = pessoas.find((p) => p.responsavel);
  const gestores = pessoas.filter((p) => p.papel === 'gestor');
  return (
    <main className="estreito">
      <Voltar href={superAdmin ? '/config/familias' : '/config'} titulo={fam.nome} />
      <FamiliaEditor key={fam.nome + (fam.avatar || '') + (fam.cor || '')} familia={{ id: fam.id, nome: fam.nome, cor: fam.cor }} url={urls[fam.avatar]} resp={resp} gestores={gestores} resumo={resumo} />
      {superAdmin && !propria && (fam.ativa ? (
        <div className="lin-chave" style={{ border: 0 }}>
          <span>Grupo ativo<small>Desativar bloqueia o acesso sem apagar nada</small></span>
          <ConfirmarBotao acao={adminAtivarFamilia} campos={{ id: fam.id, ativa: '0' }} rotulo={null} classe="chave on"
            gatilho={{ role: 'switch', 'aria-checked': true, 'aria-label': 'Grupo ativo' }}
            titulo="Desativar grupo?" nome={fam.nome} icone="bloquear"
            pergunta="Tem certeza? O grupo perde o acesso. Nada é apagado: dá para reativar depois." sim="Sim, desativar" nao="Não" />
        </div>
      ) : (
        <Form simples acao={adminAtivarFamilia} className="lin-chave" style={{ border: 0 }}>
          <input type="hidden" name="id" value={fam.id} /><input type="hidden" name="ativa" value="1" />
          <span>Grupo ativo<small>Desativar bloqueia o acesso sem apagar nada</small></span>
          <button className="chave" role="switch" aria-checked={false} aria-label="Grupo ativo" />
        </Form>
      ))}
      <p style={{ fontSize: 'var(--f-apoio)', color: 'var(--cinza)', margin: '14px 0 6px' }}>Pessoas deste grupo</p>
      {pessoas.map((p) => {
        const dentro = (
          <>
            <Avatar nome={p.nome} cor={p.cor || '#1a6fe0'} url={urls[p.avatar]} avatar={p.avatar} tam={40} />
            <span className="corpo"><b>{p.nome}</b><small className="peq-cinza">{nomeFuncao(p)}{p.responsavel ? ' · responsável' : ''}</small></span>
          </>
        );
        return propria
          ? <Link prefetch={false} key={p.id} href={`/config/pessoas/${p.id}`} className="cartao-l">{dentro}<span className="seta" aria-hidden="true">›</span></Link>
          : <div key={p.id} className="cartao-l">{dentro}</div>;
      })}
    </main>
  );
}
