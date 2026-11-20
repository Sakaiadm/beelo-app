'use client';
import { useState } from 'react';
import Form from './Form';
import { salvarAvisos } from '@/app/acoes';

const ITENS = [
  ['concluir', 'Quando alguém concluir uma tarefa'],
  ['so_foto', 'Só quando concluir com foto', 'Vale quando o de cima está ligado'],
  ['justificativa', 'Quando justificar uma tarefa não feita'],
  ['adiamento', 'Quando pedir para adiar'],
  ['tela', 'Quando propor tempo de tela'],
  ['tarefa_filho', 'Quando criar uma tarefa para si'],
];

export default function AvisosGestor({ inicial }) {
  const [v, setV] = useState({
    concluir: inicial.concluida !== 'nenhuma', so_foto: inicial.concluida === 'com_foto',
    justificativa: inicial.justificativa !== false, adiamento: inicial.adiamento !== false,
    tela: inicial.tela !== false, tarefa_filho: inicial.tarefa_filho !== false,
  });
  const principais = ['concluir', 'justificativa', 'adiamento', 'tela', 'tarefa_filho'];
  const tudo = principais.every((k) => v[k]);
  const marcarTudo = () => setV((x) => { const n = { ...x }; principais.forEach((k) => { n[k] = !tudo; }); if (!tudo) n.so_foto = false; return n; });
  const troca = (k) => setV((x) => ({ ...x, [k]: !x[k] }));
  return (
    <Form acao={salvarAvisos} okTxt="Preferências salvas.">
      {Object.entries(v).map(([k, on]) => on && <input key={k} type="hidden" name={k} value="1" />)}
      <div className="lin-chave destaque">
        <span><b>Avisar tudo</b><small>Liga ou desliga todos de uma vez</small></span>
        <button type="button" role="switch" aria-checked={tudo} aria-label="Avisar tudo" className={`chave ${tudo ? 'on' : ''}`} onClick={marcarTudo} />
      </div>
      {ITENS.map(([k, t, ajuda]) => (
        <div className={`lin-chave${k === 'so_foto' ? ' detalhe' : ''}`} key={k} style={k === 'so_foto' && !v.concluir ? { opacity: 0.5 } : undefined}>
          <span>{t}{ajuda && <small>{ajuda}</small>}</span>
          <button type="button" role="switch" aria-checked={v[k]} aria-label={t} disabled={k === 'so_foto' && !v.concluir} className={`chave ${v[k] ? 'on' : ''}`} onClick={() => troca(k)} />
        </div>
      ))}
      <p className="rodape-av">Cada pai ou mãe escolhe os próprios avisos. Os avisos aparecem no sino do app.</p>
      <button className="btn cheio">Salvar avisos</button>
    </Form>
  );
}
