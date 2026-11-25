'use client';
// @arquivo  Responder.js: botões de resposta com "Desfazer" por 5 segundos.
// @tipo     componente
// @usa      ./Form
// @usado-por app/(app)/notificacoes/page.js, app/(app)/painel/page.js, app/(app)/tela/page.js, components/Tarefa.js
import { useEffect, useRef, useState } from 'react';
import Form from './Form';

const ESPERA_MS = 5000;

// Botões de resposta com "Desfazer" por 5 segundos (Raio-X U32 e U33).
// A resposta só vai para o servidor depois da espera: um toque errado não chega à pessoa.
// campos: { id: '…' } (vão em todas as opções). opcoes: [{ txt, feito, valores: {…}, classe }].
export default function Responder({ acao, fila, rotulo, campos, opcoes }) {
  const [esc, setEsc] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const timer = useRef(null);
  const botao = useRef(null);
  const pend = useRef(null); // a escolha que ainda não foi enviada

  const dados = (op) => {
    const fd = new FormData();
    Object.entries({ ...campos, ...op.valores }).forEach(([k, v]) => fd.set(k, v));
    return fd;
  };
  // Se a pessoa sair da tela (ou fechar o app) durante a espera, a resposta vai na hora.
  const enviarJa = () => {
    if (pend.current == null) return;
    const op = opcoes[pend.current];
    pend.current = null;
    clearTimeout(timer.current);
    acao(null, dados(op)).catch(() => {});
  };
  useEffect(() => {
    window.addEventListener('pagehide', enviarJa);
    return () => { window.removeEventListener('pagehide', enviarJa); enviarJa(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const escolher = (i) => {
    setEsc(i); pend.current = i;
    timer.current = setTimeout(() => { pend.current = null; setEnviado(true); botao.current?.click(); }, ESPERA_MS);
  };
  const desfazer = () => { clearTimeout(timer.current); pend.current = null; setEsc(null); };
  const op = esc != null ? opcoes[esc] : null;

  return (
    <div className="responder">
      {op && !enviado && (
        <div className="desfazer" role="status">
          <span>{op.feito}.</span>
          <button type="button" className="link-btn" onClick={desfazer}>Desfazer</button>
          <i style={{ animationDuration: `${ESPERA_MS}ms` }} aria-hidden="true" />
        </div>
      )}
      {op && enviado && <div className="desfazer feito" role="status"><span>{op.feito}.</span></div>}
      <Form acao={acao} fila={fila} rotulo={rotulo} discreto aoErro={() => { setEnviado(false); setEsc(null); }}>
        {op && Object.entries({ ...campos, ...op.valores }).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <button ref={botao} hidden tabIndex={-1} aria-hidden="true" />
        {!op && (
          <div className="acoes">
            {opcoes.map((o, i) => <button key={o.txt} type="button" className={o.classe || 'btn peq'} onClick={() => escolher(i)}>{o.txt}</button>)}
          </div>
        )}
      </Form>
    </div>
  );
}

