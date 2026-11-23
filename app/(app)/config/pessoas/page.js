import Link from 'next/link';
import Form from '@/components/Form';
import { exigirGestor } from '@/lib/sessao';
import Avatar from '@/components/Avatar';
import Voltar from '@/components/Voltar';
import { alternarPessoa } from '@/app/acoes';
import { urlsAvatares } from '@/lib/avatar';
import { nomeFuncao } from '@/lib/papeis';
import { statusConvite } from '@/lib/statusConvite';
import ReenviarConvite from '@/components/ReenviarConvite';
import ConfirmarBotao from '@/components/ConfirmarBotao';

export const dynamic = 'force-dynamic';

export default async function Pessoas({ searchParams }) {
  const sp = await searchParams;
  const { supabase, membros, eu } = await exigirGestor();
  const urls = await urlsAvatares(supabase, membros.map((m) => m.avatar));
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Pessoas" sub={`${membros.length} ${membros.length === 1 ? 'pessoa' : 'pessoas'}`} />
      {sp?.aviso === 'convite' && <div className="aviso ok" role="status">Pessoa adicionada e convite enviado.</div>}
      {sp?.aviso?.startsWith('reconvite:') && <div className="aviso ok" role="status">{sp.aviso.slice(10)} já está no grupo. Convite enviado.</div>}
      {sp?.aviso?.startsWith('acesso:') && <div className="aviso ok" role="status">{sp.aviso.slice(7)} já está no grupo. E-mail de acesso enviado.</div>}
      {sp?.aviso?.startsWith('semconvite:') && <div className="aviso erro" role="alert">Pessoa adicionada, mas {sp.aviso.slice(11).replace(/^./, (c) => c.toLowerCase())}</div>}
      <Link prefetch={false} href="/config/pessoas/nova" className="btn bloco" style={{ marginBottom: 14 }}>+ Adicionar pessoa</Link>
      {membros.map((m) => (
        <div key={m.id} className={`cartao-l ${m.ativo ? '' : 'apagado'}`}>
          <Link prefetch={false} href={`/config/pessoas/${m.id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
            <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} />
            <span className="corpo"><b>{m.nome}</b><small className="peq-cinza">{nomeFuncao(m)}</small>{!m.ativo ? <span><span className="pilula" style={{ fontSize: 11 }}>desativada</span></span> : statusConvite(m) && <small className={`peq-cinza st-conv ${statusConvite(m).tipo}`}>{statusConvite(m).txt}</small>}</span>
          </Link>
          <Link prefetch={false} href={`/config/pessoas/${m.id}`} className="link-btn">Editar</Link>
          {!m.user_id && m.email && m.ativo && m.id !== eu.id && <ReenviarConvite id={m.id} rotulo={m.convidado_em ? 'Reenviar' : 'Convidar'} />}
          {m.id !== eu.id && (m.ativo ? (
            // Desativar pergunta antes (balão), como todos os outros lugares de excluir e desativar.
            <ConfirmarBotao acao={alternarPessoa} campos={{ id: m.id, ativo: '0' }} rotulo={null} classe="chave on"
              gatilho={{ role: 'switch', 'aria-checked': true, 'aria-label': `Desativar ${m.nome}` }}
              titulo="Desativar pessoa?" nome={m.nome} detalhe={nomeFuncao(m)} icone="bloquear"
              avatar={<Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={40} />}
              pergunta={<>Tem certeza? <b>{m.nome}</b> perde o acesso ao app. Nada é apagado: dá para reativar depois.</>}
              sim="Sim, desativar" nao="Cancelar" />
          ) : (
            <Form acao={alternarPessoa} simples><input type="hidden" name="id" value={m.id} /><input type="hidden" name="ativo" value="1" />
              <button className="chave" role="switch" aria-checked={false} aria-label={`Ativar ${m.nome}`} /></Form>
          ))}
        </div>
      ))}
    </main>
  );
}
