'use client';
// @arquivo  SugerirDesejo.js: botão "+ Desejo" (alto da aba Desejos) e cadastro do desejo, com o botão Sugestões.
// @tipo     componente (cliente)
// @usa      ./Form, ./Foto, ./Icone, app/acoes-desafios, lib/desafios
// @usado-por app/(app)/desafios/desejos/page.js
// @decisao  28/11 Thomas: mesmo padrão da Nova tarefa: botão azul "+ Desejo" no alto, rótulo + botão Sugestões (lâmpada) acima do campo,
//           folha de Sugestões em categorias (grade com ícones). Tocar numa ideia só preenche o nome; quem confirma é a pessoa.
// @cuidado  os preços não são escolhidos aqui: os responsáveis combinam o valor ao responder.
import { useState } from 'react';
import Form from './Form';
import Foto from './Foto';
import Icone from './Icone';
import { sugerirDesejo } from '@/app/acoes-desafios';
import { MAX_DESEJOS, ICONE_DESEJO, ideiasDesejo } from '@/lib/desafios';

export default function SugerirDesejo({ familia, membro, esperando, moeda = 'estrelas', faixa = 'mais8' }) {
  const [aberto, setAberto] = useState(false);
  const [folha, setFolha] = useState(false);
  const [nome, setNome] = useState('');
  const [cat, setCat] = useState(0);
  const cheio = esperando >= MAX_DESEJOS;
  const cats = ideiasDesejo(faixa);
  const fechar = () => { setAberto(false); setFolha(false); setNome(''); };
  return (
    <>
      <button type="button" className="btn" disabled={cheio} onClick={() => setAberto(true)}><Icone nome="mais" tam={18} cor="#fff" />Desejo</button>
      {aberto && (
        <div className="balao-fundo" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
          <div className="balao" role="dialog" aria-modal="true" aria-labelledby="desejo-tit">
            <div className="balao-ic" style={{ background: 'var(--mel-fundo)', color: 'var(--mel)' }}><Icone nome="presente" tam={26} /></div>
            <h2 id="desejo-tit">Novo desejo</h2>
            <p>Seus responsáveis veem e combinam com você quantas {moeda === 'semanas' ? 'semanas' : 'estrelinhas'} ele vale.</p>
            <Form acao={sugerirDesejo} aoEnviado={() => setTimeout(fechar, 1400)}>
              <div className="rot-sug">
                <label htmlFor="desejo-nome" style={{ marginTop: 0 }}>O que você quer?</label>
                <button type="button" className="btn peq sugestao-btn" onClick={() => setFolha(true)}><Icone nome="lampada" tam={18} cor="#fff" />Sugestões</button>
              </div>
              <input id="desejo-nome" name="nome" maxLength={80} placeholder="Ex.: patins" autoComplete="off" required value={nome} onChange={(e) => setNome(e.target.value)} />
              <div style={{ marginTop: 10 }}><Foto nome="foto" familia={familia} membro={membro} /></div>
              <div className="balao-bts" style={{ marginTop: 14 }}>
                <button className="btn">Enviar</button>
                <button type="button" className="btn sec" onClick={fechar}>Cancelar</button>
              </div>
            </Form>
          </div>
        </div>
      )}
      {aberto && folha && (
        <div className="folha" role="dialog" aria-modal="true" aria-label="Sugestões de desejos">
          <div className="folha-in">
            <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setFolha(false)}><Icone nome="esq" tam={26} /></button><h2>Sugestões</h2></div>
            <div className="grade-cat" role="group" aria-label="Categoria">
              {cats.map((c, i) => <button key={c.nome} type="button" className={cat === i ? 'on' : ''} aria-pressed={cat === i} onClick={() => setCat(i)}><Icone nome={ICONE_DESEJO[c.nome] || 'etiqueta'} tam={22} larg={1.8} /><span>{c.nome}</span></button>)}
            </div>
            <div className="folha-lista">
              {(cats[cat]?.itens || []).map((n) => (
                <button key={n} type="button" onClick={() => { setNome(n); setFolha(false); }}><span>{n}</span><span aria-hidden="true">›</span></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
