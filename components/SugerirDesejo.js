'use client';
// @arquivo  SugerirDesejo.js: a criança sugere um desejo.
// @tipo     componente
// @usa      ./Form, ./Foto, ./Icone, app/acoes-desafios, lib/desafios
// @usado-por app/(app)/desafios/cofrinho/page.js
import { useState } from 'react';
import Form from './Form';
import Foto from './Foto';
import Icone from './Icone';
import { sugerirDesejo } from '@/app/acoes-desafios';
import { MAX_DESEJOS } from '@/lib/desafios';

// "Sugerir um desejo": só o nome (foto opcional). Os pais respondem e combinam o preço.
export default function SugerirDesejo({ familia, membro, esperando, moeda = 'estrelas' }) {
  const [aberto, setAberto] = useState(false);
  const cheio = esperando >= MAX_DESEJOS;
  return (
    <>
      <button type="button" className="btn sec bloco" style={{ marginTop: 12 }} disabled={cheio} onClick={() => setAberto(true)}>
        <Icone nome="mais" tam={20} />Sugerir um desejo
      </button>
      <p className="sub" style={{ fontSize: 'var(--f-apoio)', textAlign: 'center', margin: '8px 0 0' }}>
        {cheio ? `Você já tem ${MAX_DESEJOS} desejos esperando. Espere a resposta dos seus responsáveis.` : `Você pode ter até ${MAX_DESEJOS} desejos esperando.`}
      </p>
      {aberto && (
        <div className="balao-fundo" onClick={(e) => { if (e.target === e.currentTarget) setAberto(false); }}>
          <div className="balao" role="dialog" aria-modal="true" aria-labelledby="desejo-tit">
            <div className="balao-ic" style={{ background: 'var(--mel-fundo)', color: 'var(--mel)' }}><Icone nome="presente" tam={26} /></div>
            <h2 id="desejo-tit">Sugerir um desejo</h2>
            <p>Seus responsáveis veem e combinam com você quantas {moeda === 'semanas' ? 'semanas' : 'estrelinhas'} ele vale.</p>
            <Form acao={sugerirDesejo} aoEnviado={() => setTimeout(() => setAberto(false), 1400)}>
              <label htmlFor="desejo-nome" style={{ marginTop: 0 }}>O que você quer?</label>
              <input id="desejo-nome" name="nome" maxLength={80} placeholder="Ex.: patins" autoComplete="off" required />
              <div style={{ marginTop: 10 }}><Foto nome="foto" familia={familia} membro={membro} /></div>
              <div className="balao-bts" style={{ marginTop: 14 }}>
                <button className="btn">Enviar para meus responsáveis</button>
                <button type="button" className="btn sec" onClick={() => setAberto(false)}>Cancelar</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
