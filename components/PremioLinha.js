'use client';
// @arquivo  PremioLinha.js: linha de um prêmio na vitrine.
// @tipo     componente
// @usa      ./Form, ./DesafioCartao, app/acoes-desafios
// @usado-por app/(app)/desafios/premios/page.js
import { useState } from 'react';
import Form from './Form';
import { Estrela, Hexagono } from './DesafioCartao';
import { editarPremio, alternarPremio } from '@/app/acoes-desafios';

// Vitrine: a linha inteira abre o prêmio; editar e "Tirar" ficam lá dentro (Raio-X U92).
export default function PremioLinha({ premio, un, teen, sub }) {
  const [aberto, setAberto] = useState(false);
  const Moeda = teen ? Hexagono : Estrela;
  return (
    <div className={`vit vit-col${premio.ativo ? '' : ' apagado'}`}>
      <button type="button" className="vit-linha" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="des-ic mel"><Moeda tam={22} /></span>
        <span className="corpo"><b>{premio.nome}</b><small>{sub}</small></span>
        <span className="seta" aria-hidden="true">{aberto ? '⌄' : '›'}</span>
      </button>
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
          <Form acao={alternarPremio} simples>
            <input type="hidden" name="id" value={premio.id} /><input type="hidden" name="ativo" value={premio.ativo ? '0' : '1'} />
            <button className="btn sec peq" style={{ marginTop: 10 }}>{premio.ativo ? 'Tirar da vitrine' : 'Voltar para a vitrine'}</button>
          </Form>
        </div>
      )}
    </div>
  );
}
