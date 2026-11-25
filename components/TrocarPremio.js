'use client';
// @arquivo  TrocarPremio.js: trocar estrelinhas/semanas por um prêmio.
// @tipo     componente
// @usa      ./Form, app/acoes-desafios
// @usado-por app/(app)/desafios/cofrinho/page.js
import { useState } from 'react';
import Form from './Form';
import { pedirPremio } from '@/app/acoes-desafios';

const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

// Trocar estrelinhas (ou semanas) por um prêmio: balão com a conta feita e a opção de continuar juntando.
export default function TrocarPremio({ premio, membro, tem, moeda, maior }) {
  const [aberto, setAberto] = useState(false);
  const un = moeda === 'semanas' ? 'semanas' : 'estrelinhas';
  return (
    <>
      <button type="button" className="btn peq" onClick={() => setAberto(true)}>{moeda === 'semanas' ? 'Usar' : 'Trocar'}</button>
      {aberto && (
        <div className="balao-fundo" onClick={(e) => { if (e.target === e.currentTarget) setAberto(false); }}>
          <div className="balao" role="alertdialog" aria-modal="true" aria-labelledby="troca-tit">
            <div className="balao-ic" style={{ background: 'var(--mel-fundo)' }}><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'var(--mel)' }}><path d={STAR} /></svg></div>
            <h2 id="troca-tit">{moeda === 'semanas' ? 'Usar' : 'Trocar'} por {premio.nome}?</h2>
            <p>Você tem {tem} {un}. Depois da troca, {tem - premio.custo === 1 ? 'fica 1' : `ficam ${tem - premio.custo}`}.</p>
            {maior && <p style={{ fontSize: 'var(--f-apoio)', color: 'var(--cinza)' }}>Ou continue juntando: faltam {maior.custo - tem} para {maior.nome}.</p>}
            <Form acao={pedirPremio} aoEnviado={() => setTimeout(() => setAberto(false), 1600)}>
              <input type="hidden" name="premio" value={premio.id} />
              {membro && <input type="hidden" name="membro" value={membro} />}
              <div className="balao-bts">
                <button className="btn">{moeda === 'semanas' ? 'Usar agora' : 'Trocar agora'}</button>
                <button type="button" className="btn sec" onClick={() => setAberto(false)}>Continuar juntando</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
