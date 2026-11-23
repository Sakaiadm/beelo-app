'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { MSG, semRede, falhaDeRede } from '@/lib/rede';

const SEM_INTERNET_LOGIN = 'Sem internet. Para entrar, conecte-se ao Wi-Fi ou aos dados móveis e tente de novo.';

export default function Login() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('email')) setEmail(q.get('email'));
    if (q.get('erro')) setMsg({ tipo: 'erro', txt: 'Esse link não vale mais (ele só funciona uma vez e por pouco tempo). Peça um novo link de acesso abaixo.' });
    if (q.get('expirou')) setMsg({ tipo: 'erro', txt: 'Sua sessão expirou. Entre de novo para continuar.' });
    const conv = (q.get('email') || '').trim().toLowerCase();
    // Guarda o e-mail do convite: se a pessoa entrar com outra conta, a tela seguinte explica e oferece voltar.
    if (conv && (q.get('ja') || q.get('convite'))) document.cookie = `convite_email=${encodeURIComponent(conv)}; path=/; max-age=${7 * 86400}; samesite=lax`;
    const gmail = /@(gmail|googlemail)\.com$/.test(conv);
    if (q.get('ja')) setAviso(conv ? `Você já tem cadastro com ${conv}. Entre com esse mesmo e-mail.` : 'Você já tem cadastro. Entre com sua conta.');
    else if (q.get('convite')) setAviso(conv ? `Seu convite é para ${conv}. Entre com esse mesmo e-mail: toque em Enviar link de acesso${gmail ? ' ou em Entrar com Google' : ''}.` : 'Você foi convidado. Confirme seu e-mail e toque em Enviar link de acesso.');
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
    e.preventDefault();
    if (semRede()) { setMsg({ tipo: 'erro', txt: SEM_INTERNET_LOGIN }); return; }
    setCarregando(true);
    let error;
    try {
      ({ error } = await supabaseBrowser().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: volta(), shouldCreateUser: true } }));
    } catch (e) { error = e; }
    setCarregando(false);
    if (error && falhaDeRede(error)) { setMsg({ tipo: 'erro', txt: SEM_INTERNET_LOGIN }); return; }
    setMsg(error ? { tipo: 'erro', txt: /rate|limit|seconds/i.test(error.message || '') ? 'Você pediu vários links seguidos. Espere 1 minuto e peça de novo.' : 'Não foi possível enviar o link agora. Tente de novo em alguns minutos.' }
                 : { tipo: 'ok', txt: 'Enviamos um link de acesso para o seu e-mail. Abra o link no seu celular ou computador.' });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--fundo)' }}>
      <div style={{ background: '#1a6fe0', padding: '56px 24px 64px', color: '#fff' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ margin: 0, lineHeight: 0 }}><img src="/marca/beelo-horizontal-negativa-branca.svg" alt="beelo" style={{ height: 44, width: 'auto' }} /></h1>
          <p style={{ margin: 0, fontSize: 15, color: '#e6f0fe', maxWidth: 320 }}>Pais presentes, filhos protagonistas, famílias mais fortes.</p>
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
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Entrar</h2>
          <p style={{ margin: '6px 0 18px', color: 'var(--cinza)', fontSize: 14 }}>Só entra quem foi convidado pelos pais.</p>
          {aviso && !msg && <div className="aviso ok" role="status">{aviso}</div>}
          {msg && <div className={`aviso ${msg.tipo}`}>{msg.txt}</div>}
          <button className="btn sec bloco" onClick={google} disabled={carregando} style={{ color: 'var(--texto)', borderColor: 'var(--campo)' }}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Entrar com Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 4px', color: 'var(--cinza)', fontSize: 13 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--borda)' }} /> ou receba um link por e-mail <span style={{ flex: 1, height: 1, background: 'var(--borda)' }} />
          </div>
          <form onSubmit={porEmail}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button className="btn bloco" style={{ marginTop: 12 }} disabled={carregando}>Enviar link de acesso</button>
          </form>
          <p style={{ marginTop: 22, textAlign: 'center', fontSize: 12, color: 'var(--cinza)' }}>
            Seus dados ficam só com a família.
          </p>
        </div>
      </div>
    </div>
  );
}
