'use client';
import { useState } from 'react';
import Form from './Form';
import { aceitarTermos } from '@/app/acoes';

// Caixas de aceite: cada uma separada, o botão só libera com todas marcadas.
function Caixa({ nome, marcada, mudar, children }) {
  return (
    <label className={`aceite ${marcada ? 'marcada' : ''}`}>
      <input type="checkbox" name={nome} value="1" checked={marcada} onChange={(e) => mudar(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export default function AceiteForm({ meu, crianca, menores = [] }) {
  const [m, setM] = useState({});
  const marca = (k) => (v) => setM((x) => ({ ...x, [k]: v }));
  const precisa = [
    ...(meu ? (crianca ? ['aviso_crianca'] : ['termos', 'privacidade']) : []),
    ...menores.map((x) => `autorizo_${x.id}`),
  ];
  const pronto = precisa.every((k) => m[k]);
  const doc = (href, txt) => <a href={href} target="_blank" rel="noopener">{txt}</a>;
  return (
    <Form acao={aceitarTermos} className="card">
      {meu && crianca && (
        <Caixa nome="aviso_crianca" marcada={!!m.aviso_crianca} mudar={marca('aviso_crianca')}>Entendi como o beelo cuida dos meus dados.</Caixa>
      )}
      {meu && !crianca && (
        <>
          <Caixa nome="termos" marcada={!!m.termos} mudar={marca('termos')}>Li e aceito os {doc('/termos', 'Termos de uso')} do beelo.</Caixa>
          <Caixa nome="privacidade" marcada={!!m.privacidade} mudar={marca('privacidade')}>Li a {doc('/privacidade', 'Política de privacidade')} e entendi como os meus dados são usados.</Caixa>
        </>
      )}
      {menores.length > 0 && (
        <>
          <h2 style={{ fontSize: 'var(--f-texto)', margin: meu ? '18px 0 6px' : '0 0 6px' }}>Autorização do responsável</h2>
          <p className="peq-cinza" style={{ margin: '0 0 10px' }}>
            A lei pede que o pai, a mãe ou o responsável legal autorize, em destaque, o uso dos dados de crianças e adolescentes. Leia o {doc('/consentimento', 'Termo de consentimento')}.
          </p>
          {menores.map((x) => (
            <span key={x.id}>
              <input type="hidden" name="menor" value={x.id} />
              <Caixa nome={`autorizo_${x.id}`} marcada={!!m[`autorizo_${x.id}`]} mudar={marca(`autorizo_${x.id}`)}>
                Sou pai, mãe ou responsável legal de <b>{x.nome}</b> (ou tenho a autorização de quem é) e autorizo o uso dos dados de {x.nome.split(' ')[0]} no beelo.
              </Caixa>
            </span>
          ))}
        </>
      )}
      <button className="btn bloco" style={{ marginTop: 6 }} disabled={!pronto}>Continuar</button>
      {!pronto && <p className="peq-cinza" style={{ textAlign: 'center', margin: '8px 0 0' }}>Marque {precisa.length > 1 ? 'todas as caixas' : 'a caixa'} para continuar.</p>}
    </Form>
  );
}
