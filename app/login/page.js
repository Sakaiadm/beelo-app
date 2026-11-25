'use client';
// @arquivo  page.js: tela de login: entrar com Google ou receber um link de entrada por e-mail (sem senha); o convite mostra quem convidou e o grupo.
// @tipo     tela
// @usa      lib/supabase/client, lib/rede, lib/contato
// @usado-por Next.js (rota /login)
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { MSG, semRede, falhaDeRede } from '@/lib/rede';
import { CONTATO } from '@/lib/contato';

// "Abrir meu e-mail" (Raio-X U71): leva à caixa de entrada dos e-mails mais comuns.
function caixaDeEntrada(email) {
  const d = (email.split('@')[1] || '').toLowerCase();
  if (/^(gmail|googlemail)\.com$/.test(d)) return 'https://mail.google.com/mail/u/0/#inbox';
  if (/^(hotmail|outlook|live|msn)\./.test(d)) return 'https://outlook.live.com/mail/0/inbox';
  if (/^yahoo\./.test(d)) return 'https://mail.yahoo.com/';
  if (/^(icloud|me|mac)\.com$/.test(d)) return 'https://www.icloud.com/mail';
  if (/^(uol|bol)\.com\.br$/.test(d)) return 'https://email.uol.com.br/';
  return null;
}
const WHATS = 'https://wa.me/55' + CONTATO.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Oi! Quero conhecer o beelo.');
const SEM_INTERNET_LOGIN = 'Sem internet. Para entrar, conecte-se ao Wi-Fi ou aos dados móveis e tente de novo.';

export default function Login() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [enviado, setEnviado] = useState('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // U72: o e-mail usado da última vez neste aparelho já vem preenchido.
    try { const ult = localStorage.getItem('beelo_email'); if (ult && !q.get('email')) setEmail(ult); } catch {}
    if (q.get('email')) setEmail(q.get('email'));
    if (q.get('erro')) setMsg({ tipo: 'erro', txt: 'Esse link não vale mais (ele só funciona uma vez e por pouco tempo). Peça um novo link de entrada abaixo.' });
    if (q.get('apagado')) setMsg({ tipo: 'ok', txt: 'O grupo e todos os dados dele foram apagados. Obrigado por usar o beelo.' });
    if (q.get('expirou')) setMsg({ tipo: 'erro', txt: 'Sua sessão expirou. Entre de novo para continuar.' });
    const conv = (q.get('email') || '').trim().toLowerCase();
    // Guarda o e-mail do convite: se a pessoa entrar com outra conta, a tela seguinte explica e oferece voltar.
    if (conv && (q.get('ja') || q.get('convite'))) document.cookie = `convite_email=${encodeURIComponent(conv)}; path=/; max-age=${7 * 86400}; samesite=lax`;
    const gmail = /@(gmail|googlemail)\.com$/.test(conv);
    if (q.get('ja')) setAviso(conv ? `Você já tem cadastro com ${conv}. Entre com esse mesmo e-mail.` : 'Você já tem cadastro. Entre com sua conta.');
    else if (q.get('convite') && q.get('de') && q.get('grupo')) setAviso(`${q.get('de').slice(0, 60)} convidou você para o grupo ${q.get('grupo').slice(0, 60)}. ${conv ? `Entre com o e-mail ${conv}: ` : ''}toque em Receber link de entrada por e-mail${gmail ? ' ou em Entrar com Google' : ''}.`);
    else if (q.get('convite') && q.get('de') && q.get('grupo')) setAviso(`${q.get('de').slice(0, 60)} convidou você para o grupo ${q.get('grupo').slice(0, 60)}. ${conv ? `Entre com o e-mail ${conv}: t` : 'T'}oque em Receber link de entrada por e-mail${gmail ? ' ou em Entrar com Google' : ''}.`);
    else if (q.get('convite')) setAviso(conv ? `Seu convite é para ${conv}. Entre com esse mesmo e-mail: toque em Receber link de entrada por e-mail${gmail ? ' ou em Entrar com Google' : ''}.` : 'Você foi convidado. Confirme seu e-mail e toque em Receber link de entrada por e-mail.');
  }, []);
  const volta = () => `${window.location.origin}/auth/callback`;

  async function google() {
    if (semRede()) { setMsg({ tipo: 'erro', txt: SEM_INTERNET_LOGIN }); return; }
    setCarregando(true);
    try {
      const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volta() } });
      if (error) {
        setMsg({ tipo: 'erro', txt: falhaDeRede(error) ? SEM_INTERNET_LOGIN : 'Não foi possível entrar com o Google agora. Use o link por e-mail abaixo.' });
        setCarregando(false);
      }
    } catch (e) {
      setMsg({ tipo: 'erro', txt: falhaDeRede(e) ? SEM_INTERNET_LOGIN : MSG.servidor });
      setCarregando(false);
    }
  }
  async function porEmail(e) {
    e?.preventDefault();
    if (semRede()) { setMsg({ tipo: 'erro', txt: SEM_INTERNET_LOGIN }); return; }
    setCarregando(true);
    let error;
    try {
      ({ error } = await supabaseBrowser().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: volta(), shouldCreateUser: true } }));
    } catch (e) { error = e; }
    setCarregando(false);
    if (error && falhaDeRede(error)) { setMsg({ tipo: 'erro', txt: SEM_INTERNET_LOGIN }); return; }
    if (error) { setMsg({ tipo: 'erro', txt: /rate|limit|seconds/i.test(error.message || '') ? 'Você pediu vários links seguidos. Espere 1 minuto e peça de novo.' : 'Não foi possível enviar o link agora. Tente de novo em alguns minutos.' }); return; }
    const em = email.trim().toLowerCase();
    try { localStorage.setItem('beelo_email', em); } catch {}
    setMsg(null); setEnviado(em);
  }
  // U71: depois de pedir o link, a tela diz o que fazer.
  if (enviado) {
    const caixa = caixaDeEntrada(enviado);
    return (
      <div className="login-enviado">
        <div className="card">
          <img src="/marca/beelo-horizontal-positiva-azul.svg" alt="beelo" style={{ height: 34, width: 'auto' }} />
          <h1>Abra seu e-mail</h1>
          <p>Enviamos um link para <b>{enviado}</b>. Toque no link do e-mail para entrar. Ele vale por pouco tempo e só uma vez.</p>
          {msg && <div className={`aviso ${msg.tipo}`} role="status">{msg.txt}</div>}
          {caixa && <a className="btn bloco" href={caixa} target="_blank" rel="noopener noreferrer">Abrir meu e-mail</a>}
          <button type="button" className="btn sec bloco" style={{ marginTop: 10 }} disabled={carregando}
            onClick={async () => { await porEmail(); setMsg({ tipo: 'ok', txt: 'Enviamos de novo. Olhe também a caixa de spam.' }); }}>Não chegou? Enviar de novo</button>
          <button type="button" className="link-btn" style={{ marginTop: 6 }} onClick={() => { setEnviado(''); setMsg(null); }}>Usar outro e-mail</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--fundo)' }}>
      <div style={{ background: '#1a6fe0', padding: '56px 24px 64px', color: '#fff' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ margin: 0, lineHeight: 0 }}><img src="/marca/beelo-horizontal-negativa-branca.svg" alt="beelo" style={{ height: 44, width: 'auto' }} /></h1>
          <p style={{ margin: 0, fontSize: 'var(--f-texto)', color: '#e6f0fe', maxWidth: 320 }}>Pais presentes, filhos protagonistas, famílias mais fortes.</p>
          <div className="entrada-beta">
            <span className="selo-beta">Versão beta</span>
            <nav aria-label="Informações">
              <a href="/privacidade">Privacidade</a><span aria-hidden="true">·</span>
              <a href="/termos">Termos de uso</a><span aria-hidden="true">·</span>
              <a href="/termos#contato">Relatar um problema</a>
            </nav>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, background: 'var(--cartao)', borderRadius: '28px 28px 0 0', marginTop: -28, padding: '28px 24px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--f-tela)', fontWeight: 800 }}>Entrar</h2>
          <p style={{ margin: '6px 0 18px', color: 'var(--cinza)', fontSize: 'var(--f-apoio)' }}>Tarefas, agenda e acompanhamento da sua família ou grupo.</p>
          {aviso && !msg && <div className="aviso ok" role="status">{aviso}</div>}
          {msg && <div className={`aviso ${msg.tipo}`}>{msg.txt}</div>}
          <button className="btn sec bloco" onClick={google} disabled={carregando} style={{ color: 'var(--texto)', borderColor: 'var(--campo)' }}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Entrar com Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 4px', color: 'var(--cinza)', fontSize: 'var(--f-apoio)' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--borda)' }} /> ou receba um link por e-mail <span style={{ flex: 1, height: 1, background: 'var(--borda)' }} />
          </div>
          <form onSubmit={porEmail}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button className="btn bloco" style={{ marginTop: 12 }} disabled={carregando}>Receber link de entrada por e-mail</button>
            <p style={{ textAlign: 'center', fontSize: 'var(--f-apoio)', color: 'var(--cinza)', margin: '8px 0 0' }}>Você não precisa de senha.</p>
          </form>
          <p style={{ marginTop: 22, textAlign: 'center', fontSize: 'var(--f-etq)', color: 'var(--cinza)' }}>
            Seus dados ficam só com a família.
          </p>
          {/* U70: uma porta para quem ainda não usa o beelo. */}
          <details className="conheca">
            <summary>Ainda não usa o beelo? Conheça</summary>
            <p>O beelo é o app da rotina da família: os pais combinam as tarefas, os filhos marcam o que fizeram e todo mundo acompanha a evolução, com carinho e sem cobrança.</p>
            <p>Estamos na versão beta, com algumas famílias convidadas. Quer usar com a sua? Fale com a gente:</p>
            <a className="btn whats bloco" href={WHATS} target="_blank" rel="noopener noreferrer">WhatsApp {CONTATO.whatsapp}</a>
            <p style={{ textAlign: 'center' }}><a href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a></p>
          </details>
        </div>
      </div>
    </div>
  );
}
