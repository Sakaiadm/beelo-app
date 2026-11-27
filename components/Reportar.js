'use client';
// @arquivo  Reportar.js: folha "Reportar problema ou sugestão" onde a pessoa escreve e anexa a foto (aberta pelo item do menu do usuário).
// @tipo     componente
// @usa      html-to-image (print da tela), components/Foto (câmera/galeria, 1600px, JPEG 80%, bucket privado rotina-fotos), components/Icone, app/acoes.js (enviarRelato)
// @usado-por components/MenuUsuario.js
// @decisao  27/11 Thomas: só duas opções de imagem: "print da tela" (captura feita pelo app ANTES de abrir a folha) e "da galeria"; sem câmera. Botão para todos durante o teste.
// @cuidado  tela, papel e aparelho vão junto automaticamente, para o Thomas não precisar perguntar "onde foi?".
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icone from './Icone';
import Foto from './Foto';
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
  const [foto, setFoto] = useState('');
  const [res, setRes] = useState(null);
  const [envia, setEnvia] = useState(false);
  const caminho = usePathname();
  const [urlPrint, setUrlPrint] = useState('');
  useEffect(() => { if (!print) { setUrlPrint(''); return; } const u = URL.createObjectURL(print); setUrlPrint(u); return () => URL.revokeObjectURL(u); }, [print]);

  function fechar() { setAberto(false); setRes((r) => (r?.ok ? null : r)); if (res?.ok) { setTexto(''); setFoto(''); setTipo('problema'); } }
  async function enviar() {
    setEnvia(true);
    const fd = new FormData();
    // Só uma imagem por relato: se a pessoa escolheu outra foto, ela vale no lugar do print.
    let anexo = foto;
    if (!anexo && print) {
      const cam = `${familia}/${membro}/${Date.now()}-print.jpg`;
      const r = await supabaseBrowser().storage.from('rotina-fotos').upload(cam, print, { contentType: 'image/jpeg' });
      if (!r.error) anexo = cam;
    }
    fd.set('tipo', tipo); fd.set('texto', texto); fd.set('foto', anexo);
    fd.set('tela', `${telaDe(caminho)} (${caminho})`); fd.set('papel', papel); fd.set('aparelho', aparelho());
    setRes(await enviarRelato(null, fd));
    setEnvia(false);
  }

  return (
    <>
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
                  {/* Duas opções: o print da tela de onde a pessoa veio (já tirado) ou uma imagem da galeria. Sem câmera (Thomas 27/11). */}
                  {urlPrint && !foto && (
                    <div className="cartao-l" style={{ marginBottom: 10 }}>
                      <img src={urlPrint} alt="Print da tela de onde você veio" style={{ width: 64, height: 96, objectFit: 'cover', objectPosition: 'top', borderRadius: 10, border: '1px solid var(--borda)' }} />
                      <span className="corpo"><b>Print da tela de {telaDe(caminho)}</b><small className="peq-cinza" style={{ whiteSpace: 'normal' }}>Tirado agora, antes de abrir esta caixa. Vai junto com o relato.</small></span>
                      <button type="button" className="folha-volta" aria-label="Tirar o print do relato" title="Tirar o print do relato" onClick={() => setPrint(null)}><Icone nome="x" tam={20} /></button>
                    </div>
                  )}
                  <Foto nome="relato" familia={familia} membro={membro} grande semCamera rotuloGaleria={foto ? 'Escolher outra da galeria' : 'Da galeria'} aoMudar={setFoto} />
                  <p className="peq-cinza" style={{ margin: '8px 0 0' }}>{urlPrint && !foto ? 'Quer outra imagem? Escolha da galeria; ela vale no lugar do print.' : print === null || !urlPrint ? 'Sem print da tela. Se quiser, tire um print do aparelho e escolha da galeria.' : ''}</p>
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
