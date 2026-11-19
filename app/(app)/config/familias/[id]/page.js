import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import Avatar from '@/components/Avatar';
import FamiliaEditor from '@/components/FamiliaEditor';
import { adminAtivarFamilia } from '@/app/acoes';
import { urlsAvatares } from '@/lib/avatar';
import { nomeFuncao } from '@/lib/papeis';

export const dynamic = 'force-dynamic';

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
    resumo = `${gestores.length} pais · ${membros.length - gestores.length} pessoas · ${membros.filter((m) => m.user_id).length} já entraram`;
  } else {
    const [{ data: lista }, { data: ps }] = await Promise.all([supabase.rpc('ra_admin_familias'), supabase.rpc('ra_admin_membros', { p_familia: id })]);
    const f = (lista || []).find((x) => x.id === id);
    if (!f) notFound();
    fam = { id: f.id, nome: f.nome, avatar: f.avatar, ativa: f.ativa };
    pessoas = ps || [];
    resumo = `${f.n_gestores} pais · ${f.n_filhos} pessoas · ${f.n_ativos} já entraram · ${f.tarefas} tarefas`;
  }
  const urls = await urlsAvatares(supabase, [fam.avatar, ...(propria ? pessoas.map((p) => p.avatar) : [])]);
  const resp = pessoas.find((p) => p.responsavel);
  const gestores = pessoas.filter((p) => p.papel === 'gestor');
  return (
    <main className="estreito">
      <Voltar href={superAdmin ? '/config/familias' : '/config'} titulo={fam.nome} />
      <FamiliaEditor key={fam.nome + (fam.avatar || '')} familia={{ id: fam.id, nome: fam.nome }} url={urls[fam.avatar]} resp={resp} gestores={gestores} resumo={resumo} />
      {superAdmin && !propria && (
        <form action={adminAtivarFamilia} className="lin-chave" style={{ border: 0 }}>
          <input type="hidden" name="id" value={fam.id} /><input type="hidden" name="ativa" value={fam.ativa ? '0' : '1'} />
          <span>Família ativa<small>Desativar bloqueia o acesso sem apagar nada</small></span>
          <button className={`chave ${fam.ativa ? 'on' : ''}`} role="switch" aria-checked={fam.ativa} aria-label="Família ativa" />
        </form>
      )}
      <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '14px 0 6px' }}>Pessoas desta família</p>
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
