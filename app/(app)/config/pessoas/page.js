// @arquivo  page.js: lista das pessoas da família, com status do convite.
// @tipo     tela
// @usa      lib/sessao, components/Avatar, components/Voltar, components/Icone, lib/avatar, lib/papeis, components/ReenviarConvite
// @usado-por Next.js (rota /config/pessoas)
import Link from 'next/link';
import { exigirGestor } from '@/lib/sessao';
import Avatar from '@/components/Avatar';
import Voltar from '@/components/Voltar';
import Icone from '@/components/Icone';
import { urlsAvatares } from '@/lib/avatar';
import { nomeFuncao } from '@/lib/papeis';
import ReenviarConvite from '@/components/ReenviarConvite';

export const dynamic = 'force-dynamic';

const SITE = 'https://beeloapp.com';

export default async function Pessoas({ searchParams }) {
  const sp = await searchParams;
  const { supabase, membros, eu, familia } = await exigirGestor();
  const urls = await urlsAvatares(supabase, membros.map((m) => m.avatar));
  // U61: depois de adicionar, o convite também pode ir pelo WhatsApp, com a mensagem pronta.
  const novo = sp?.aviso?.startsWith('convite:') ? membros.find((m) => m.id === sp.aviso.slice(8)) : null;
  const whats = novo && `https://wa.me/?text=${encodeURIComponent(`Oi, ${novo.nome.split(' ')[0]}! Te convidei para o beelo, o app da rotina da ${familia.nome}. Entre em ${SITE} com o e-mail ${novo.email}. Também mandei o convite por e-mail.`)}`;
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Pessoas" sub={`${membros.length} ${membros.length === 1 ? 'pessoa' : 'pessoas'}`} />
      {(sp?.aviso === 'convite' || novo) && (
        <div className="aviso ok convite-ok" role="status">
          <span>Convite enviado{novo ? ` para ${novo.nome}` : ''} por e-mail.</span>
          {whats && <a className="btn whats peq" href={whats} target="_blank" rel="noopener noreferrer"><Icone nome="fala" tam={18} cor="#fff" />Avisar pelo WhatsApp</a>}
        </div>
      )}
      {sp?.aviso?.startsWith('reconvite:') && <div className="aviso ok" role="status">{sp.aviso.slice(10)} já está no grupo. Convite enviado.</div>}
      {sp?.aviso?.startsWith('acesso:') && <div className="aviso ok" role="status">{sp.aviso.slice(7)} já está no grupo. E-mail de acesso enviado.</div>}
      {sp?.aviso?.startsWith('semconvite:') && <div className="aviso erro" role="alert">Pessoa adicionada, mas {sp.aviso.slice(11).replace(/^./, (c) => c.toLowerCase())}</div>}
      <Link prefetch={false} href="/config/pessoas/nova" className="btn" style={{ marginBottom: 14 }}><Icone nome="mais" tam={18} cor="#fff" />Pessoa</Link>
      {membros.map((m) => {
        // U56: quem ainda não entrou aparece com "Convite enviado" e o botão Reenviar.
        const espera = !m.user_id && m.email && m.ativo && m.id !== eu.id;
        return (
          <div key={m.id} className={`cartao-l linha-pessoa ${m.ativo ? '' : 'apagado'}`}>
            {/* U55 e U73: a linha inteira abre a pessoa, com a setinha no fim. */}
            <Link prefetch={false} href={`/config/pessoas/${m.id}`} className="linha-abre" aria-label={`Abrir ${m.nome}`}>
              <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} />
              <span className="corpo"><b>{m.nome}{m.id === eu.id ? ' (você)' : ''}</b><small className="peq-cinza">{nomeFuncao(m)}</small>
                {!m.ativo ? <span><span className="tg cz">desativada</span></span>
                  : espera ? <small className="peq-cinza st-conv espera">{m.convidado_em ? 'Convite enviado · ainda não entrou' : 'Ainda sem convite'}</small>
                  : !m.email && m.id !== eu.id ? <small className="peq-cinza">Sem e-mail: não entra no app</small> : null}</span>
              {!espera && <Icone nome="dir" tam={20} />}
            </Link>
            {espera && <ReenviarConvite id={m.id} rotulo={m.convidado_em ? 'Reenviar' : 'Convidar'} />}
          </div>
        );
      })}
    </main>
  );
}
