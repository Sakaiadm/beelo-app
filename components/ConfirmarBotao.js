'use client';
// @arquivo  ConfirmarBotao.js: botão que pede confirmação antes de executar (excluir, sair).
// @tipo     componente
// @usa      ./Form, ./Icone
// @usado-por app/(app)/config/familias/[id]/page.js, app/(app)/desafios/ajustes/page.js, app/(app)/desafios/page.js, app/(app)/tela/page.js, components/CategoriaForm.js, components/ExcluirTarefa.js e mais 1
import { useEffect, useRef, useState } from 'react';
import Form from './Form';
import Icone from './Icone';

// Botão que abre um balão por cima da tela perguntando "Tem certeza?" antes de enviar
// (usado em todos os lugares de excluir e desativar).
// O balão fecha em Cancelar, tocando fora, com Esc ou com o botão voltar do celular.
// - rotulo/classe: o botão que fica na página.  gatilho: atributos extras desse botão (ex.: interruptor).
// - titulo: título do balão ("Excluir pessoa?").  nome/detalhe/avatar: o que será apagado, em destaque.
// - simples: false quando a ação recebe (estado, dados), como excluirTarefa.
// - pergunta: a mensagem.  sim/nao: textos dos botões.  icone: 'lixeira' ou 'bloquear'.
export default function ConfirmarBotao({ acao, campos, rotulo, pergunta, sim = 'Sim', nao = 'Cancelar', titulo, nome, detalhe, avatar, icone = 'lixeira', classe = 'btn sec peq', gatilho, simples = true }) {
  const [aberto, setAberto] = useState(false);
  const comHistorico = useRef(false);
  const naoRef = useRef(null);
  const gatilhoRef = useRef(null);

  // Botão voltar do celular: abre uma "página" no histórico e fecha o balão quando ela é desfeita.
  useEffect(() => {
    if (!aberto) return;
    try { window.history.pushState({ ...(window.history.state || {}), balao: 1 }, ''); comHistorico.current = true; } catch { comHistorico.current = false; }
    const aoVoltar = () => { comHistorico.current = false; setAberto(false); };
    const aoTecla = (e) => { if (e.key === 'Escape') fechar(); };
    window.addEventListener('popstate', aoVoltar);
    document.addEventListener('keydown', aoTecla);
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    naoRef.current?.focus();
    return () => {
      window.removeEventListener('popstate', aoVoltar);
      document.removeEventListener('keydown', aoTecla);
      document.body.style.overflow = rolagem;
    };
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  function fechar() {
    if (comHistorico.current) { comHistorico.current = false; window.history.back(); } // o popstate fecha o balão
    setAberto(false);
    setTimeout(() => gatilhoRef.current?.focus(), 0);
  }
  // Deu erro (ex.: sem internet): fecha o balão para a mensagem aparecer na página.
  function aoErro() { fechar(); }

  return (
    <Form acao={acao} simples={simples} aoErro={aoErro} aoEnviado={fechar}>
      {Object.entries(campos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button ref={gatilhoRef} type="button" className={classe} {...gatilho} onClick={() => setAberto(true)}>{rotulo}</button>
      {aberto && (
        <div className="balao-fundo" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
          <div className="balao" role="alertdialog" aria-modal="true" aria-labelledby="balao-titulo" aria-describedby="balao-msg">
            <span className="balao-ic"><Icone nome={icone} tam={24} /></span>
            {titulo && <h2 id="balao-titulo">{titulo}</h2>}
            {nome && (
              <div className="balao-quem">
                {avatar}
                <span><b>{nome}</b>{detalhe && <small>{detalhe}</small>}</span>
              </div>
            )}
            <p id="balao-msg">{pergunta}</p>
            <div className="balao-bts">
              <button className="btn perigo">{sim}</button>
              <button ref={naoRef} type="button" className="btn" onClick={fechar}>{nao}</button>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}
