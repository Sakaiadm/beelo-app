import Link from 'next/link';
import { exigirGestor } from '@/lib/sessao';
import Avatar from '@/components/Avatar';
import Voltar from '@/components/Voltar';
import { alternarPessoa } from '@/app/acoes';
import { urlsAvatares } from '@/lib/avatar';
import { nomeFuncao } from '@/lib/papeis';

export const dynamic = 'force-dynamic';

export default async function Pessoas() {
  const { supabase, membros, eu } = await exigirGestor();
  const urls = await urlsAvatares(supabase, membros.map((m) => m.avatar));
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Pessoas" sub={`${membros.length} ${membros.length === 1 ? 'pessoa' : 'pessoas'}`} />
      <Link prefetch={false} href="/config/pessoas/nova" className="btn bloco" style={{ marginBottom: 14 }}>+ Adicionar pessoa</Link>
      {membros.map((m) => (
        <div key={m.id} className={`cartao-l ${m.ativo ? '' : 'apagado'}`}>
          <Link prefetch={false} href={`/config/pessoas/${m.id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
            <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} />
            <span className="corpo"><b>{m.nome}{!m.ativo && <span className="pilula" style={{ marginLeft: 8, fontSize: 11 }}>desativada</span>}</b><small className="peq-cinza">{nomeFuncao(m)}{m.user_id ? '' : m.email ? ' · convite pendente' : ''}</small></span>
          </Link>
          <Link prefetch={false} href={`/config/pessoas/${m.id}`} className="link-btn">Editar</Link>
          {m.id !== eu.id && (
            <form action={alternarPessoa}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="ativo" value={m.ativo ? '0' : '1'} />
              <button className={`chave ${m.ativo ? 'on' : ''}`} role="switch" aria-checked={m.ativo} aria-label={m.ativo ? `Desativar ${m.nome}` : `Ativar ${m.nome}`} /></form>
          )}
        </div>
      ))}
    </main>
  );
}
