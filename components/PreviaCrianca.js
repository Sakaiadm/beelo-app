// @arquivo  components/PreviaCrianca.js: prévia "como a criança vai ver o beelo" (Divertido x Calmo), mostrada ao gestor no cadastro.
// @tipo     componente
// @usa      lib/festaAnim.js (desenho da Mel), lib/jeito.js (nomes dos jeitos)
// @usado-por components/PessoaForm.js (só com o Guia da Mel ligado e o modo criança ativo)
// @decisao 25/11 Thomas: o modo criança muda muito a mecânica; o gestor precisa ver isso na hora de cadastrar.
'use client';
import { abelhaMel } from '@/lib/festaAnim';

const ESTRELA = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

function Tela({ id, nome, escolhido }) {
  const divertido = id === 'divertido';
  return (
    <div className={`previa-cr ${escolhido ? 'on' : ''}`}>
      <b>{divertido ? 'Divertido' : 'Calmo'}{escolhido && <i className="previa-sel">escolhido</i>}</b>
      <div className="previa-tel" aria-hidden="true">
        <div className="previa-topo">beelo</div>
        <div className="previa-corpo">
          <div className="previa-tit">{divertido ? (nome ? `Oi, ${nome}!` : 'Oi!') : (nome || 'Hoje')}</div>
          <div className="previa-linha"><i className="previa-o" /><span className="t">Escovar os dentes</span></div>
          <div className="previa-linha"><i className="previa-o ok" /><span className="t">Arrumar a cama</span><svg width="14" height="14" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}><path d={ESTRELA} fill="#f5b82e" /></svg></div>
        </div>
        <span className="previa-mel" dangerouslySetInnerHTML={{ __html: abelhaMel(divertido ? 46 : 24) }} />
      </div>
      <small>{divertido ? 'Estrelinhas, sons, festa e a Mel grande a cada tarefa.' : 'As mesmas estrelinhas, festa curtinha e a Mel pequena.'}</small>
    </div>
  );
}

// jeito: o jeito escolhido no cadastro (divertido, calmo ou adultos).
export default function PreviaCrianca({ nome, jeito }) {
  const n = (nome || '').trim().split(' ')[0];
  return (
    <div className="previa-crianca" role="group" aria-label="Como a criança vai ver o beelo">
      <p className="peq-cinza" style={{ margin: '14px 0 8px', fontWeight: 700 }}>{n ? `Assim ${n} vai ver o beelo` : 'Assim a criança vai ver o beelo'}</p>
      <div className="previa-grade">
        <Tela id="divertido" nome={n} escolhido={jeito === 'divertido'} />
        <Tela id="calmo" nome={n} escolhido={jeito === 'calmo'} />
      </div>
      <p className="peq-cinza" style={{ margin: '8px 0 0' }}>No modo criança a pessoa vê só o que é dela: tarefas, estrelinhas, prêmios e lista de desejos. Você acompanha tudo pelo Painel.</p>
    </div>
  );
}
