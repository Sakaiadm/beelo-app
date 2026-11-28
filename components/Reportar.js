'use client';
// @arquivo  Reportar.js: folha "Reportar problema ou sugestão" onde a pessoa escreve e anexa a foto (aberta pelo item do menu do usuário).
// @tipo     componente
// @usa      html-to-image (print da tela), components/Foto (comprimir: 1600px, JPEG 80%), components/ImagemMarcar (lápis), bucket privado rotina-fotos, components/Icone, app/acoes.js (enviarRelato)
// @usado-por components/MenuUsuario.js
// @decisao  27/11 Thomas: só duas opções de imagem: "print da tela" (captura feita pelo app ANTES de abrir a folha) e "da galeria"; sem câmera. Botão para todos durante o teste.
// @cuidado  tela, papel e aparelho vão junto automaticamente, para o Thomas não precisar perguntar "onde foi?".
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icone from './Icone';
import { comprimir } from './Foto';
import ImagemMarcar from './ImagemMarcar';
import { enviarRelato } from '@/app/acoes';
import { supabaseBrowser } from '@/lib/supabase/client';

// Desenha a tela atual numa imagem (html-to-image, funciona no iPhone e no Android).
// @cuidado é uma foto APROXIMADA: refaz a página pelo HTML/CSS, então pode sair diferente (fotos de fora, vídeos, janelas do navegador).
// Chamar ANTES de abrir a folha, senão o print sairia da própria caixa. Falhou? devolve null e o relato segue sem print.
export async function capturarTela() {
  try {
    const { toJpeg } = await import('html-to-image');
    const esc = Math.min(1, 1600 / Math.max(innerWidth, innerHeight));
    const opc = { quality: 0.8, pixelRatio: esc, width: innerWidth, height: innerHeight, backgroundColor: getComputedStyle(document.body).backgroundColor, cacheBust: false, imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', filter: (n) => !(n.classList && n.classList.contains('folha')) && !(n.tagName === 'IMG' && !n.naturalWidth), style: { transform: `translate(${-scrollX}px, ${-scrollY}px)`, transformOrigin: 'top left' } };
    await toJpeg(document.body, opc); // 1ª chamada "aquece" as imagens (o Safari do iPhone às vezes sai em branco na primeira)
    const url = await Promise.race([toJpeg(document.body, opc), new Promise((_, no) => setTimeout(() => no(new Error('demorou')), 8000))]);
    const bin = atob(url.split(',')[1]); const u8 = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new Blob([u8], { type: 'image/jpeg' });
  } catch (e) { void e; return null; }
}

// Nome da tela em português simples, a partir do endereço.
const TELAS = { '/painel': 'Painel', '/hoje': 'Hoje', '/agenda': 'Agenda', '/desafios': 'Desafios', '/tela': 'Tempo de tela', '/relatorios': 'Relatórios', '/config': 'Cadastros', '/perfil': 'Meu perfil', '/ajuda': 'Ajuda', '/ideias': 'Ideias', '/notificacoes': 'Avisos', '/tarefas': 'Tarefas' };
const telaDe = (p) => TELAS['/' + (p || '').split('/')[1]] || (p || '/');
// Aparelho resumido: "iPhone · Safari · app instalado · 390×844".
function aparelho() {
  const u = navigator.userAgent;
  const so = /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'Mac' : 'outro';
  const nav = /Edg\//.test(u) ? 'Edge' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /Firefox|FxiOS/.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'outro';
  const inst = (matchMedia('(display-mode: standalone)').matches || navigator.standalone) ? 'app instalado' : 'no navegador';
  return `${so} · ${nav} · ${inst} · ${innerWidth}×${innerHeight}`;
}

// A folha fica FORA do menu (o menu fecha ao tocar no item e levaria a folha junto).
export default function Reportar({ familia, membro, papel, aberto, setAberto, print, setPrint }) {
  const [tipo, setTipo] = useState('problema');
  const [texto, setTexto] = useState('');
  const [origem, setOrigem] = useState('print'); // print da tela ou galeria
  const [marcado, setMarcado] = useState(null); // { blob, descricao[] } depois do lápis
  const [lapis, setLapis] = useState(false);
  const [msgImg, setMsgImg] = useState('');
  const [res, setRes] = useState(null);
  const [envia, setEnvia] = useState(false);
  const caminho = usePathname();
  const [urlPrint, setUrlPrint] = useState('');
  useEffect(() => { if (aberto) { setOrigem('print'); setMarcado(null); setMsgImg(''); } }, [aberto]);
  const [urlMarcado, setUrlMarcado] = useState('');
  useEffect(() => { if (!marcado?.blob) { setUrlMarcado(''); return; } const u = URL.createObjectURL(marcado.blob); setUrlMarcado(u); return () => URL.revokeObjectURL(u); }, [marcado]);
  useEffect(() => { if (!print) { setUrlPrint(''); return; } const u = URL.createObjectURL(print); setUrlPrint(u); return () => URL.revokeObjectURL(u); }, [print]);

  function fechar() { setAberto(false); setRes((r) => (r?.ok ? null : r)); if (res?.ok) { setTexto(''); setPrint(null); setMarcado(null); setTipo('problema'); } }
  async function enviar() {
    setEnvia(true);
    const fd = new FormData();
    // Uma imagem por relato: o print da tela ou a da galeria; se a pessoa desenhou nela, vai a versão marcada.
    const imagem = marcado?.blob || print;
    let anexo = '';
    if (imagem) {
      const cam = `${familia}/${membro}/${Date.now()}-relato.jpg`;
      const r = await supabaseBrowser().storage.from('rotina-fotos').upload(cam, imagem, { contentType: 'image/jpeg' });
      if (!r.error) anexo = cam;
    }
    // As marcações também vão em palavras no texto, para o Thomas saber o lugar exato.
    const extra = marcado?.descricao?.length ? `\n\n[Marcações na imagem, em vermelho e numeradas]\n${marcado.descricao.map((d) => `- ${d}`).join('\n')}` : '';
    fd.set('tipo', tipo); fd.set('texto', texto.trim() + extra); fd.set('foto', anexo);
    fd.set('tela', `${telaDe(caminho)} (${caminho})`); fd.set('papel', papel); fd.set('aparelho', aparelho());
    setRes(await enviarRelato(null, fd));
    setEnvia(false);
  }

  return (
    <>
      {aberto && lapis && urlPrint && (
        <ImagemMarcar src={urlPrint} tracosIniciais={marcado?.tracos || []} fechar={() => setLapis(false)}
          aoPronto={async (m) => {
            setLapis(false);
            if (!m.tracos.length) { setMarcado(null); return; }
            let blob = null;
            if (m.url) { const bin = atob(m.url.split(',')[1]); blob = new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))], { type: 'image/jpeg' }); }
            setMarcado({ blob, descricao: m.descricao, tracos: m.tracos });
          }} />
      )}
      {aberto && (
        <div className="folha" role="dialog" aria-modal="true" aria-label="Reportar problema ou sugestão">
          <div className="folha-in">
            <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={fechar}><Icone nome="esq" tam={26} /></button><h2>Reportar ou sugerir</h2></div>
            {res?.ok ? (
              <>
                <div className="aviso ok" role="status">Recebi! Obrigado por ajudar o beelo a ficar melhor.</div>
                <button type="button" className="btn bloco" onClick={fechar}>Fechar</button>
              </>
            ) : (
              <>
                <div className="seg" role="tablist" aria-label="Tipo" style={{ marginBottom: 0 }}>
                  <button type="button" role="tab" aria-selected={tipo === 'problema'} className={tipo === 'problema' ? 'on' : ''} onClick={() => setTipo('problema')}>Algo deu errado</button>
                  <button type="button" role="tab" aria-selected={tipo === 'sugestao'} className={tipo === 'sugestao' ? 'on' : ''} onClick={() => setTipo('sugestao')}>Tenho uma ideia</button>
                </div>
                <label style={{ fontWeight: 700 }}>{tipo === 'problema' ? 'O que aconteceu?' : 'Qual é a sua ideia?'}
                  <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} rows={5} placeholder={tipo === 'problema' ? 'Conte o que você tentou fazer e o que apareceu…' : 'Conte o que você gostaria de ver no beelo…'} style={{ marginTop: 6, fontWeight: 400 }} />
                </label>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Imagem <small className="peq-cinza" style={{ fontWeight: 400 }}>(opcional)</small></div>
                  {/* Duas opções: o print da tela de onde a pessoa veio (já tirado) ou uma imagem da galeria. Toque na imagem para ampliar e marcar com o lápis. */}
                  {urlPrint && (
                    <div className="cartao-l" style={{ marginBottom: 10 }}>
                      <button type="button" onClick={() => setLapis(true)} aria-label="Ampliar a imagem e marcar com o lápis" style={{ position: 'relative', padding: 0, border: 0, background: 'none', cursor: 'pointer', flex: 'none' }}>
                        <img src={urlMarcado || urlPrint} alt="Imagem do relato" style={{ width: 64, height: 96, objectFit: 'cover', objectPosition: 'top', borderRadius: 10, border: '1px solid var(--borda)', display: 'block' }} />
                        <span className="icone-btn" aria-hidden="true" style={{ position: 'absolute', right: -6, bottom: -6, width: 28, height: 28, background: '#1a6fe0' }}><Icone nome="lapis" tam={14} cor="#fff" /></span>
                        {marcado?.descricao?.length > 0 && <span className="tg" style={{ position: 'absolute', left: 4, top: 4, background: '#2c9a5b', color: '#fff' }}>✓ Marcado</span>}
                      </button>
                      <span className="corpo"><b>{origem === 'print' ? `Print da tela de ${telaDe(caminho)}` : 'Imagem da galeria'}</b>
                        <small className="peq-cinza" style={{ whiteSpace: 'normal' }}>{marcado?.descricao?.length ? `${marcado.descricao.length} ${marcado.descricao.length === 1 ? 'marcação feita' : 'marcações feitas'}. Toque para mudar.` : 'Toque na imagem para ampliar e marcar onde está o problema.'}</small></span>
                      <button type="button" className="folha-volta" aria-label="Tirar a imagem do relato" title="Tirar a imagem" onClick={() => { setPrint(null); setMarcado(null); }}><Icone nome="x" tam={20} /></button>
                    </div>
                  )}
                  <input id="relato-galeria" type="file" accept="image/*" hidden onChange={async (e) => {
                    const arq = e.target.files?.[0]; e.target.value = '';
                    if (!arq) return;
                    try { setPrint(await comprimir(arq)); setOrigem('galeria'); setMarcado(null); setMsgImg(''); } catch { setMsgImg('Não foi possível abrir essa imagem. Tente outra.'); }
                  }} />
                  <button type="button" className="btn sec peq bloco" onClick={() => document.getElementById('relato-galeria').click()}><Icone nome="galeria" tam={18} />{urlPrint ? 'Trocar por uma imagem da galeria' : 'Da galeria'}</button>
                  {msgImg && <div className="peq-cinza" style={{ color: 'var(--erro)', marginTop: 6 }}>{msgImg}</div>}
                </div>
                <p className="peq-cinza" style={{ margin: 0 }}>Vai junto, sem você digitar: a tela onde você está ({telaDe(caminho)}), seu perfil e o aparelho.</p>
                {res?.erro && <div className="aviso erro" role="alert">{res.erro}</div>}
                <button type="button" className="btn bloco" disabled={envia || texto.trim().length < 5} onClick={enviar}>{envia ? 'Enviando…' : 'Enviar'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
