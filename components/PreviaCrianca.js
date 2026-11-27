// @arquivo  components/PreviaCrianca.js: prévia "como a criança vai ver o beelo" (Divertido, Calmo e Como os adultos; selecionável no cadastro), mostrada ao gestor no cadastro.
// @tipo     componente
// @usa      lib/festaAnim.js (desenho da Mel), lib/jeito.js (nomes dos jeitos)
// @usado-por components/PessoaForm.js (só com o Guia da Mel ligado e o modo criança ativo)
// @decisao 25/11 Thomas: o modo criança muda muito a mecânica; o gestor precisa ver isso na hora de cadastrar.
'use client';
import { abelhaMel } from '@/lib/festaAnim';

const ESTRELA = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

const NOMES = { divertido: 'Divertido', calmo: 'Calmo', adultos: 'Como os adultos' };
const DESC = {
  divertido: 'Estrelinhas, sons, festa e a Mel grande a cada tarefa.',
  calmo: 'As mesmas estrelinhas, festa curtinha e a Mel pequena.',
  adultos: 'Tela limpa, só com o essencial do dia.',
};

// onMudar: quando existe, a miniatura inteira é um botão de escolha (cadastro da pessoa).
function Tela({ id, nome, escolhido, onMudar }) {
  const divertido = id === 'divertido';
  const adultos = id === 'adultos';
  const tit = divertido ? (nome ? `Oi, ${nome}!` : 'Oi!') : (nome || 'Hoje');
  const conteudo = (
    <>
      <b>{NOMES[id]}{escolhido && <i className="previa-sel">escolhido</i>}</b>
      <div className="previa-tel" aria-hidden="true">
        <div className="previa-topo">beelo</div>
        <div className="previa-corpo">
          <div className="previa-tit">{tit}</div>
          <div className="previa-linha"><i className="previa-o" /><span className="t">Escovar os dentes</span></div>
          <div className="previa-linha"><i className="previa-o ok" /><span className="t">Arrumar a cama</span>
            {!adultos && <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}><path d={ESTRELA} fill="#f5b82e" /></svg>}
          </div>
        </div>
        {!adultos && <span className="previa-mel" dangerouslySetInnerHTML={{ __html: abelhaMel(divertido ? 46 : 24) }} />}
      </div>
      <small>{DESC[id]}</small>
    </>
  );
  const cls = `previa-cr ${escolhido ? 'on' : ''} ${adultos ? 'larga' : ''}`;
  if (!onMudar) return <div className={cls}>{conteudo}</div>;
  return <button type="button" role="radio" aria-checked={escolhido} className={`${cls} escolha`} onClick={() => onMudar(id)}>{conteudo}</button>;
}

// jeito: o jeito escolhido (divertido, calmo ou adultos). onMudar(id): torna as miniaturas selecionáveis.
export default function PreviaCrianca({ nome, jeito, onMudar }) {
  const n = (nome || '').trim().split(' ')[0];
  return (
    <div className="previa-crianca" role={onMudar ? 'radiogroup' : 'group'} aria-label="Jeito de ver o beelo">
      <p className="peq-cinza" style={{ margin: '14px 0 8px', fontWeight: 700 }}>{n ? `Assim ${n} vai ver o beelo` : 'Assim a criança vai ver o beelo'}</p>
      <div className="previa-grade">
        {['divertido', 'calmo', 'adultos'].map((id) => <Tela key={id} id={id} nome={n} escolhido={jeito === id} onMudar={onMudar} />)}
      </div>
      <p className="peq-cinza" style={{ margin: '8px 0 0' }}>No modo criança a pessoa vê só o que é dela: tarefas, estrelinhas, prêmios e lista de desejos. Você acompanha tudo pelo Painel.</p>
    </div>
  );
}
