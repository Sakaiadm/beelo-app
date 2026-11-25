'use client';
// @arquivo  DesejoAprovar.js: Pai/Mãe aprovam (nome e preço) ou respondem "agora não" a um desejo.
// @tipo     componente
// @usa      ./Form, ./Icone, app/acoes-desafios, lib/desafios
// @usado-por app/(app)/desafios/page.js
import { useState } from 'react';
import Form from './Form';
import Icone from './Icone';
import { responderDesejo } from '@/app/acoes-desafios';
import { opcoesPreco, desejoGrande, AGORA_NAO } from '@/lib/desafios';

// Um desejo esperando os pais: nome e preço já vêm preenchidos (os pais podem ajustar) e um toque aprova.
// "Agora não" abre três mensagens carinhosas prontas.
export default function DesejoAprovar({ desejo, nome, sugerido, tem, porSemana, foto, avatar }) {
  const semanas = desejo.moeda === 'semanas';
  const [custo, setCusto] = useState(sugerido);
  const [agoraNao, setAgoraNao] = useState(false);
  const [msg, setMsg] = useState(AGORA_NAO[0]);
  const un = semanas ? (custo === 1 ? 'semana' : 'semanas') : 'estrelinhas';
  const grande = desejoGrande(custo, desejo.moeda);
  const falta = Math.max(custo - tem, 0);
  const sem = porSemana > 0 ? Math.ceil(falta / porSemana) : null;
  const conta = semanas
    ? `Cada semana com o desafio cumprido vale 1. ${nome} já tem ${tem}.`
    : falta === 0 ? `${nome} já tem estrelinhas para trocar.`
      : sem ? `Com o desafio da semana, ${nome} junta ${custo} em cerca de ${sem} ${sem === 1 ? 'semana' : 'semanas'}.` : `${nome} junta +10 a cada desafio cumprido.`;
  return (
    <div>
      <div className="des-top">
        {avatar}
        <span><b>{nome} sugeriu: {desejo.sugerido || desejo.nome}</b><small>{quando(desejo.criado_em)}</small></span>
      </div>
      {foto && <img src={foto} alt={`Foto do desejo: ${desejo.sugerido || desejo.nome}`} className="foto-mini" style={{ marginTop: 10, width: 96, height: 96 }} />}
      <Form acao={responderDesejo}>
        <input type="hidden" name="id" value={desejo.id} />
        <input type="hidden" name="aprovar" value="1" />
        <input type="hidden" name="custo" value={custo} />
        <label htmlFor={`dn-${desejo.id}`}>Nome do prêmio <span style={{ fontWeight: 500 }}>(pode ajustar)</span></label>
        <input id={`dn-${desejo.id}`} name="nome" maxLength={80} defaultValue={desejo.sugerido || desejo.nome} />
        <label>Vale quant{semanas ? 'as semanas' : 'as estrelinhas'}? <span style={{ fontWeight: 500 }}>(o app sugeriu {sugerido})</span></label>
        <div className="chips">
          {opcoesPreco(sugerido, desejo.moeda).map((v) => <button type="button" key={v} className={custo === v ? 'on' : ''} aria-pressed={custo === v} onClick={() => setCusto(v)}>{v}</button>)}
        </div>
        <div className="frase"><Icone nome="fala" tam={18} /><span>{conta}</span></div>
        {grande && <>
          <div className="aviso info" style={{ margin: '12px 0 0' }}>Prêmio grande: combinem as regras antes de aprovar.</div>
          <label htmlFor={`dr-${desejo.id}`}>Regra combinada <span style={{ fontWeight: 500 }}>(opcional)</span></label>
          <input id={`dr-${desejo.id}`} name="regra" maxLength={200} placeholder="Ex.: usar capacete e guardar na garagem" />
        </>}
        <button className="btn bloco" style={{ marginTop: 12, minHeight: 46 }}>Aprovar com {custo} {un}</button>
      </Form>
      <button type="button" className="link-btn" style={{ display: 'block', margin: '6px auto 0' }} onClick={() => setAgoraNao(true)}>Agora não</button>
      {agoraNao && (
        <div className="balao-fundo" onClick={(e) => { if (e.target === e.currentTarget) setAgoraNao(false); }}>
          <div className="balao" role="dialog" aria-modal="true" aria-labelledby={`an-${desejo.id}`}>
            <div className="balao-ic" style={{ background: 'var(--azul-claro)', color: 'var(--azul)' }}><Icone nome="fala" tam={24} /></div>
            <h2 id={`an-${desejo.id}`}>Responder para {nome}</h2>
            <p>Escolha uma mensagem. {nome} vê no app.</p>
            <Form acao={responderDesejo} aoEnviado={() => setTimeout(() => setAgoraNao(false), 1200)}>
              <input type="hidden" name="id" value={desejo.id} />
              <input type="hidden" name="aprovar" value="0" />
              <input type="hidden" name="resposta" value={msg} />
              <div className="chips" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                {AGORA_NAO.map((t) => <button type="button" key={t} className={msg === t ? 'on' : ''} aria-pressed={msg === t} style={{ textAlign: 'left', borderRadius: 14, padding: '10px 14px', minHeight: 0 }} onClick={() => setMsg(t)}>{t}</button>)}
              </div>
              <div className="balao-bts" style={{ marginTop: 14 }}>
                <button className="btn">Enviar</button>
                <button type="button" className="btn sec" onClick={() => setAgoraNao(false)}>Voltar</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

function quando(iso) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const ontem = new Date(Date.now() - 86400e3).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  return dia === hoje ? `Hoje, ${hora}` : dia === ontem ? `Ontem, ${hora}` : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
}
