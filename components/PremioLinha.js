'use client';
// @arquivo  PremioLinha.js: linha de um prêmio na vitrine.
// @tipo     componente
// @usa      ./Form, ./DesafioCartao, app/acoes-desafios
// @usado-por app/(app)/desafios/premios/page.js
import { useState, useTransition } from 'react';
import Form from './Form';
import { Hexagono } from './DesafioCartao';
import Icone from './Icone';
import { editarPremio, alternarPremio, excluirPremio } from '@/app/acoes-desafios';

// Vitrine: tocar na linha abre o prêmio para editar; a chave à direita ativa ou desativa (Raio-X U92).
export default function PremioLinha({ premio, un, teen, sub }) {
  const [aberto, setAberto] = useState(false);
  // @decisao 27/11 Thomas: "Tirar da vitrine" virou chave Ativado/Desativado na própria linha (prévia).
  const [ativo, setAtivo] = useState(!!premio.ativo);
  const [, comeco] = useTransition();
  const [excluindo, setExcluindo] = useState(false);
  const [sumiu, setSumiu] = useState(false);
  const excluir = () => { setSumiu(true); const fd = new FormData(); fd.set('id', premio.id); comeco(() => { excluirPremio(fd); }); };
  const trocar = () => {
    const novo = !ativo;
    setAtivo(novo);
    const fd = new FormData(); fd.set('id', premio.id); fd.set('ativo', novo ? '1' : '0');
    comeco(() => { alternarPremio(fd); });
  };
  if (sumiu) return null;
  const Moeda = Hexagono; // 27/11 Thomas: hexágono com check também nas crianças (prévia)
  return (
    <div className={`vit vit-col${ativo ? '' : ' apagado'}`}>
      <div className="vit-topo">
      <button type="button" className="vit-linha" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="des-ic mel"><Moeda tam={22} /></span>
        <span className="corpo"><b>{premio.nome}</b><small>{sub}</small></span>
        <span className="seta" aria-hidden="true">{aberto ? '⌄' : '›'}</span>
      </button>
      <button type="button" role="switch" aria-checked={ativo} aria-label={`${premio.nome}: ${ativo ? 'ativado' : 'desativado'}`} className={`chave ${ativo ? 'on' : ''}`} onClick={trocar} />
      <button type="button" className="vit-x" aria-label={`Retirar ${premio.nome} da vitrine`} onClick={() => setExcluindo(true)}><Icone nome="x" tam={16} /></button>
      </div>
      {excluindo && (
        <div className="vit-aviso vit-conf" role="alertdialog" aria-label="Confirmar retirada">
          <span>Retirar da vitrine</span>
          <span className="vit-conf-bt"><button type="button" className="btn perigo peq" onClick={excluir}>Retirar</button><button type="button" className="btn sec peq" onClick={() => setExcluindo(false)}>Cancelar</button></span>
        </div>
      )}
      {!ativo && <p className="vit-aviso" role="status">Desativado: a criança não vê este prêmio. Você pode ativar de novo quando quiser.</p>}
      {aberto && (
        <div className="vit-ed">
          <Form acao={editarPremio} aoConcluir={() => setTimeout(() => setAberto(false), 900)}>
            <input type="hidden" name="id" value={premio.id} />
            <div className="dupla">
              <div><label htmlFor={`en-${premio.id}`} style={{ marginTop: 0 }}>Nome</label><input id={`en-${premio.id}`} name="nome" maxLength={80} defaultValue={premio.nome} /></div>
              <div><label htmlFor={`ec-${premio.id}`} style={{ marginTop: 0 }}>{un[0].toUpperCase() + un.slice(1)}</label><input id={`ec-${premio.id}`} name="custo" type="number" min="1" max="1000" inputMode="numeric" defaultValue={premio.custo} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn peq">Salvar</button>
              <button type="button" className="btn sec peq" onClick={() => setAberto(false)}>Cancelar</button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
